// ── Servicio de Gestión de Inventario y Stock en Sucursales (Calama & Antofagasta) ──

export type CategoriaArmazon =
  | 'Boutique & Urbano'
  | 'Seguridad Óptica (EPP)'
  | 'Ultralivianos & Titanio';

export interface ItemInventario {
  sku: string;
  nombre: string;
  categoria: CategoriaArmazon;
  material: string;
  filtro: string;
  precioClp: number;
  colores: string[];
  descripcion: string;
  stock: {
    Calama: number;
    Antofagasta: number;
  };
  certificaciones?: string[];
  enStockMinimo?: number;
}

export const CATALOGO_INICIAL_ARMAZONES: ItemInventario[] = [
  {
    sku: 'EPP-TITAN-001',
    nombre: 'Titanium Shield Pro',
    categoria: 'Seguridad Óptica (EPP)',
    material: 'Titanio Grado Aeroespacial + Insertos EPP',
    filtro: 'Policarbonato High-Impact + UV400 Filtro Solar',
    precioClp: 85000,
    colores: ['Negro Mate Industrial', 'Cobre Amaru Cobrizo', 'Gris Grafito'],
    descripcion: 'Montura de alta durabilidad certificada para trabajo en faena y uso diario de alto impacto.',
    stock: {
      Calama: 8,
      Antofagasta: 3,
    },
    certificaciones: ['ANSI Z87.1', 'EN 166', 'DS 594'],
    enStockMinimo: 2,
  },
  {
    sku: 'BOUT-ACET-002',
    nombre: 'Acetato Vintage Lumière',
    categoria: 'Boutique & Urbano',
    material: 'Acetato Italiano Orgánico Fresado a Mano',
    filtro: 'Blue Block Digital + Antirreflejo Multicapa',
    precioClp: 72000,
    colores: ['Carey Habanero Clásico', 'Ámbar Translúcido', 'Negro Ónix Pulido'],
    descripcion: 'Diseño retro contemporáneo con bisagras de 5 dientes y acabado boutique pulido con paño suave.',
    stock: {
      Calama: 12,
      Antofagasta: 6,
    },
    certificaciones: ['Adaptación 100% MINSAL', 'Filtro UV400'],
    enStockMinimo: 3,
  },
  {
    sku: 'FLEX-STEEL-003',
    nombre: 'Ultralight Flex-Steel',
    categoria: 'Ultralivianos & Titanio',
    material: 'Acero Quirúrgico con Memoria Térmica (6.8g)',
    filtro: 'Tratamiento Oleofóbico + Hidrofóbico Antirrayas',
    precioClp: 64000,
    colores: ['Plata Satinada', 'Azul Cobalto Profundo', 'Bronce Calama'],
    descripcion: 'Estructura ultraliviana hipoalergénica con puente elástico ergonómico y plaquetas de silicona médica.',
    stock: {
      Calama: 6,
      Antofagasta: 2,
    },
    certificaciones: ['ISO 12870 Óptico', 'Hipoalergénico'],
    enStockMinimo: 2,
  },
  {
    sku: 'BOUT-METRO-004',
    nombre: 'Metropolitan Classic Rimless',
    categoria: 'Boutique & Urbano',
    material: 'Monel Reforzado con Varillas Esculpidas',
    filtro: 'Blue Block HD + Protección Luz Azul 420nm',
    precioClp: 89000,
    colores: ['Dorado Champagne', 'Titanio Pulido Espejo'],
    descripcion: 'Silueta minimalista al aire para máxima elegancia ejecutiva y confort en jornadas prolongadas.',
    stock: {
      Calama: 5,
      Antofagasta: 4,
    },
    certificaciones: ['Norma Oftálmica ISO 8980'],
    enStockMinimo: 2,
  },
  {
    sku: 'EPP-VULC-005',
    nombre: 'Vulcan Impact Protect Z87',
    categoria: 'Seguridad Óptica (EPP)',
    material: 'TR90 Memoria Polimérica con Sellos Laterales Removibles',
    filtro: 'Cristales Antiempañante Permanente + Polarizado',
    precioClp: 78000,
    colores: ['Negro Asfalto', 'Naranja Faena de Alta Visibilidad'],
    descripcion: 'Protección perimetral total contra partículas suspendidas, radiación UV extrema y polvo en suspensión.',
    stock: {
      Calama: 14,
      Antofagasta: 9,
    },
    certificaciones: ['ANSI Z87.1+', 'ISP Chile Registro EPP'],
    enStockMinimo: 4,
  },
  {
    sku: 'FLEX-AERO-006',
    nombre: 'AeroLight Titanium Minimal',
    categoria: 'Ultralivianos & Titanio',
    material: 'Beta-Titanio 0.6mm sin Tornillos',
    filtro: 'Fotocromático Transitions Gen 8 (Claro a Oscuro)',
    precioClp: 96000,
    colores: ['Gunmetal Espacial', 'Oro Rosa Satín'],
    descripcion: 'Tecnología sin tornillos ni soldaduras: resistencia inigualable con un peso pluma casi imperceptible.',
    stock: {
      Calama: 4,
      Antofagasta: 1,
    },
    certificaciones: ['CE Medical Device Clase I'],
    enStockMinimo: 2,
  },
];

export const STORAGE_KEY_INVENTARIO = 'amaru_inventario_stock';
export const STORAGE_KEY_SUCURSAL = 'amaru_sucursal_activa';
export const STORAGE_KEY_MOVIMIENTOS = 'amaru_movimientos_stock';

export interface MovimientoStock {
  id: string;
  sku: string;
  nombreArmazon: string;
  sucursal: 'Calama' | 'Antofagasta';
  cantidad: number;
  guiaDespachoFactura: string;
  registradoPor: string;
  fecha: string;
}

export function getMovimientosStock(): MovimientoStock[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MOVIMIENTOS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function registrarIngresoStock(
  sku: string,
  sucursal: 'Calama' | 'Antofagasta',
  cantidad: number,
  guiaDespachoFactura: string,
  registradoPor: string
): { exito: boolean; nuevoStock: number; item?: ItemInventario } {
  const catalogo = getInventario();
  const idx = catalogo.findIndex((item) => item.sku === sku);
  if (idx === -1) {
    return { exito: false, nuevoStock: 0 };
  }

  const target = catalogo[idx];
  const stockActual = target.stock[sucursal] || 0;
  const nuevoStock = stockActual + cantidad;
  target.stock[sucursal] = nuevoStock;
  catalogo[idx] = target;
  guardarInventario(catalogo);

  // Registro de auditoría para trazabilidad de control interno
  const movimiento: MovimientoStock = {
    id: `MOV-${Date.now()}`,
    sku: target.sku,
    nombreArmazon: target.nombre,
    sucursal,
    cantidad,
    guiaDespachoFactura,
    registradoPor,
    fecha: new Date().toLocaleString('es-CL'),
  };

  try {
    const movimientos = getMovimientosStock();
    movimientos.unshift(movimiento);
    localStorage.setItem(STORAGE_KEY_MOVIMIENTOS, JSON.stringify(movimientos));
    window.dispatchEvent(new Event('amaru_movimientos_stock_updated'));
  } catch {
    // Ignorar error local
  }

  return { exito: true, nuevoStock, item: target };
}

export function getSucursalActiva(): 'Calama' | 'Antofagasta' {
  const guardada = localStorage.getItem(STORAGE_KEY_SUCURSAL);
  if (guardada === 'Antofagasta' || guardada === 'Calama') {
    return guardada;
  }
  return 'Calama';
}

export function setSucursalActiva(sucursal: 'Calama' | 'Antofagasta') {
  localStorage.setItem(STORAGE_KEY_SUCURSAL, sucursal);
  window.dispatchEvent(new Event('amaru_sucursal_updated'));
}

export function getInventario(): ItemInventario[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INVENTARIO);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_INVENTARIO, JSON.stringify(CATALOGO_INICIAL_ARMAZONES));
      return CATALOGO_INICIAL_ARMAZONES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return CATALOGO_INICIAL_ARMAZONES;
  } catch {
    return CATALOGO_INICIAL_ARMAZONES;
  }
}

export function guardarInventario(items: ItemInventario[]) {
  localStorage.setItem(STORAGE_KEY_INVENTARIO, JSON.stringify(items));
  window.dispatchEvent(new Event('amaru_stock_updated'));
}

export function descontarStock(
  nombreOSku: string,
  sucursal: 'Calama' | 'Antofagasta',
  cantidad = 1
): { exito: boolean; stockRestante: number; item?: ItemInventario } {
  const catalogo = getInventario();
  const searchLower = nombreOSku.toLowerCase().trim();

  const idx = catalogo.findIndex(
    (item) =>
      item.sku.toLowerCase() === searchLower ||
      item.nombre.toLowerCase() === searchLower ||
      searchLower.includes(item.nombre.toLowerCase()) ||
      item.nombre.toLowerCase().includes(searchLower)
  );

  if (idx === -1) {
    return { exito: false, stockRestante: 0 };
  }

  const target = catalogo[idx];
  const stockActual = target.stock[sucursal] || 0;
  const nuevoStock = Math.max(0, stockActual - cantidad);

  target.stock[sucursal] = nuevoStock;
  catalogo[idx] = target;

  guardarInventario(catalogo);

  return { exito: true, stockRestante: nuevoStock, item: target };
}

export function obtenerStockPorNombreOSku(
  nombreOSku: string,
  sucursal: 'Calama' | 'Antofagasta'
): { disponible: number; sku: string; nombre: string } {
  const catalogo = getInventario();
  const searchLower = nombreOSku.toLowerCase().trim();

  const item = catalogo.find(
    (i) =>
      i.sku.toLowerCase() === searchLower ||
      i.nombre.toLowerCase() === searchLower ||
      searchLower.includes(i.nombre.toLowerCase()) ||
      i.nombre.toLowerCase().includes(searchLower)
  );

  if (!item) {
    return { disponible: 5, sku: 'GEN-001', nombre: nombreOSku };
  }

  return {
    disponible: item.stock[sucursal] ?? 0,
    sku: item.sku,
    nombre: item.nombre,
  };
}

