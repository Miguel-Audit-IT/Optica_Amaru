import Dexie, { type Table } from 'dexie';

export interface ArmazonLocal {
    sku_armazon: string;
    modelo_lente: string;
    caracteristicas_tecnicas: Record<string, unknown>;
    certificaciones_multiples: string[];
    stock_disponible: number;
    precio_clp: number;
}

export interface CuotaLocal {
    numero_cuota: number;
    monto_cuota: string;
    mes_ejecucion: string;
}

export type EstadoPedido = 'en_cola' | 'sincronizado' | 'conflicto';

export interface PedidoOfflineQueue {
    id?: number;
    folio_unico_qr: string;
    rut_paciente: string;
    id_receta?: string | null;
    sku_armazon: string;
    rut_titular_pago?: string | null;
    version_seq: number;
    monto_total: string;
    cuotas: CuotaLocal[];
    fecha_creacion: string;
    sincronizado: boolean;
    // Nuevos campos para manejo de conflictos
    estado: EstadoPedido;
    conflicto_msg?: string | null;
}

export class AmaruDatabase extends Dexie {
    armazones!: Table<ArmazonLocal, string>;
    cola_pedidos!: Table<PedidoOfflineQueue, number>;

    constructor() {
        super('AmaruDB');
        // v1: esquema original
        this.version(1).stores({
            armazones: '&sku_armazon, modelo_lente, precio_clp',
            cola_pedidos: '++id, &folio_unico_qr, rut_paciente, sincronizado'
        });
        // v2: agrega índice por estado y campo conflicto_msg
        this.version(2).stores({
            armazones: '&sku_armazon, modelo_lente, precio_clp',
            cola_pedidos: '++id, &folio_unico_qr, rut_paciente, sincronizado, estado'
        }).upgrade(tx => {
            return tx.table('cola_pedidos').toCollection().modify(pedido => {
                if (!pedido.estado) {
                    pedido.estado = pedido.sincronizado ? 'sincronizado' : 'en_cola';
                }
                if (pedido.conflicto_msg === undefined) {
                    pedido.conflicto_msg = null;
                }
            });
        });
    }
}

export const db = new AmaruDatabase();
