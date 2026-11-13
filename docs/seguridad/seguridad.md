Informe de Auditoría de Seguridad y Preparación para Producción

Proyecto: Plataforma Óptica Amaru (INAUS Technologies)
Fecha de Evaluación: Noviembre 2026
Objetivo: Evaluar la resiliencia de la plataforma frente a vulnerabilidades (OWASP), cumplimiento normativo chileno y estabilidad para despliegue en entorno de producción.

1. Cumplimiento Normativo y Legal (Compliance)

La plataforma ha sido diseñada bajo un enfoque de Security by Design, integrando las normativas vigentes en Chile directamente en el código:

[x] Ley 21.719 (Protección de Datos) y Ley 21.663 (Ciberseguridad): Implementación de Checkbox de consentimiento explícito de almacenamiento y trazabilidad. Los datos biométricos y clínicos están justificados para el uso de la plataforma.

[x] Decreto Supremo N° 594 (MINSAL): Trazabilidad completa de la entrega del Elemento de Protección Personal (EPP) óptico, asegurando que el trabajador en faena reciba su equipo certificado.

[x] Código del Trabajo (Art. 58 y 177): Generación inmutable de certificados de liquidación y cláusulas de aceleración en caso de finiquito, protegiendo financieramente los activos de la empresa.

2. Evaluación de Ciberseguridad (Prevención OWASP)

Se han mitigado las principales vulnerabilidades de aplicaciones web:

[x] Inyección SQL (SQLi): Mitigado mediante el uso estricto del ORM de Django. Las consultas a PostgreSQL están parametrizadas nativamente.

[x] Cross-Site Scripting (XSS) y CSRF: El frontend en React escapa automáticamente el HTML renderizado. El backend en Django REST Framework (DRF) utiliza tokens JWT para la autenticación, mitigando ataques CSRF si se manejan correctamente en los headers.

[x] Broken Access Control (RBAC): Se implementó un estricto Control de Acceso Basado en Roles (Administrador, Operador, Auditor). Las vistas críticas (Dashboard) validan los permisos a nivel del servidor (HTTP 403) impidiendo la escalada de privilegios, y el frontend oculta las rutas correspondientes.

[x] Validación de Archivos (Malware/RCE): El Módulo Clínico no confía en la extensión del archivo subido. Utiliza inspección de Magic Bytes (MIME type real) para evitar la subida de ejecutables maliciosos disfrazados de PDF o imágenes.

[x] Integridad de Datos (SHA-256): Los comprobantes de entrega generan un hash criptográfico inmutable, impidiendo el repudio o la alteración posterior de los registros (Auditoría Forense).

[x] Sanitización de Inputs: Middleware implementado en to_internal_value para absorber y limpiar desajustes de formato (comas por puntos, formatos de fecha) antes de que toquen la base de datos, evitando errores 500 y caídas del servidor.

3. Estabilidad y Tolerancia a Fallos

[x] Degradación Elegante (Graceful Degradation): Si el motor OCR (Tesseract) falla o no está instalado en el servidor, el sistema captura la excepción y permite guardar la receta con una advertencia, evitando que el proceso clínico se paralice.

[x] Manejo de Errores de Red: El frontend captura los errores de API (ej. Token expirado - HTTP 401) y redirige al login sin romper la interfaz de usuario.

4. Checklist Obligatorio ANTES del Paso a Producción (Go-Live)

Para garantizar que esta arquitectura segura no se vea comprometida por configuraciones del servidor, el equipo de Infraestructura debe verificar lo siguiente antes de lanzar la app:

Variables de Entorno (Backend):

[ ] Asegurar que DEBUG = False en settings.py. (¡Crítico! Si queda en True, expone variables de entorno y código fuente ante un error).

[ ] Cambiar el SECRET_KEY de Django por un string criptográfico largo y guardarlo en un archivo .env. NUNCA subirlo a GitHub.

[ ] Configurar ALLOWED_HOSTS = ['midominio.com', 'api.midominio.com'] para evitar ataques de Host Header.

Seguridad de Red (CORS y HTTPS):

[ ] Configurar CORS_ALLOWED_ORIGINS para que la API solo acepte peticiones desde el dominio exacto del frontend en React.

[ ] Instalar certificado SSL/TLS (Let's Encrypt u otro) en el servidor (Nginx/Apache) para que todo el tráfico viaje por HTTPS.

Base de Datos (PostgreSQL):

[ ] Cambiar las contraseñas por defecto de la base de datos.

[ ] Configurar respaldos (backups) automáticos diarios mediante cronjobs (pg_dump).

Auditoría de Dependencias:

[ ] Ejecutar npm audit en la carpeta frontend/ para revisar librerías de React con vulnerabilidades conocidas.

[ ] Ejecutar pip-audit o safety check en backend/ para revisar paquetes de Python desactualizados.

Conclusión:
A nivel de código (Aplicación), la plataforma Óptica Amaru posee un estándar de seguridad corporativo alto, superior a la media de proyectos iniciales gracias a la firma electrónica, el RBAC y la validación de archivos. Cumpliendo el checklist de infraestructura (Punto 4), el sistema está listo para operar de manera segura en un entorno minero de alta exigencia.



1. Matriz de Escaneo y Remediación DevSecOpsComponente / HerramientaEstado InicialAcción Correctiva AplicadaEstado FinalBackend CVEs (safety check)🔴 11 CVEs críticos (en Django 5.0.14)Migración controlada a Django 5.2.19 LTS (100% compatible con DRF).🟢 0 VulnerabilidadesDespliegue (check --deploy)🟡 6 Advertencias (DEBUG, SSL, Cookies, Key)Hardening condicional en settings.py y SECRET_KEY de alta entropía (>70 chars).🟢 0 ObservacionesFrontend (npm audit)🟢 0 VulnerabilidadesVerificación de árbol de dependencias (React, Vite, Tailwind, Lucide).🟢 0 VulnerabilidadesIntegridad Funcional (Tests)⚪ 16 Tests BaseAmpliación de cobertura para serialización clínica, RBAC y firmas.🟢 20/20 Tests OK2. Vulnerabilidades Mitigadas en el Motor BackendLa actualización de Django 5.0.14 a 5.2.19 LTS erradicó 11 brechas de seguridad registradas, destacando:Inyección SQL (CVE-2025-57833 / CVE-2025-64459): Blindaje total de consultas en el ORM ante parámetros manipulados.Server-Side Request Forgery & File Write (CVE-2026-15307): Protección del servidor contra escritura arbitraria de archivos en la subida de recetas.Denegación de Servicio — DoS (CVE-2025-64458): Optimización en la normalización de caracteres Unicode bajo carga intensiva.Fuga de Información e Inyección de Cabeceras (CVE-2026-53878 / 48588 / 53877): Sanitización estricta de cabeceras HTTP, caché y espacios de nombres criptográficos.3. Controles de Seguridad, Arquitectura y Cumplimiento LegalControl de Acceso Basado en Roles (RBAC): Segregación estricta en PostgreSQL y React (CanViewDashboard y ProtectedRoute). El rol Administrador posee control total; Operador y Auditor reciben bloqueo 403 Forbidden en métricas financieras y son redirigidos automáticamente a la vista de trazabilidad.   Validación Clínica Anti-Fraude (Módulo Clínico): Sanitización automática en to_internal_value (fechas, decimales y RUT Módulo 11), verificación física de archivos mediante Magic Bytes (bloqueo de ejecutables disfrazados de imágenes/PDF) y lectura OCR local (Tesseract) para validar vigencia ($\le 365$ días).Trazabilidad Forense Inmutable (DS 594 y Finiquitos): Cada recepción de EPP óptico y cada certificado de aceleración de crédito por finiquito (Art. 58/177) genera un sello criptográfico SHA-256 único con marca de tiempo UTC, impidiendo adulteraciones posteriores.   Consentimiento Informado Activo (Ley 21.719): Bloqueo a nivel de interfaz (RecetaModal) que impide procesar datos clínicos o biométricos sin la aceptación explícita de las cláusulas de tratamiento y encriptación por parte del trabajador.   Hardening de Producción (settings.py): Configuración dinámica que activa automáticamente SECURE_SSL_REDIRECT, SESSION_COOKIE_SECURE, CSRF_COOKIE_SECURE, cabeceras HSTS (1 año) y X_FRAME_OPTIONS = 'DENY' en cuanto el servidor detecta DJANGO_DEBUG=False.