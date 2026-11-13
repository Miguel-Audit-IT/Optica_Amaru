"""
HU-SEC-01 — Throttles personalizados para Óptica Amaru.

Cada clase fija su `scope`, que debe tener una entrada correspondiente
en DEFAULT_THROTTLE_RATES dentro de settings.py:
  - 'login':     5/minute  → endpoint /api/token/ (brute-force mitigation)
  - 'qr_public': 10/minute → flujo self-service /qr (anti-scraping)
"""

from rest_framework.throttling import AnonRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    """
    Aplica una tasa más restrictiva al endpoint de obtención de tokens JWT.
    Mitiga ataques de fuerza bruta contra credenciales de operadores.
    Tasa: 5 intentos por minuto por IP.
    """
    scope = 'login'


class QRPublicRateThrottle(AnonRateThrottle):
    """
    Aplica límite de tasa al flujo público de auto-atención en faena (ruta /qr).
    Previene scraping masivo de datos de pre-ingreso de trabajadores.
    Tasa: 10 solicitudes por minuto por IP.
    """
    scope = 'qr_public'

