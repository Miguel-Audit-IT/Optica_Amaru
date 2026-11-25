from django.http import HttpRequest, HttpResponse, JsonResponse
from django.utils import timezone


ROOT_HTML = """<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Óptica Amaru — API &amp; Core Server (Sucursal Calama)</title>
  <style>
    :root {
      --bg-base: #faf8f5;
      --bg-card: #ffffff;
      --bg-subtle: #f6f2eb;
      --bg-card-hover: #fff8f1;
      --border: #e7e0d6;
      --copper: #b85d19;
      --copper-light: #d9772b;
      --copper-glow: rgba(184, 93, 25, 0.14);
      --emerald: #059669;
      --emerald-bg: #ecfdf5;
      --emerald-border: #a7f3d0;
      --text-main: #1f1d1a;
      --text-muted: #57534e;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif;
      background-color: var(--bg-base);
      color: var(--text-main);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      overflow-x: hidden;
      position: relative;
    }

    /* Orbes ambientales cálidos en tema claro */
    .ambient-orb {
      position: fixed;
      border-radius: 50%;
      filter: blur(85px);
      pointer-events: none;
      z-index: 0;
      opacity: 0.65;
      animation: floatOrb 12s ease-in-out infinite alternate;
    }
    .orb-1 {
      width: 420px;
      height: 420px;
      background: radial-gradient(circle, rgba(217, 119, 43, 0.2), transparent 70%);
      top: -110px;
      left: -80px;
    }
    .orb-2 {
      width: 360px;
      height: 360px;
      background: radial-gradient(circle, rgba(16, 185, 129, 0.14), transparent 70%);
      bottom: -90px;
      right: -60px;
      animation-delay: 2.5s;
    }

    @keyframes floatOrb {
      0% { transform: translate(0, 0) scale(1); }
      100% { transform: translate(24px, -18px) scale(1.08); }
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(14px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes pulseDot {
      0%, 100% {
        box-shadow: 0 0 0 0 rgba(5, 150, 105, 0.55);
      }
      50% {
        box-shadow: 0 0 0 8px rgba(5, 150, 105, 0);
      }
    }

    .container {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 860px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 28px;
      box-shadow: 0 24px 60px -18px rgba(31, 29, 26, 0.12), 0 6px 20px -8px rgba(184, 93, 25, 0.08);
      overflow: hidden;
      animation: fadeUp 0.5s ease-out both;
    }

    .accent-bar {
      height: 5px;
      width: 100%;
      background: linear-gradient(90deg, #7c3306, var(--copper), var(--copper-light), var(--copper));
    }

    .content {
      padding: 36px 34px 32px;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 9px;
      padding: 6px 14px;
      border-radius: 999px;
      background: var(--emerald-bg);
      border: 1px solid var(--emerald-border);
      color: #065f46;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.11em;
      text-transform: uppercase;
      margin-bottom: 18px;
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--emerald);
      animation: pulseDot 2s infinite;
    }

    h1 {
      font-size: clamp(1.55rem, 3vw, 2.15rem);
      font-weight: 900;
      letter-spacing: -0.025em;
      line-height: 1.15;
      color: var(--text-main);
      margin-bottom: 10px;
    }

    h1 span {
      color: var(--copper);
    }

    .subtitle {
      color: var(--text-muted);
      font-size: 0.92rem;
      line-height: 1.55;
      max-width: 640px;
      margin-bottom: 28px;
    }

    .section-label {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--copper);
      margin-bottom: 12px;
    }

    .status-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
      margin-bottom: 28px;
    }

    .stat-card {
      background: var(--bg-subtle);
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 16px 18px;
      transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
      animation: fadeUp 0.55s ease-out both;
    }
    .stat-card:nth-child(2) { animation-delay: 0.08s; }
    .stat-card:nth-child(3) { animation-delay: 0.16s; }
    .stat-card:hover {
      transform: translateY(-2px);
      border-color: rgba(184, 93, 25, 0.45);
      box-shadow: 0 10px 24px -14px rgba(184, 93, 25, 0.25);
    }

    .stat-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-muted);
      margin-bottom: 6px;
    }

    .stat-value {
      font-size: 0.95rem;
      font-weight: 800;
      color: var(--text-main);
    }

    .stat-meta {
      font-size: 11px;
      color: var(--emerald);
      font-weight: 700;
      margin-top: 4px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }

    .links-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      margin-bottom: 26px;
    }

    .action-link {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 18px;
      border-radius: 16px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      color: var(--text-main);
      text-decoration: none;
      transition: all 0.2s ease;
    }

    .action-link:hover {
      background: var(--bg-card-hover);
      border-color: var(--copper);
      transform: translateY(-2px);
      box-shadow: 0 12px 24px -14px var(--copper-glow);
    }

    .action-link.primary {
      grid-column: 1 / -1;
      background: linear-gradient(135deg, #9a4714, var(--copper));
      border-color: var(--copper);
      color: #ffffff;
    }
    .action-link.primary:hover {
      background: linear-gradient(135deg, #b3551a, var(--copper-light));
      box-shadow: 0 14px 28px -12px rgba(184, 93, 25, 0.45);
    }

    .link-title {
      font-size: 0.9rem;
      font-weight: 800;
      display: block;
    }

    .link-path {
      font-size: 11px;
      color: var(--text-muted);
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      margin-top: 2px;
      display: block;
    }
    .action-link.primary .link-path {
      color: rgba(255, 255, 255, 0.88);
    }

    .arrow {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--copper);
      transition: transform 0.2s ease;
    }
    .action-link.primary .arrow {
      color: #ffffff;
    }
    .action-link:hover .arrow {
      transform: translateX(4px);
    }

    .footer {
      padding-top: 18px;
      border-top: 1px solid var(--border);
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      font-size: 11px;
      color: var(--text-muted);
    }

    .footer code {
      background: var(--bg-subtle);
      border: 1px solid var(--border);
      padding: 2px 7px;
      border-radius: 6px;
      color: var(--copper);
      font-weight: 700;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }

    @media (max-width: 680px) {
      .content { padding: 26px 20px 22px; }
      .status-grid, .links-grid { grid-template-columns: 1fr; }
      .action-link.primary { grid-column: auto; }
    }
  </style>
</head>
<body>
  <div class="ambient-orb orb-1"></div>
  <div class="ambient-orb orb-2"></div>

  <main class="container">
    <div class="accent-bar"></div>
    <div class="content">
      <div class="status-badge">
        <span class="pulse-dot"></span>
        <span>API OPERATIVA — SUCURSAL CALAMA</span>
      </div>

      <h1>Óptica Amaru — <span>API &amp; Core Server</span></h1>
      <p class="subtitle">
        Núcleo backend corporativo para gestión clínica, convenios sindicales, inventario de seguridad y auditoría criptográfica en Sucursal Calama.
      </p>

      <div class="section-label">Estado del Servidor</div>
      <section class="status-grid">
        <div class="stat-card">
          <div class="stat-label">Motor API</div>
          <div class="stat-value">Django REST Framework</div>
          <div class="stat-meta">JWT + RBAC Activo</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Base de Datos</div>
          <div class="stat-value">PostgreSQL amaru_db</div>
          <div class="stat-meta">Persistencia Transaccional</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Trazabilidad</div>
          <div class="stat-value">SHA-256 Activa</div>
          <div class="stat-meta">Ley 21.719 &amp; MINSAL</div>
        </div>
      </section>

      <div class="section-label">Accesos Directos Verificados</div>
      <nav class="links-grid">
        <a class="action-link" href="/admin/">
          <div>
            <span class="link-title">Panel de Administración Django</span>
            <span class="link-path">/admin/</span>
          </div>
          <span class="arrow">&rarr;</span>
        </a>

        <a class="action-link" href="/api/v1/inventario/catalogo/">
          <div>
            <span class="link-title">Catálogo e Inventario API</span>
            <span class="link-path">/api/v1/inventario/catalogo/</span>
          </div>
          <span class="arrow">&rarr;</span>
        </a>

        <a class="action-link" href="/api/v1/clinico/recetas/">
          <div>
            <span class="link-title">Recetas Clínicas API</span>
            <span class="link-path">/api/v1/clinico/recetas/</span>
          </div>
          <span class="arrow">&rarr;</span>
        </a>

        <a class="action-link" href="/api/v1/dashboard/resumen/">
          <div>
            <span class="link-title">Resumen Dashboard API</span>
            <span class="link-path">/api/v1/dashboard/resumen/</span>
          </div>
          <span class="arrow">&rarr;</span>
        </a>

        <a class="action-link primary" href="http://localhost:5173" target="_blank" rel="noopener noreferrer">
          <div>
            <span class="link-title">Aplicación Web Frontend (Óptica Amaru)</span>
            <span class="link-path">http://localhost:5173</span>
          </div>
          <span class="arrow">&rarr;</span>
        </a>
      </nav>

      <footer class="footer">
        <span>Óptica Amaru · Sucursal Calama · Plataforma ERP/POS Óptico</span>
        <span>JSON disponible con header <code>Accept: application/json</code></span>
      </footer>
    </div>
  </main>
</body>
</html>
"""


def api_root_view(request: HttpRequest) -> HttpResponse:
    accept_header = (request.META.get("HTTP_ACCEPT") or "").lower()
    wants_json = "application/json" in accept_header and "text/html" not in accept_header

    if wants_json:
        return JsonResponse(
            {
                "status": "operativa",
                "service": "Óptica Amaru — API & Core Server",
                "sede": "Sucursal Calama",
                "motor": "Django REST Framework",
                "database": "PostgreSQL (amaru_db)",
                "trazabilidad": "SHA-256 Activa",
                "endpoints": {
                    "admin": "/admin/",
                    "inventario_catalogo": "/api/v1/inventario/catalogo/",
                    "clinico_recetas": "/api/v1/clinico/recetas/",
                    "dashboard_resumen": "/api/v1/dashboard/resumen/",
                    "token": "/api/token/",
                    "frontend": "http://localhost:5173",
                },
                "timestamp": timezone.now().isoformat(),
            }
        )

    return HttpResponse(ROOT_HTML, content_type="text/html; charset=utf-8")
