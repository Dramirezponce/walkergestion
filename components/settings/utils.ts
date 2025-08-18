export const getStatusColor = (status: string) => {
  switch (status) {
    case 'healthy': return 'text-green-600';
    case 'warning': return 'text-yellow-600';
    case 'error': return 'text-red-600';
    default: return 'text-gray-600';
  }
};

export const getStatusIcon = (status: boolean) => {
  return status ? 'CheckCircle' : 'X';
};

export const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('es-CL');
};

export const validateProfileData = (profile: any) => {
  const errors: string[] = [];
  
  if (!profile.name) errors.push('Nombre es obligatorio');
  if (!profile.email) errors.push('Email es obligatorio');
  
  if (profile.newPassword) {
    if (profile.newPassword !== profile.confirmPassword) {
      errors.push('Las contraseñas no coinciden');
    }
    if (profile.newPassword.length < 6) {
      errors.push('La contraseña debe tener al menos 6 caracteres');
    }
  }
  
  return errors;
};

export const validateCompanyData = (company: any) => {
  const errors: string[] = [];
  
  if (!company.name) errors.push('Nombre de empresa es obligatorio');
  
  return errors;
};