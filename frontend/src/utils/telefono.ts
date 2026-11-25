/**
 * Utilidades para teléfonos móviles chilenos con prefijo fijo +56 9.
 * - Visualmente se muestra el prefijo "+56 9" y el usuario ingresa solo los 8 dígitos ("XXXX XXXX").
 * - En estado y envío se conserva el formato normalizado "+569XXXXXXXX".
 */

export function extraerDigitosMovilCL(valor: string): string {
  const soloDigitos = (valor || '').replace(/\D/g, '');
  if (soloDigitos.startsWith('569')) {
    return soloDigitos.slice(3, 11);
  }
  if (soloDigitos.startsWith('56') && soloDigitos.length >= 10) {
    return soloDigitos.slice(2, 10);
  }
  if (soloDigitos.startsWith('9') && soloDigitos.length === 9) {
    return soloDigitos.slice(1, 9);
  }
  return soloDigitos.slice(0, 8);
}

export function formatearDigitosMovilCL(valor: string): string {
  const limpios = extraerDigitosMovilCL(valor);
  if (limpios.length <= 4) return limpios;
  return `${limpios.slice(0, 4)} ${limpios.slice(4)}`;
}

export function normalizarMovilCL(inputUsuario: string): string {
  const soloDigitos = (inputUsuario || '').replace(/\D/g, '').slice(0, 8);
  return soloDigitos ? `+569${soloDigitos}` : '';
}
