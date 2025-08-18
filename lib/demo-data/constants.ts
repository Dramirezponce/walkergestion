import { MockUser, MockCompany } from './types';

// Datos mock del usuario demo
export const DEMO_USER: MockUser = {
  id: 'demo-admin-daniel',
  name: 'Daniel Ramírez',
  email: 'd.ramirez.ponce@gmail.com',
  role: 'admin',
  company: 'WalkerGestión Demo',
  businessUnit: 'Administración Central',
  company_id: 'demo-company-2024',
  business_unit_id: 'demo-admin-unit',
  avatar: '👨‍💼'
};

// Empresas demo con más variedad
export const DEMO_COMPANIES: MockCompany[] = [
  {
    id: 'demo-company-2024',
    name: 'WalkerGestión Demo',
    rut: '12.345.678-9',
    address: 'Av. Santiago Wanderers 2024, Valparaíso',
    phone: '+56 32 123 4567',
    email: 'contacto@walkergestion.demo',
    business_units: [
      {
        id: 'demo-admin-unit',
        name: 'Administración Central',
        address: 'Av. Santiago Wanderers 2024, Valparaíso',
        phone: '+56 32 123 4567',
        company_id: 'demo-company-2024',
        monthly_goal: 1000000,
        active: true
      },
      {
        id: 'demo-store-1',
        name: 'Sucursal Plaza Victoria',
        address: 'Plaza Victoria 123, Valparaíso',
        phone: '+56 32 234 5678',
        company_id: 'demo-company-2024',
        monthly_goal: 800000,
        active: true
      },
      {
        id: 'demo-store-2',
        name: 'Sucursal Puerto',
        address: 'Av. Brasil 456, Valparaíso',
        phone: '+56 32 345 6789',
        company_id: 'demo-company-2024',
        monthly_goal: 600000,
        active: true
      },
      {
        id: 'demo-store-3',
        name: 'Sucursal Cerros',
        address: 'Cerro Alegre 789, Valparaíso',
        phone: '+56 32 456 7890',
        company_id: 'demo-company-2024',
        monthly_goal: 500000,
        active: true
      },
      {
        id: 'demo-store-4',
        name: 'Sucursal Centro',
        address: 'Calle Prat 321, Valparaíso',
        phone: '+56 32 567 8901',
        company_id: 'demo-company-2024',
        monthly_goal: 700000,
        active: false // Unidad inactiva para mostrar diferentes estados
      }
    ]
  }
];

// Nombres de cajeros para datos realistas
export const CASHIER_NAMES = [
  'Ana García', 'Carlos López', 'María Silva', 'Pedro González', 'Lucía Torres',
  'Roberto Jiménez', 'Carmen Ruiz', 'Diego Morales', 'Francisca Herrera', 'Andrés Vega'
];

// Descripciones de gastos comunes
export const EXPENSE_DESCRIPTIONS = {
  maintenance: [
    'Mantención equipos refrigeración',
    'Reparación sistema eléctrico',
    'Mantención preventiva equipos',
    'Cambio de filtros aire acondicionado',
    'Reparación caja registradora'
  ],
  supplies: [
    'Insumos de limpieza',
    'Material de oficina',
    'Bolsas plásticas',
    'Papel para tickets',
    'Productos de higiene'
  ],
  services: [
    'Servicios básicos',
    'Internet y telecomunicaciones',
    'Seguridad y alarmas',
    'Recolección de basura',
    'Servicio de aseo'
  ],
  transport: [
    'Combustible vehículos',
    'Transporte mercaderías',
    'Mantención vehículos',
    'Peajes y estacionamientos',
    'Seguro vehicular'
  ],
  food: [
    'Alimentación personal',
    'Cafetería oficina',
    'Eventos y reuniones',
    'Refrigerios reuniones',
    'Catering capacitaciones'
  ],
  other: [
    'Gastos varios',
    'Imprevistos operacionales',
    'Capacitación personal',
    'Publicidad local',
    'Donaciones y patrocinios'
  ]
};

// Notas comunes para ventas
export const SALE_NOTES = [
  'Venta con descuento especial',
  'Cliente frecuente',
  'Promoción 2x1 aplicada',
  'Venta corporativa',
  'Producto en oferta',
  'Cliente mayorista',
  'Venta con financiamiento',
  'Descuento por volumen',
  'Cliente preferencial',
  'Promoción fin de mes'
];

// Alertas predefinidas por categoría
export const ALERT_TEMPLATES = {
  sales: [
    {
      title: '📈 Ventas Altas Detectadas',
      message: 'Las ventas del día superan el promedio histórico en un 25%.',
      type: 'success' as const
    },
    {
      title: '📉 Ventas Bajas Detectadas',
      message: 'Las ventas están 30% por debajo del promedio de días similares.',
      type: 'warning' as const
    }
  ],
  renditions: [
    {
      title: '⏰ Rendiciones Pendientes',
      message: 'Hay rendiciones pendientes de más de 48 horas.',
      type: 'warning' as const
    },
    {
      title: '✅ Rendición Aprobada',
      message: 'La rendición ha sido aprobada exitosamente.',
      type: 'success' as const
    }
  ],
  goals: [
    {
      title: '🎯 Meta Mensual Alcanzada',
      message: 'La unidad ha superado su meta mensual.',
      type: 'success' as const
    },
    {
      title: '⚠️ Meta en Riesgo',
      message: 'Progreso insuficiente para alcanzar la meta mensual.',
      type: 'warning' as const
    }
  ],
  system: [
    {
      title: '🔧 Mantenimiento Programado',
      message: 'El sistema tendrá mantenimiento programado.',
      type: 'info' as const
    },
    {
      title: '📊 Informe Generado',
      message: 'El informe semanal ha sido generado automáticamente.',
      type: 'info' as const
    }
  ]
};