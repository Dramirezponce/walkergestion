// WalkerGestion - Generate Reports Edge Function
// 💚⚪ Verde y Blanco - Santiago Wanderers

import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.1"
import { corsHeaders } from "../_shared/cors.ts"

interface ReportRequest {
  type: 'sales' | 'cashflows' | 'renditions' | 'goals' | 'comprehensive'
  business_unit_id?: string
  company_id?: string
  start_date: string
  end_date: string
  group_by?: 'day' | 'week' | 'month'
  include_details?: boolean
  format?: 'json' | 'csv'
}

interface ReportResponse {
  success: boolean
  report_id?: string
  data?: any
  summary?: {
    total_sales?: number
    total_expenses?: number
    net_profit?: number
    sales_count?: number
    average_sale?: number
    top_performers?: any[]
  }
  metadata?: {
    generated_at: string
    period: string
    business_units: string[]
    record_count: number
  }
  error?: string
  download_url?: string
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

/**
 * Generate sales report with aggregated data
 */
async function generateSalesReport(
  businessUnitId: string | undefined,
  companyId: string | undefined,
  startDate: string,
  endDate: string,
  groupBy: string = 'day'
): Promise<any> {
  try {
    let query = supabase
      .from('sales')
      .select(`
        *,
        cashier:user_profiles!cashier_id(name, email),
        cash_register:cash_registers(name),
        business_unit:business_units(name, company_id)
      `)
      .gte('sale_date', startDate)
      .lte('sale_date', endDate)
      .order('sale_date', { ascending: false })

    if (businessUnitId) {
      query = query.eq('business_unit_id', businessUnitId)
    } else if (companyId) {
      query = query.eq('business_unit.company_id', companyId)
    }

    const { data: sales, error } = await query

    if (error) {
      console.error('❌ Error fetching sales:', error)
      throw error
    }

    // Group data by specified period
    const groupedData = groupDataByPeriod(sales || [], groupBy, 'sale_date')

    // Calculate summary statistics
    const totalSales = sales?.reduce((sum, sale) => sum + (sale.total_amount || sale.amount), 0) || 0
    const salesCount = sales?.length || 0
    const averageSale = salesCount > 0 ? totalSales / salesCount : 0

    // Payment method breakdown
    const paymentMethodBreakdown = sales?.reduce((acc, sale) => {
      const method = sale.payment_method
      if (!acc[method]) acc[method] = { count: 0, amount: 0 }
      acc[method].count++
      acc[method].amount += sale.total_amount || sale.amount
      return acc
    }, {} as Record<string, { count: number; amount: number }>) || {}

    // Top performers (cashiers)
    const cashierPerformance = sales?.reduce((acc, sale) => {
      const cashierName = sale.cashier?.name || 'Unknown'
      if (!acc[cashierName]) {
        acc[cashierName] = { 
          name: cashierName, 
          sales_count: 0, 
          total_amount: 0,
          average_sale: 0 
        }
      }
      acc[cashierName].sales_count++
      acc[cashierName].total_amount += sale.total_amount || sale.amount
      acc[cashierName].average_sale = acc[cashierName].total_amount / acc[cashierName].sales_count
      return acc
    }, {} as Record<string, any>) || {}

    const topPerformers = Object.values(cashierPerformance)
      .sort((a: any, b: any) => b.total_amount - a.total_amount)
      .slice(0, 10)

    return {
      grouped_data: groupedData,
      raw_data: sales,
      summary: {
        total_sales: totalSales,
        sales_count: salesCount,
        average_sale: averageSale,
        payment_method_breakdown: paymentMethodBreakdown,
        top_performers: topPerformers
      }
    }

  } catch (error) {
    console.error('❌ Error generating sales report:', error)
    throw error
  }
}

/**
 * Generate cashflows report
 */
async function generateCashflowsReport(
  businessUnitId: string | undefined,
  companyId: string | undefined,
  startDate: string,
  endDate: string,
  groupBy: string = 'day'
): Promise<any> {
  try {
    let query = supabase
      .from('cashflows')
      .select(`
        *,
        user:user_profiles(name, email),
        business_unit:business_units(name, company_id)
      `)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .order('transaction_date', { ascending: false })

    if (businessUnitId) {
      query = query.eq('business_unit_id', businessUnitId)
    } else if (companyId) {
      // This would need a join or separate query for company filtering
    }

    const { data: cashflows, error } = await query

    if (error) {
      console.error('❌ Error fetching cashflows:', error)
      throw error
    }

    // Separate income and expenses
    const income = cashflows?.filter(cf => cf.amount > 0) || []
    const expenses = cashflows?.filter(cf => cf.amount < 0) || []

    const totalIncome = income.reduce((sum, cf) => sum + cf.amount, 0)
    const totalExpenses = Math.abs(expenses.reduce((sum, cf) => sum + cf.amount, 0))
    const netProfit = totalIncome - totalExpenses

    // Group by category
    const categoryBreakdown = cashflows?.reduce((acc, cf) => {
      const category = cf.category
      if (!acc[category]) {
        acc[category] = { 
          income: 0, 
          expenses: 0, 
          count: 0,
          net: 0 
        }
      }
      if (cf.amount > 0) {
        acc[category].income += cf.amount
      } else {
        acc[category].expenses += Math.abs(cf.amount)
      }
      acc[category].count++
      acc[category].net = acc[category].income - acc[category].expenses
      return acc
    }, {} as Record<string, any>) || {}

    // Group data by period
    const groupedData = groupDataByPeriod(cashflows || [], groupBy, 'transaction_date')

    return {
      grouped_data: groupedData,
      raw_data: cashflows,
      summary: {
        total_income: totalIncome,
        total_expenses: totalExpenses,
        net_profit: netProfit,
        transaction_count: cashflows?.length || 0,
        category_breakdown: categoryBreakdown
      }
    }

  } catch (error) {
    console.error('❌ Error generating cashflows report:', error)
    throw error
  }
}

/**
 * Generate comprehensive report combining all data
 */
async function generateComprehensiveReport(
  businessUnitId: string | undefined,
  companyId: string | undefined,
  startDate: string,
  endDate: string,
  groupBy: string = 'day'
): Promise<any> {
  try {
    const [salesReport, cashflowsReport] = await Promise.all([
      generateSalesReport(businessUnitId, companyId, startDate, endDate, groupBy),
      generateCashflowsReport(businessUnitId, companyId, startDate, endDate, groupBy)
    ])

    // Get additional data
    const { data: renditions } = await supabase
      .from('renditions')
      .select('*')
      .gte('rendition_date', startDate)
      .lte('rendition_date', endDate)
      .eq('business_unit_id', businessUnitId || '')

    const { data: goals } = await supabase
      .from('goals')
      .select('*')
      .eq('business_unit_id', businessUnitId || '')
      .eq('is_active', true)

    // Calculate KPIs
    const totalRevenue = salesReport.summary.total_sales
    const totalExpenses = Math.abs(cashflowsReport.summary.total_expenses)
    const grossProfit = totalRevenue - totalExpenses
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0

    // Rendition accuracy
    const renditionAccuracy = renditions?.length > 0 
      ? renditions.filter(r => Math.abs(r.difference_amount) <= 100).length / renditions.length * 100
      : 100

    // Goal achievement
    const achievedGoals = goals?.filter(g => g.current_amount >= g.target_amount).length || 0
    const totalGoals = goals?.length || 0
    const goalAchievementRate = totalGoals > 0 ? (achievedGoals / totalGoals) * 100 : 0

    return {
      sales: salesReport,
      cashflows: cashflowsReport,
      renditions: {
        data: renditions,
        accuracy_percentage: renditionAccuracy,
        total_discrepancy: renditions?.reduce((sum, r) => sum + Math.abs(r.difference_amount), 0) || 0
      },
      goals: {
        data: goals,
        achievement_rate: goalAchievementRate,
        achieved_count: achievedGoals,
        total_count: totalGoals
      },
      kpis: {
        total_revenue: totalRevenue,
        total_expenses: totalExpenses,
        gross_profit: grossProfit,
        profit_margin: profitMargin,
        rendition_accuracy: renditionAccuracy,
        goal_achievement_rate: goalAchievementRate
      }
    }

  } catch (error) {
    console.error('❌ Error generating comprehensive report:', error)
    throw error
  }
}

/**
 * Group data by time period (day, week, month)
 */
function groupDataByPeriod(data: any[], groupBy: string, dateField: string): any {
  return data.reduce((acc, item) => {
    const date = new Date(item[dateField])
    let key: string

    switch (groupBy) {
      case 'day':
        key = date.toISOString().split('T')[0]
        break
      case 'week':
        const weekStart = new Date(date.setDate(date.getDate() - date.getDay()))
        key = weekStart.toISOString().split('T')[0]
        break
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        break
      default:
        key = date.toISOString().split('T')[0]
    }

    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(item)

    return acc
  }, {} as Record<string, any[]>)
}

/**
 * Convert data to CSV format
 */
function convertToCSV(data: any[], type: string): string {
  if (!data || data.length === 0) return ''

  // Define headers based on report type
  const headers: Record<string, string[]> = {
    sales: ['Date', 'Amount', 'Payment Method', 'Cashier', 'Business Unit', 'Description'],
    cashflows: ['Date', 'Amount', 'Type', 'Category', 'Description', 'User'],
    renditions: ['Date', 'Expected', 'Actual', 'Difference', 'Cashier', 'Approved']
  }

  const csvHeaders = headers[type] || Object.keys(data[0])
  
  const csvRows = [
    csvHeaders.join(','),
    ...data.map(row => {
      return csvHeaders.map(header => {
        const value = row[header.toLowerCase().replace(' ', '_')] || ''
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
      }).join(',')
    })
  ]

  return csvRows.join('\n')
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

    // Parse request
    const url = new URL(req.url)
    const reportType = url.searchParams.get('type') || 'sales'
    const businessUnitId = url.searchParams.get('business_unit_id')
    const companyId = url.searchParams.get('company_id')
    const startDate = url.searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const endDate = url.searchParams.get('end_date') || new Date().toISOString().split('T')[0]
    const groupBy = url.searchParams.get('group_by') || 'day'
    const format = url.searchParams.get('format') || 'json'

    console.log(`📊 Generating ${reportType} report for period ${startDate} to ${endDate}`)

    // Verify user has permission to access the requested data
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role, business_unit_id, company_id')
      .eq('id', user.id)
      .single()

    if (!userProfile) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Apply access control
    let effectiveBusinessUnitId = businessUnitId
    let effectiveCompanyId = companyId

    if (userProfile.role === 'cashier') {
      effectiveBusinessUnitId = userProfile.business_unit_id
      effectiveCompanyId = undefined
    } else if (userProfile.role === 'manager') {
      effectiveBusinessUnitId = businessUnitId || userProfile.business_unit_id
      effectiveCompanyId = undefined
    } else if (userProfile.role === 'admin') {
      effectiveCompanyId = companyId || userProfile.company_id
    }

    // Generate report based on type
    let reportData: any

    switch (reportType) {
      case 'sales':
        reportData = await generateSalesReport(effectiveBusinessUnitId, effectiveCompanyId, startDate, endDate, groupBy)
        break
      case 'cashflows':
        reportData = await generateCashflowsReport(effectiveBusinessUnitId, effectiveCompanyId, startDate, endDate, groupBy)
        break
      case 'comprehensive':
        reportData = await generateComprehensiveReport(effectiveBusinessUnitId, effectiveCompanyId, startDate, endDate, groupBy)
        break
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid report type' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }

    // Generate report ID for tracking
    const reportId = crypto.randomUUID()

    const response: ReportResponse = {
      success: true,
      report_id: reportId,
      data: reportData,
      metadata: {
        generated_at: new Date().toISOString(),
        period: `${startDate} to ${endDate}`,
        business_units: effectiveBusinessUnitId ? [effectiveBusinessUnitId] : ['all'],
        record_count: Array.isArray(reportData.raw_data) ? reportData.raw_data.length : 0
      }
    }

    // Handle CSV format
    if (format === 'csv') {
      const csvData = convertToCSV(reportData.raw_data || [], reportType)
      
      return new Response(csvData, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="walkergestion_${reportType}_${startDate}_${endDate}.csv"`
        }
      })
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 200,
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
   supabase functions deploy generate-report --project-ref boyhheuwgtyeevijxhzb

2. Test the function:
   curl 'https://boyhheuwgtyeevijxhzb.supabase.co/functions/v1/generate-report?type=comprehensive&start_date=2024-01-01&end_date=2024-12-31&format=json' \
     -H 'Authorization: Bearer your_anon_key'

3. Usage examples:
   
   # Sales report
   GET /functions/v1/generate-report?type=sales&business_unit_id=uuid&start_date=2024-01-01&end_date=2024-01-31

   # Comprehensive report as CSV
   GET /functions/v1/generate-report?type=comprehensive&format=csv&group_by=month

   # Cashflows report by week
   GET /functions/v1/generate-report?type=cashflows&group_by=week&start_date=2024-01-01

4. Frontend integration:
   import { generateReport } from './lib/reports'
   
   const report = await generateReport({
     type: 'comprehensive',
     business_unit_id: unitId,
     start_date: '2024-01-01',
     end_date: '2024-01-31',
     group_by: 'week'
   })

💚⚪ Verde y Blanco - Santiago Wanderers
*/