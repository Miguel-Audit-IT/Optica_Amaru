import { db } from '../db/dexie';

const API_BASE_URL = 'http://localhost:8000/api/v1';

export async function sincronizarColaOffline(): Promise<{ procesados: string[]; conflictos: unknown[] }> {
    const pendientes = await db.cola_pedidos.filter(p => !p.sincronizado).toArray();

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

    const response = await fetch(`${API_BASE_URL}/transacciones/sync-batch/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`Error HTTP al sincronizar: ${response.status}`);
    }

    const data = await response.json();
    const procesados: string[] = data.procesados || [];

    for (const folio of procesados) {
        await db.cola_pedidos.where('folio_unico_qr').equals(folio).modify({ sincronizado: true });
    }

    return data;
}