INFORME TÉCNICO DE ARQUITECTURA E IMPLEMENTACIÓN
Sistema Health-Tech E-commerce Industrial: Plataforma Óptica Amaru
•	Autor: Miguel Angel Jorge Choque
•	Institución: INACAP
•	Fecha de Despliegue: Noviembre 2026
•	Versión del Documento: 2.0 (Consolidado Post-Despliegue de Embudo y Admisión QR)
1. Resumen Ejecutivo
Desarrollo, integración y certificación de una plataforma transaccional de misión crítica diseñada para la provisión, auditoría y trazabilidad integral de Equipos de Protección Personal (EPP) ópticos certificados bajo el estándar del Decreto Supremo N° 594 en faenas mineras de la Región de Antofagasta (régimen de turnos 7x7).
El ecosistema garantiza resiliencia operativa en áreas con nula conectividad satelital o celular mediante una arquitectura Offline-First basada en IndexedDB/Dexie.js en el cliente, sincronización atómica por lotes en PostgreSQL 16 con control de concurrencia optimista, control de acceso basado en roles (RBAC) y mitigación de brechas comerciales y normativas. La plataforma incorpora admisión digital desatendida mediante códigos QR de faena para trabajadores sin enrolamiento previo, retención clínica automatizada ante prescripciones vencidas (> 365 días), certificación de entrega con no-repudio forense mediante captura de cédula de identidad en formato PDF417 y sellado criptográfico inmutable SHA-256.
2. Arquitectura de Software y Stack Tecnológico
+---------------------------------------------------------------------------------------+
|                                    CAPA DE CLIENTE                                    |
|                                                                                       |
|   +--------------------------+  +--------------------------+  +-------------------+   |
|   |   PublicQRView (/qr)     |  | TerminalView / Despacho  |  |   DashboardView   |   |
|   |  (Admisión Mobile-First  |  |   (Terminal Operador /   |  | (Panel Gerencial  |   |
|   |  Ley 21.719/ DS 594)    |  |     Bodega en Faena)     |  |  Métricas & KPIs) |   |
|   +--------------------------+  +--------------------------+  +-------------------+   |
|                 \                             |                             /         |
|                  +----------------------------+----------------------------+          |
|                                               |                                       |
|                                     Vite + React 18 + TS                              |
|                                Tailwind CSS (Dual Theme Claro/Oscuro)                 |
|                                               |                                       |
|                               +---------------+---------------+                       |
|                               | IndexedDB / Dexie.js (FIFO)   |                       |
|                               | AmaruOfflineDB (Offline Mode) |                       |
|                               +---------------+---------------+                       |
+-----------------------------------------------|---------------------------------------+
                                                | HTTPS / JWT RBAC
                                                v
+---------------------------------------------------------------------------------------+
|                                  CAPA DE SERVICIOS                                    |
|                         Python 3.12+ / Django 5.x / DRF                               |
|                                                                                       |
|   [Contexto Autenticación]     [Contexto Clínico]        [Contexto Transaccional]     |
|     - SimpleJWT + Claims         - Ficha Oftalmológica     - Ingesta Sync-Batch FIFO  |
|     - RBAC (Admin, Operador,     - Validación DS 594       - Facturación / Planilla   |
|       Auditor, Paciente)         - Embudo de Reservas      - Despacho y Entrega       |
+---------------------------------------------------------------------------------------+
                                                |
                                                v
+---------------------------------------------------------------------------------------+
|                                 CAPA DE PERSISTENCIA                                  |
|                              PostgreSQL 16 en Docker                                  |
|                                                                                       |
|   - Trigger trg_aplicar_movimiento_stock (Deducción atómica y bloqueo sobreventa)     |
|   - Trigger trg_auditoria_append_only (Inmutabilidad estricta de auditoría)          |
|   - Trazabilidad forense SHA-256 y persistencia de recepciones PDF417                 |
+---------------------------------------------------------------------------------------+

•	Backend: Python 3.12+ con Django 5.x y Django REST Framework (DRF), estructurado bajo principios de Domain-Driven Design (DDD) con separación en contextos delimitados (autenticacion, clinico, transacciones, auditoria, personal).
•	Seguridad y RBAC: Autenticación JWT (djangorestframework-simplejwt) mediante CustomTokenObtainPairSerializer para la inyección de claims de privilegios (is_staff, rol, username) directamente en el token criptográfico.
•	Motor de Base de Datos: PostgreSQL 16 desplegado en contenedor Docker, con triggers en PL/pgSQL para deducción atómica de stock y tablas de auditoría inmutables (Append-Only).
•	Frontend PWA: Single Page Application basada en Vite, React 18, TypeScript y Tailwind CSS, con arquitectura de diseño dual (Modo Claro clínico / Modo Oscuro industrial de faena de alto contraste).
•	Persistencia Local y Resiliencia: IndexedDB encapsulado mediante Dexie.js (AmaruOfflineDB), gestionando colas transaccionales FIFO y almacenamiento en caché para operatividad continua sin red.
•	Motor Documental y Trazabilidad: Generación programática de documentos PDF en backend con reportlab y qrcode, consumidos asíncronamente como flujos binarios (Blob) en cliente.
3. Modelo de Dominio y Restricciones de Integridad
3.1 Contexto de Autenticación, Afiliación y Control de Acceso (RBAC)
•	Entidades y Relaciones: Administración de identidades corporativas (EmpresaConvenio), perfiles de trabajadores en faena (Paciente), titulares de crédito (TitularPago) y colaboradores internos (PersonalOptica).
•	Segregación de Roles:
o	Administrador: Acceso irrestricto a métricas financieras, convenios, consolidación de planillas y stock global.
o	Operador: Acceso operativo al Terminal Asistido de Captura (Wizard) y al Módulo de Entrega y Despacho.
o	Auditor: Inspección de pistas de auditoría inmutables, cumplimiento de D.S. 594 y Ley Marco de Ciberseguridad.
o	Paciente Registrado: Consulta de estado de orden y prescripción.
o	Paciente No Registrado (Público): Flujo desatendido de auto-atención en faena.
•	Blindaje de Vistas: Permisos IsStaffOrAdmin a nivel de API (HTTP 403 Forbidden) y rutas protegidas (<ProtectedRoute>) en cliente.
•	Acceso Dual en Login: Pantalla de autenticación (Login.tsx) provista de formulario para personal interno y un canal directo con código QR punteado e interactivo que deriva al trabajador sin enrolar a la ruta pública /qr.
3.2 Contexto Clínico y Embudo de Retención
•	Ficha Oftalmológica (JSONB): Registro de parámetros de refracción (esfera, cilindro, eje, adición y distancia pupilar) para ojo derecho (OD) y ojo izquierdo (OI).
•	Regla Legal de Vigencia (< 365 días): Validación en cliente y serializador DRF (HTTP 400 Bad Request) bajo directrices del D.S. 594.
•	Embudo de Retención Comercial (ReservaHoraWidget.tsx):
o	Ante prescripciones médicas vencidas o inexistentes, el sistema bloquea inmediatamente la selección de armazones y cotización de pago.
o	Renderiza dinámicamente el widget clínico solicitando fecha y bloque horario (Mañana: 09:00 - 12:00, Tarde: 14:00 - 17:00).
o	Envío asíncrono a /api/v1/clinico/reservas/ vinculando el RUT del trabajador con persistencia y fallback offline, retornando el comprobante de cita médica con identificador MED-XXXXXX.
3.3 Admisión Abierta por QR (Self-Service Mobile-First)
•	Portal Desatendido (PublicQRView.tsx): Ruta pública desvinculada de guardias de autenticación (/qr), diseñada para pantallas móviles (360px - 480px) de trabajadores en faena.
•	Blindaje Legal (Ley N° 19.628): Captura de RUT (con normalización Módulo 11 en tiempo real), nombre completo y aceptación explícita de tratamiento de datos biométricos y personales previa a la exposición de datos clínicos.
•	Bifurcación Autónoma:
o	Si posee receta vigente (< 365 días), permite captura directa de fotografía/PDF y preselección del modelo EPP certificado (EPP-MIN-001 Titanium Shield Pro o EPP-MIN-002 Vulcan Flex Extreme), generando el folio de atención PRE-XXXXXX.
o	Si carece de receta, despliega el embudo de retención sin recargar la página.
3.4 Despacho, No Repudio y Trazabilidad Phygital
•	Módulo de Entrega (EntregaView.tsx): Acreditación fehaciente de recepción de EPP óptico en terreno.
•	Soporte para recepción directa por el Titular/Trabajador o por un Tercero Autorizado (registrando el RUT del apoderado laboral).
•	Lectura de cédula de identidad mediante escáner de código de barras bidimensional PDF417 para validación de identidad forense.
•	Respaldo Phygital (CapturaPhygital.tsx): Digitalización y asociación de vales sindicales físicos y pagarés firmados con timbres de faena al expediente digital del pedido.
3.5 Contexto Transaccional, Inventario y Auditoría Inmutable (PL/pgSQL)
•	Trigger trg_aplicar_movimiento_stock: Aplica deducciones automáticas de existencias ante salidas (CONVENIO, VENTA_DIRECTA, MERMA) y bloquea sobreventas emitiendo excepciones a nivel de motor SQL.
•	Trigger trg_auditoria_append_only: Bloquea de forma incondicional sentencias UPDATE o DELETE sobre la tabla registro_auditoria.
•	Trazabilidad Criptográfica SHA-256: Registro inmutable de cada transacción sensible, ligando el hash de integridad a reportes legales y eventos financieros.
4. Matriz Consolidada de Endpoints y Servicios Validados
Endpoint	Método	Contexto	Función y Validación Técnica
/api/token/	POST	Autenticación	Emisión de tokens JWT con serializador extendido (is_staff, rol, username).
/api/v1/dashboard/resumen/	GET	Transacciones	Agregación de KPIs: solicitudes diarias/mensuales y facturación total valorizada.
/api/v1/dashboard/stock-critico/	GET	Transacciones	Monitoreo en tiempo real de armazones certificados con existencias bajo el umbral mínimo.
/api/v1/dashboard/convenios-resumen/	GET	Transacciones	Proyección financiera de descuentos agrupada por empresa y sindicato minero.
/api/v1/transacciones/sync-batch/	POST	Transacciones	Ingesta transaccional de lotes offline con control de concurrencia optimista (version_seq).
/api/v1/clinico/recetas/	GET/POST	Clínico	Registro y consulta de prescripciones médicas con validación de antigüedad (< 365 días).
/api/v1/clinico/reservas/	POST	Clínico	Embudo de retención para agendamiento de horas médicas en policlínico de faena.
/api/v1/pedidos/{folio}/comprobante-pdf/	GET	Documental	Generación de comprobante oficial de entrega con branding, código QR y cuadro de huella/firma.
/api/v1/pedidos/{folio}/acelerar-finiquito/	POST	Finanzas	Liquidación atómica de cuotas por desvinculación laboral, emisión de PDF legal y sellado SHA-256.
/api/v1/despacho/confirmar/	POST	Transacciones	Validación de entrega con no-repudio por escaneo PDF417 y descargo de inventario en bodega.
5. Resolución de Incidencias Técnicas Críticas
Incidencia	Causa Raíz Identificada	Solución Aplicada
Error de Red (Failed to fetch)	Bloqueo por política CORS al ejecutarse el frontend de Vite en el puerto alternativo 5174.	Incorporación explícita de http://localhost:5174 y variantes en CORS_ALLOWED_ORIGINS (settings.py).
Falla 404 en Métricas del Dashboard	Discrepancia de rutas entre frontend y router Django.	Normalización de la URL base canónica en el cliente y adición de alias en urls.py.
Brecha de Privilegios en Dashboard	Acceso indiscriminado de cualquier usuario autenticado a métricas.	Implementación de permiso IsStaffOrAdmin en backend y restricción visual con <ProtectedRoute>.
Colisión Decimal en Agregaciones ORM	Incompatibilidad de tipos en sentencias Coalesce.	Tipado explícito usando output_field=DecimalField() en consultas.
Conflictos de Concurrencia en Sincronización	Desfase de versiones al intentar sobreescribir entidades concurrentemente.	Implementación de bloqueo optimista mediante comparación estricta de version_seq.
IndentationError en Poblar Usuarios	Evaluación no atómica en consola interactiva de Django vía PowerShell.	Carga programática atómica mediante ejecución de script normalizado.
Deficiencia de Contraste en Admisión QR	Superposición de estilos claros y tonalidades naranjas deslavadas.	Refactorización con paleta de alto contraste (slate-900, acentos #B34B0C y superficies adaptativas).
6. Resultados de Pruebas y Certificación de Software
•	Backend System Check: python manage.py check $\rightarrow$ 0 issues identified (0 errores de modelos, sintaxis o dependencias).
•	Frontend Build & Tipado Estricto: tsc -b && vite build $\rightarrow$ 2098 módulos transformados, compilación exitosa en 2.52 segundos con cero errores TypeScript.
•	Seguridad de Acceso y RBAC: Credenciales de operador estándar reciben respuesta HTTP 403 Forbidden en endpoints gerenciales.
•	Integración Documental y Forense: Descarga binaria de comprobantes PDF con código QR funcional, trazabilidad SHA-256 de transacciones y registro exitoso de entregas (PDF417).
•	Control de Versiones y Despliegue: Código consolidado y respaldado en repositorio oficial (commit e47b447 en rama main), con 23 archivos actualizados y +4.140 líneas de código integradas.
7. Mapa de Ruta
•	Semana 1: Identidad visual corporativa, Autenticación JWT y validaciones de formularios en el frontend.
•	Semana 2: Dashboard administrativo (métricas de ventas, alertas visuales de inventario bajo y listado de convenios sindicales).
•	Semana 3: Generación de documentos exportables (comprobantes de entrega y reportes de finiquito en PDF) y submódulo del historial clínico de recetas.
•	Semana 4: Pruebas de estrés, auditoría final del código y preparación de los contenedores para el despliegue a producción en servidores cloud.

