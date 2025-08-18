export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatDate = (dateString: string) => {
  if (!dateString) return 'Fecha no disponible';
  try {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    return 'Fecha inválida';
  }
};

export const getBusinessUnitName = (id: string, businessUnits: any[]) => {
  if (!id) return 'Sin unidad';
  const unit = businessUnits.find(u => u && u.id === id);
  return unit ? unit.name : `Unidad ${id}`;
};

export const getStatusBadge = (status: string) => {
  const statusMap = {
    draft: { label: 'Borrador', class: 'bg-gray-100 text-gray-800' },
    submitted: { label: 'Enviada', class: 'bg-blue-100 text-blue-800' },
    approved: { label: 'Aprobada', class: 'bg-green-100 text-green-800' },
    rejected: { label: 'Rechazada', class: 'bg-red-100 text-red-800' },
    pending: { label: 'Pendiente', class: 'bg-yellow-100 text-yellow-800' },
    received: { label: 'Recibida', class: 'bg-green-100 text-green-800' },
    completed: { label: 'Completada', class: 'bg-green-100 text-green-800' }
  };
  
  const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.draft;
  
  return {
    label: statusInfo.label,
    className: statusInfo.class
  };
};

export const getAvailableTransfers = (transfers: any[]) => {
  return transfers.filter(transfer => 
    transfer.status === 'received' || transfer.status === 'pending'
  );
};

export const createNewExpense = (expenseData: any) => {
  return {
    id: `temp-${Date.now()}`,
    description: expenseData.description,
    amount: parseFloat(expenseData.amount),
    provider: expenseData.provider,
    provider_type: expenseData.provider_type,
    payment_method: expenseData.payment_method,
    document_type: expenseData.document_type,
    document_number: expenseData.document_number,
    is_paid: expenseData.is_paid,
    expense_date: expenseData.expense_date,
    created_at: new Date().toISOString()
  };
};