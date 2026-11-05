/**
 * Servicio para descarga de comprobantes de entrega y reportes legales en PDF.
 */

const API_BASE = 'http://127.0.0.1:8000/api/v1';

function getAuthToken(): string | null {
  return localStorage.getItem('amaru_access_token');
}

/**
 * Descarga en el navegador un blob binario como archivo.
 */
function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

/**
 * Descarga el Comprobante Oficial de Entrega de EPP en formato PDF.
 */
export async function descargarComprobantePDF(folioQr: string): Promise<void> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/transacciones/pedidos/${encodeURIComponent(folioQr)}/comprobante-pdf/`, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error ${res.status} al descargar comprobante: ${errorText}`);
  }

  const blob = await res.blob();
  triggerBrowserDownload(blob, `comprobante_entrega_${folioQr}.pdf`);
}

/**
 * Ejecuta la aceleración del finiquito y descarga el PDF legal de liquidación con hash SHA-256.
 */
export async function acelerarYDescargarFiniquitoPDF(folioQr: string, rutSolicitante?: string): Promise<void> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/finanzas/pedidos/${encodeURIComponent(folioQr)}/acelerar-finiquito/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      rut_solicitante: rutSolicitante || localStorage.getItem('amaru_username') || '12345678-9',
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error ${res.status} al acelerar finiquito: ${errorText}`);
  }

  const blob = await res.blob();
  triggerBrowserDownload(blob, `liquidacion_finiquito_${folioQr}.pdf`);
}

/**
 * Descarga la copia del reporte de finiquito (GET).
 */
export async function descargarCopiaFiniquitoPDF(folioQr: string): Promise<void> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/finanzas/pedidos/${encodeURIComponent(folioQr)}/acelerar-finiquito/`, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error ${res.status} al descargar reporte de finiquito: ${errorText}`);
  }

  const blob = await res.blob();
  triggerBrowserDownload(blob, `liquidacion_finiquito_${folioQr}.pdf`);
}

