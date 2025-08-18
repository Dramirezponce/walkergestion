// WalkerGestion - Process Renditions Edge Function
// 💚⚪ Verde y Blanco - Santiago Wanderers

import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.1"
import { corsHeaders } from "../_shared/cors.ts"

interface RenditionRequest {
  cash_register_id: string
  cashier_id: string
  business_unit_id: string
  actual_amount: number
  notes?: string
  breakdown?: {
    bills_1000?: number
    bills_2000?: number
    bills_5000?: number
    bills_10000?: number
    bills_20000?: number
    coins?: number
    cards?: number
    transfers?: number
  }
}

interface RenditionResponse {
  success: boolean
  rendition_id?: string
  expected_amount?: number
  difference_amount?: number
  sales_summary?: {
    total_sales: number
    sales_count: number
    by_payment_method: Record<string, number>
  }
  discrepancies?: string[]
  message?: string
  error?: string
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

/**
 * Calculate expected amount based on sales for the day
 */
async function calculateExpectedAmount(
  cashRegisterId: string, 
  date: string = new Date().toISOString().split('T')[0]
): Promise<{
  expected_amount: number
  sales_count: number
  total_sales_amount: number
  by_payment_method: Record<string, number>
}> {
  try {
    // Get all sales for the cash register for the specified date
    const { data: sales, error } = await supabase
      .from('sales')
      .select('amount, payment_method, total_amount')
      .eq('cash_register_id', cashRegisterId)
      .eq('sale_date', date)

    if (error) {
      console.error('❌ Error fetching sales:', error)
      throw error
    }

    if (!sales || sales.length === 0) {
      return {
        expected_amount: 0,
        sales_count: 0,
        total_sales_amount: 0,
        by_payment_method: {}
      }
    }

    // Calculate totals by payment method
    const byPaymentMethod: Record<string, number> = {}
    let totalCash = 0
    let totalSales = 0

    sales.forEach(sale => {
      const amount = sale.total_amount || sale.amount
      totalSales += amount

      if (!byPaymentMethod[sale.payment_method]) {
        byPaymentMethod[sale.payment_method] = 0
      }
      byPaymentMethod[sale.payment_method] += amount

      // Only cash sales affect expected cash amount
      if (sale.payment_method === 'cash') {
        totalCash += amount
      }
    })

    // Get cash register initial amount
    const { data: cashRegister, error: registerError } = await supabase
      .from('cash_registers')
      .select('initial_amount')
      .eq('id', cashRegisterId)
      .single()

    if (registerError) {
      console.error('❌ Error fetching cash register:', registerError)
      throw registerError
    }

    const expectedAmount = (cashRegister?.initial_amount || 0) + totalCash

    return {
      expected_amount: expectedAmount,
      sales_count: sales.length,
      total_sales_amount: totalSales,
      by_payment_method: byPaymentMethod
    }

  } catch (error) {
    console.error('❌ Error calculating expected amount:', error)
    throw error
  }
}

/**
 * Validate rendition data and check for discrepancies
 */
function validateRendition(
  actualAmount: number,
  expectedAmount: number,
  breakdown?: RenditionRequest['breakdown']
): string[] {
  const discrepancies: string[] = []

  // Check if actual amount matches breakdown
  if (breakdown) {
    const calculatedTotal = (
      (breakdown.bills_1000 || 0) * 1000 +
      (breakdown.bills_2000 || 0) * 2000 +
      (breakdown.bills_5000 || 0) * 5000 +
      (breakdown.bills_10000 || 0) * 10000 +
      (breakdown.bills_20000 || 0) * 20000 +
      (breakdown.coins || 0) +
      (breakdown.cards || 0) +
      (breakdown.transfers || 0)
    )

    if (Math.abs(calculatedTotal - actualAmount) > 0.01) {
      discrepancies.push(`Breakdown total (${calculatedTotal}) doesn't match actual amount (${actualAmount})`)
    }
  }

  // Check for significant differences
  const difference = Math.abs(actualAmount - expectedAmount)
  const percentageDiff = expectedAmount > 0 ? (difference / expectedAmount) * 100 : 0

  if (difference > 1000) {
    discrepancies.push(`Large difference detected: $${difference.toFixed(2)}`)
  }

  if (percentageDiff > 5 && expectedAmount > 0) {
    discrepancies.push(`High percentage difference: ${percentageDiff.toFixed(1)}%`)
  }

  if (actualAmount < 0) {
    discrepancies.push('Negative actual amount not allowed')
  }

  return discrepancies
}

/**
 * Update cash register current amount
 */
async function updateCashRegisterAmount(
  cashRegisterId: string,
  newAmount: number
): Promise<void> {
  try {
    const { error } = await supabase
      .from('cash_registers')
      .update({ 
        current_amount: newAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', cashRegisterId)

    if (error) {
      console.error('❌ Error updating cash register:', error)
      throw error
    }

    console.log(`✅ Updated cash register ${cashRegisterId} amount to ${newAmount}`)
  } catch (error) {
    console.error('❌ Error updating cash register amount:', error)
    throw error
  }
}

/**
 * Main handler for processing renditions
 */
async function processRendition(request: RenditionRequest): Promise<RenditionResponse> {
  try {
    console.log('🔄 Processing rendition for cash register:', request.cash_register_id)

    // Calculate expected amount based on sales
    const salesSummary = await calculateExpectedAmount(request.cash_register_id)

    // Validate rendition
    const discrepancies = validateRendition(
      request.actual_amount,
      salesSummary.expected_amount,
      request.breakdown
    )

    const differenceAmount = request.actual_amount - salesSummary.expected_amount

    // Create rendition record
    const { data: rendition, error: renditionError } = await supabase
      .from('renditions')
      .insert({
        cash_register_id: request.cash_register_id,
        cashier_id: request.cashier_id,
        business_unit_id: request.business_unit_id,
        expected_amount: salesSummary.expected_amount,
        actual_amount: request.actual_amount,
        sales_count: salesSummary.sales_count,
        total_sales_amount: salesSummary.total_sales_amount,
        notes: request.notes,
        breakdown: request.breakdown || {},
        rendition_date: new Date().toISOString().split('T')[0],
        is_approved: Math.abs(differenceAmount) <= 100, // Auto-approve small differences
        created_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (renditionError) {
      console.error('❌ Error creating rendition:', renditionError)
      throw renditionError
    }

    // Update cash register amount
    await updateCashRegisterAmount(request.cash_register_id, request.actual_amount)

    // Create alert if there are significant discrepancies
    if (discrepancies.length > 0 || Math.abs(differenceAmount) > 500) {
      await supabase
        .from('alerts')
        .insert({
          business_unit_id: request.business_unit_id,
          user_id: request.cashier_id,
          title: 'Rendition Discrepancy Detected',
          message: `Rendition for ${new Date().toLocaleDateString()} has discrepancies: ${discrepancies.join(', ')}. Difference: $${differenceAmount.toFixed(2)}`,
          alert_type: 'system',
          priority: Math.abs(differenceAmount) > 1000 ? 'high' : 'medium',
          data: {
            rendition_id: rendition.id,
            difference_amount: differenceAmount,
            discrepancies
          }
        })
    }

    console.log('✅ Rendition processed successfully:', rendition.id)

    return {
      success: true,
      rendition_id: rendition.id,
      expected_amount: salesSummary.expected_amount,
      difference_amount: differenceAmount,
      sales_summary: {
        total_sales: salesSummary.total_sales_amount,
        sales_count: salesSummary.sales_count,
        by_payment_method: salesSummary.by_payment_method
      },
      discrepancies: discrepancies.length > 0 ? discrepancies : undefined,
      message: discrepancies.length === 0 
        ? 'Rendition processed successfully' 
        : 'Rendition processed with discrepancies'
    }

  } catch (error) {
    console.error('❌ Error processing rendition:', error)
    return {
      success: false,
      error: `Failed to process rendition: ${error.message}`
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const requestData: RenditionRequest = await req.json()

    // Validate required fields
    if (!requestData.cash_register_id || !requestData.cashier_id || 
        !requestData.business_unit_id || requestData.actual_amount === undefined) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: cash_register_id, cashier_id, business_unit_id, actual_amount' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify user has permission to create renditions for this cashier
    if (requestData.cashier_id !== user.id) {
      // Check if user is manager/admin of the business unit
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('role, business_unit_id, company_id')
        .eq('id', user.id)
        .single()

      if (!userProfile || 
          (userProfile.role === 'cashier' && userProfile.id !== requestData.cashier_id) ||
          (userProfile.role === 'manager' && userProfile.business_unit_id !== requestData.business_unit_id)) {
        return new Response(
          JSON.stringify({ error: 'Insufficient permissions' }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Process the rendition
    const result = await processRendition(requestData)

    return new Response(
      JSON.stringify(result),
      { 
        status: result.success ? 200 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// ============================================================================
// DEPLOYMENT INSTRUCTIONS
// ============================================================================

/*
🚀 DEPLOYMENT INSTRUCTIONS:

1. Deploy this function:
   supabase functions deploy process-renditions --project-ref boyhheuwgtyeevijxhzb

2. Set environment variables:
   supabase secrets set SUPABASE_URL=https://boyhheuwgtyeevijxhzb.supabase.co
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

3. Test the function:
   curl -X POST 'https://boyhheuwgtyeevijxhzb.supabase.co/functions/v1/process-renditions' \
     -H 'Authorization: Bearer your_anon_key' \
     -H 'Content-Type: application/json' \
     -d '{
       "cash_register_id": "uuid",
       "cashier_id": "uuid", 
       "business_unit_id": "uuid",
       "actual_amount": 150000,
       "notes": "End of day rendition",
       "breakdown": {
         "bills_20000": 5,
         "bills_10000": 3,
         "bills_5000": 4,
         "coins": 2000
       }
     }'

4. Usage in frontend:
   import { processRendition } from './lib/renditions'
   
   const result = await processRendition({
     cash_register_id: registerId,
     cashier_id: userId,
     business_unit_id: unitId,
     actual_amount: 150000,
     breakdown: { ... }
   })

💚⚪ Verde y Blanco - Santiago Wanderers
*/