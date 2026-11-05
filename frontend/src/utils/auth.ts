/**
 * Utilidades para decodificación de JWT y control de acceso basado en roles (RBAC).
 */

export interface JwtCustomClaims {
  user_id?: number | string;
  username?: string;
  is_staff?: boolean;
  rol?: string;
  exp?: number;
  jti?: string;
}

export function decodeJwtPayload(token: string): JwtCustomClaims | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload) as JwtCustomClaims;
  } catch {
    return null;
  }
}

/**
 * Retorna true si el usuario actual posee permisos de staff o rol administrativo/gerencial.
 */
export function isUserStaffOrAdmin(): boolean {
  // 1. Chequeo directo en localStorage
  if (localStorage.getItem('amaru_is_staff') === 'true') {
    return true;
  }
  const rol = localStorage.getItem('amaru_rol')?.toUpperCase();
  if (rol === 'ADMIN' || rol === 'GERENTE' || rol === 'AUDITOR') {
    return true;
  }

  // 2. Decodificación de respaldo desde el token de acceso JWT
  const token = localStorage.getItem('amaru_access_token');
  if (token) {
    const payload = decodeJwtPayload(token);
    if (payload?.is_staff === true) {
      return true;
    }
    const tokenRol = payload?.rol?.toUpperCase();
    if (tokenRol === 'ADMIN' || tokenRol === 'GERENTE' || tokenRol === 'AUDITOR') {
      return true;
    }
  }

  return false;
}

export function getUserInfo(): { username: string; is_staff: boolean; rol: string } {
  const token = localStorage.getItem('amaru_access_token');
  const payload = token ? decodeJwtPayload(token) : null;

  const is_staff =
    localStorage.getItem('amaru_is_staff') === 'true' || Boolean(payload?.is_staff);
  const rol =
    localStorage.getItem('amaru_rol') ||
    payload?.rol ||
    (is_staff ? 'ADMIN' : 'OPERADOR');
  const username =
    localStorage.getItem('amaru_username') || payload?.username || '';

  return { username, is_staff, rol };
}

