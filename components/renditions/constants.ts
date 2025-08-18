export const INITIAL_EXPENSE_DATA = {
  description: '',
  amount: '',
  provider: '',
  provider_type: 'servicio',
  payment_method: 'efectivo',
  document_type: 'boleta' as const,
  document_number: '',
  is_paid: false,
  expense_date: new Date().toISOString().split('T')[0]
};

export const PROVIDER_TYPES = [
  { value: 'servicio', label: 'Servicio' },
  { value: 'producto', label: 'Producto' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'suministro', label: 'Suministro' },
  { value: 'otros', label: 'Otros' }
];

export const PAYMENT_METHODS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'tarjeta', label: 'Tarjeta' }
];

export const DOCUMENT_TYPES = [
  { value: 'boleta', label: 'Boleta' },
  { value: 'factura', label: 'Factura' }
];