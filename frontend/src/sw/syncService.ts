import { db } from '../db/dexie';

const API_BASE_URL = 'http://localhost:8000/api/v1';

interface ConflictoItem {
    folio_unico_qr: string;
    motivo: string;
}

interface SyncBatchResponse {
    procesados: string[];
    conflictos: ConflictoItem[];
}

export async function sincronizarColaOffline(): Promise<SyncBatchResponse> {
    const pendientes = await db.cola_pedidos
        .filter(p => p.estado === 'en_cola' || p.estado === 'conflicto')
        .toArray();

    if (pendientes.length === 0) {
        return { procesados: [], conflictos: [] };
    }

    const payload = {
        pedidos: pendientes.map(p => ({
            folio_unico_qr: p.folio_unico_qr,
            rut_paciente: p.rut_paciente,
            id_receta: p.id_receta || null,
            sku_armazon: p.sku_armazon,
            rut_titular_pago: p.rut_titular_pago || null,
            version_seq: p.version_seq,
            monto_total: p.monto_total,
            cuotas: p.cuotas
        }))
    };

    const token = localStorage.getItem('amaru_access_token');
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/transacciones/sync-batch/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`Error HTTP al sincronizar: ${response.status}`);
    }

    const data: SyncBatchResponse = await response.json();

    // Marcar folios procesados como sincronizados
    const procesados: string[] = data.procesados || [];
    for (const folio of procesados) {
        await db.cola_pedidos
            .where('folio_unico_qr')
            .equals(folio)
            .modify({ sincronizado: true, estado: 'sincronizado', conflicto_msg: null });
    }

    // Persistir mensajes de conflicto por folio
    const conflictos: ConflictoItem[] = data.conflictos || [];
    for (const conflicto of conflictos) {
        await db.cola_pedidos
            .where('folio_unico_qr')
            .equals(conflicto.folio_unico_qr)
            .modify({
                sincronizado: false,
                estado: 'conflicto',
                conflicto_msg: conflicto.motivo || 'Error desconocido del servidor'
            });
    }

    return data;
}

export async function limpiarSincronizados(): Promise<number> {
    const ids = await db.cola_pedidos
        .where('estado')
        .equals('sincronizado')
        .primaryKeys();
    await db.cola_pedidos.bulkDelete(ids as number[]);
    return ids.length;
}