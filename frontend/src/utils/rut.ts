/**
 * Utilidades de validación y formato para RUT chileno (Módulo 11).
 */

/**
 * Limpia el RUT dejando solo dígitos y K (sin guion, sin puntos).
 */
function limpiarRUT(rut: string): string {
  return rut.replace(/[^0-9kK]/g, '').toUpperCase();
}

/**
 * Formatea un RUT limpio al formato canónico: 12345678-9 o 12345678-K.
 * Si tiene menos de 2 caracteres, lo devuelve sin formato.
 */
export function formatearRUT(rut: string): string {
  const limpio = limpiarRUT(rut);
  if (limpio.length < 2) return limpio;
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  return `${cuerpo}-${dv}`;
}

/**
 * Normaliza el input del usuario en tiempo real:
 * - Elimina caracteres inválidos.
 * - Convierte 'k' a 'K'.
 * - Si hay guion, lo respeta; si no, lo deja sin formatear para no mover el cursor.
 */
export function normalizarInputRUT(raw: string): string {
  // Solo permitir dígitos, guion y K/k; convertir k→K
  return raw.replace(/[^0-9kK-]/g, '').replace(/k/g, 'K');
}

/**
 * Calcula el dígito verificador Módulo 11 para un cuerpo numérico.
 */
function calcularDV(cuerpo: string): string {
  let suma = 0;
  let multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i], 10) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }
  const resto = 11 - (suma % 11);
  if (resto === 11) return '0';
  if (resto === 10) return 'K';
  return String(resto);
}

/**
 * Valida un RUT chileno usando el algoritmo Módulo 11.
 * Acepta formatos: "12345678-9", "123456789", "12.345.678-9".
 * Retorna true si es válido.
 */
export function validarRUT(rut: string): boolean {
  const limpio = limpiarRUT(rut);
  if (limpio.length < 2) return false;

  const cuerpo = limpio.slice(0, -1);
  const dvIngresado = limpio.slice(-1).toUpperCase();

  if (!/^\d+$/.test(cuerpo)) return false;
  if (parseInt(cuerpo, 10) < 1000000) return false; // RUT mínimo razonable

  const dvCalculado = calcularDV(cuerpo);
  return dvIngresado === dvCalculado;
}

