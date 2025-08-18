export const SETTINGS_TABS = {
  PROFILE: 'profile',
  COMPANY: 'company',
  SYSTEM: 'system',
  MAINTENANCE: 'maintenance'
} as const;

export const DEFAULT_USER_PROFILE = {
  name: '',
  email: '',
  phone: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
};

export const DEFAULT_COMPANY_SETTINGS = {
  name: '',
  description: '',
  logo_url: ''
};

export const DEFAULT_SYSTEM_CONFIG = {
  maintenanceMode: false,
  allowRegistrations: true,
  sessionTimeout: 30,
  maxFileSize: 10,
  backupFrequency: 'daily'
};

export const SYSTEM_STATUS_COLORS = {
  healthy: 'text-green-600',
  warning: 'text-yellow-600',
  error: 'text-red-600'
} as const;

export const MAINTENANCE_ACTIONS = {
  BACKUP: 'backup',
  RESTORE: 'restore',
  CLEANUP: 'cleanup'
} as const;