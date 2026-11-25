// ── Servicio de Gestión de Inventario y Stock en Sucursal Calama (Escalable Multi-Sucursal) ──
import catalogoSeguridadJson from '../data/catalogoSeguridadCalama.json';

export type CategoriaArmazon =
  | 'Boutique & Urbano'
  | 'Seguridad Óptica (EPP)'
  | 'Ultralivianos & Titanio';

export interface CatalogoSeguridadRaw {
  id: string;
  modelo: string;
  grupo: string;
  color: string;
  lente: string;
  proteccion: string[];
  certificaciones: string[];
  imagen: string;
}

export interface ItemInventario {
  sku: string;
  nombre: string;
  marca?: string;
  grupo?: string;
  categoria: CategoriaArmazon;
  material: string;
  filtro: string;
  proteccion?: string[];
  precioClp: number;
  imagenUrl?: string;
  colores: string[];
  descripcion: string;
  stock: {
    Calama: number;
    Antofagasta: number;
  };
  certificaciones?: string[];
  enStockMinimo?: number;
}

const PRECIOS_CATALOGO_OFICIAL: Record<string, { precio: number; stockCalama: number }> = {
  'seg-30-granate': { precio: 74000, stockCalama: 14 },
  'seg-v7-negro': { precio: 76000, stockCalama: 11 },
  'seg-20-negro': { precio: 69000, stockCalama: 9 },
  'seg-18-azul': { precio: 82000, stockCalama: 12 },
  'seg-17-azul': { precio: 72000, stockCalama: 10 },
  'seg-40-combor': { precio: 88000, stockCalama: 8 },
};

export const CATALOGO_INICIAL_ARMAZONES: ItemInventario[] = (
  catalogoSeguridadJson as CatalogoSeguridadRaw[]
).map((raw) => {
  const meta = PRECIOS_CATALOGO_OFICIAL[raw.id] || { precio: 75000, stockCalama: 10 };
  return {
    sku: raw.id.toUpperCase(),
    nombre: raw.modelo,
    marca: `Seguridad Óptica · ${raw.grupo}`,
    grupo: raw.grupo,
    categoria: 'Seguridad Óptica (EPP)',
    material: raw.proteccion.join(' · '),
    filtro: raw.lente,
    proteccion: raw.proteccion,
    precioClp: meta.precio,
    imagenUrl: raw.imagen,
    colores: [raw.color],
    descripcion: `${raw.modelo} (${raw.grupo}) — Lente ${raw.lente}. ${raw.proteccion.join(', ')}.`,
    stock: {
      Calama: meta.stockCalama,
      Antofagasta: 0,
    },
    certificaciones: raw.certificaciones,
    enStockMinimo: 2,
  };
});

export const STORAGE_KEY_INVENTARIO = 'amaru_inventario_stock_calama_v2';
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
  // Alcance operativo actual centrado exclusivamente en Sucursal Calama
  return 'Calama';
}

export function setSucursalActiva(_sucursal: 'Calama' | 'Antofagasta') {
  localStorage.setItem(STORAGE_KEY_SUCURSAL, 'Calama');
  window.dispatchEvent(new Event('amaru_sucursal_updated'));
}

export interface NuevoArmazonInput {
  sku?: string;
  nombre: string;
  marca: string;
  categoria: CategoriaArmazon;
  material: string;
  filtro?: string;
  precioClp: number;
  stockInicialCalama: number;
  imagenUrl?: string;
  descripcion?: string;
  colores?: string[];
}

export function agregarNuevoArmazon(
  input: NuevoArmazonInput,
  registradoPor = 'María González (Administradora)'
): { exito: boolean; error?: string; item?: ItemInventario } {
  const nombreLimpio = input.nombre.trim();
  const marcaLimpia = input.marca.trim();
  if (!nombreLimpio) {
    return { exito: false, error: 'El nombre o modelo del armazón es obligatorio.' };
  }
  if (!input.precioClp || input.precioClp <= 0) {
    return { exito: false, error: 'El precio debe ser mayor a $0 CLP.' };
  }
  const catalogo = getInventario();
  const skuFinal = (
    input.sku?.trim().toUpperCase() ||
    `AMARU-${nombreLimpio.replace(/[^a-zA-Z0-9]/g, '').slice(0, 5).toUpperCase()}-${String(catalogo.length + 1).padStart(3, '0')}`
  );
  if (catalogo.some((i) => i.sku.toUpperCase() === skuFinal)) {
    return { exito: false, error: `Ya existe un armazón registrado con el SKU "${skuFinal}".` };
  }

  const nuevoItem: ItemInventario = {
    sku: skuFinal,
    nombre: nombreLimpio,
    marca: marcaLimpia || 'Óptica Amaru',
    categoria: input.categoria,
    material: input.material.trim() || 'Acetato / Aleación Óptica',
    filtro: input.filtro?.trim() || 'Compatible con UV, Luz Azul y Adelgazado',
    precioClp: Math.round(input.precioClp),
    imagenUrl: input.imagenUrl?.trim() || undefined,
    colores: input.colores && input.colores.length > 0 ? input.colores : ['Negro Mate', 'Carey Clásico'],
    descripcion:
      input.descripcion?.trim() ||
      `Montura ${marcaLimpia || 'Óptica Amaru'} disponible en Sucursal Calama.`,
    stock: {
      Calama: Math.max(0, Math.round(input.stockInicialCalama)),
      Antofagasta: 0,
    },
    certificaciones: ['Garantía Óptica Amaru Calama'],
    enStockMinimo: 2,
  };

  guardarInventario([nuevoItem, ...catalogo]);

  try {
    const movimientos = getMovimientosStock();
    movimientos.unshift({
      id: `ALTA-${Date.now()}`,
      sku: nuevoItem.sku,
      nombreArmazon: nuevoItem.nombre,
      sucursal: 'Calama',
      cantidad: nuevoItem.stock.Calama,
      guiaDespachoFactura: `ALTA-CAT-${skuFinal.slice(0, 8)}`,
      registradoPor,
      fecha: new Date().toLocaleString('es-CL'),
    });
    localStorage.setItem(STORAGE_KEY_MOVIMIENTOS, JSON.stringify(movimientos));
    window.dispatchEvent(new Event('amaru_movimientos_stock_updated'));
  } catch {
    // ignore
  }

  return { exito: true, item: nuevoItem };
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

