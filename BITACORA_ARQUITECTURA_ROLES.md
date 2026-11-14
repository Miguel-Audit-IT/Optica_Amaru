# BITÁCORA DE ARQUITECTURA DE ROLES, EXPERIENCIA DE USUARIO Y DEVSECOPS
## Plataforma Omnicanal Óptica Amaru (Salud Visual & Boutique Óptica)

**Fecha de Actualización:** 13 de Noviembre de 2026  
**Versión de Plataforma:** 2.4-Enterprise  
**Ámbito:** Arquitectura Frontend (React/TypeScript), Seguridad RBAC Zero-Trust, Cumplimiento Normativo (Leyes 21.719 y 21.663) y Mapeo Relacional de Datos (Django REST Framework / PostgreSQL).

---

## 1. Acceso Universal, Login High-Key & Admisión Pública Zero-Trust (`/login` y `/qr`)

El punto de entrada a la plataforma ha sido rediseñado bajo un estándar visual **High-Key Luminance** de grado Apple/Linear y una arquitectura de seguridad perimetral **Zero-Trust** para admisiones públicas sin autenticación previa.

### 1.1. Estética Visual "High-Key Luminance" y Contraste Moderno (`/login`)
- **Fotografía de Calama & Velo Perlado:** Se eliminaron los antiguos overlays oscuros opacos. El fondo renderiza la fotografía de la entrada de Calama con brillo, saturación y contraste vivos (`brightness-105 contrast-105 saturate-110`) acompañado de un movimiento suave y continuo *Ken Burns* de 18s (`animate-ken-burns`). Sobre la imagen reposa un velo blanco perlado translúcido con desenfoque óptico sutil (`bg-gradient-to-br from-white/70 via-[#FAF8F5]/50 to-white/65 backdrop-blur-[3px]`) y un halógeno radial cálido detrás de la tarjeta central.
- **Identidad de Marca & Lema Oficial:** Presencia dominante del logo de Óptica Amaru con flotación levitante (`animate-float`) y el lema oficial de la empresa:
  > **"TU VISIÓN, TU IMAGEN"**
- **Monitores de Sucursales en Vivo:** Píldoras de estado con pulso verde esmeralda activo:
  - `🟢 Calama · En Línea`
  - `🟢 Antofagasta · En Línea`
- **Sello Institucional:** Acreditación visible en el pie del panel: `🛡️ Datos Protegidos · Ley 21.719 & Ley 21.663`.
- **Selector Deslizante de Perfil (Segmented Control):** Conmutador interactivo que adapta contextualmente los textos de ayuda y placeholders según el tipo de visitante sin bifurcar el endpoint seguro de autenticación JWT (`POST /api/token/`):
  - **`👤 Soy Paciente`**: *"Ingresa con tu RUT para ver tu receta y el estado de tus lentes."*
  - **`💼 Equipo / Convenio`**: *"Acceso operativo para sucursales, laboratorio y auditoría."*
- **Neutralización de `-webkit-autofill`:** Corrección a nivel CSS global (`index.css`) con `transition: background-color 5000s ease-in-out 0s` e `inset box-shadow` para eliminar fondos grises/amarillos no deseados forzados por Chrome/Edge. Incluye conmutador dinámico de visualización de contraseña (`Eye` / `EyeOff`) y efecto táctil de elevación al recibir foco (`focus-within:-translate-y-[1px] focus-within:shadow-md`).
- **Banner QR Interactivo con Láser Cobrizo:** Tarjeta de ancho completo con animación de escaneo vertical en cobre (`.qr-laser-line` con resplandor `#B85D19`) que invita a cotizar o solicitar atención rápida sin cuenta previa mediante el botón `"INGRESAR A SOLICITUD Y AGENDAMIENTO RÁPIDO (QR)"`.

### 1.2. Portal Público `/qr` (Blind Write-Only Intake & Zero-Trust)
Diseñado para recepción masiva desde tótems de autoatención o códigos QR impresos en las vitrinas de Calama y Antofagasta:
- **Blind Write-Only (Cero Enumeración de Datos):** En cumplimiento de la **Ley N° 21.719**, el formulario no cuenta con mecanismos de autocompletado por RUT ni consulta datos previos en la base de datos desde la ruta pública. Un atacante no puede deducir la existencia ni el historial médico de ningún paciente.
- **Validación Matemática Módulo 11:** Verificación estricta de formato y dígito verificador del RUT chileno antes de habilitar el avance en el formulario.
- **Consentimiento Activo Estricto:** Checkbox de consentimiento de tratamiento de datos clínicos y personales (`consentimientoLey21719`) desmarcado por defecto (`false`). El botón de envío permanece deshabilitado hasta su marcación explícita e informada.
- **Protección Anti-Spam / Rate-Limit Local:** Control de frecuencia que restringe envíos consecutivos desde el mismo dispositivo a un intervalo mínimo de 60 segundos (`amaru_qr_last_submission`), mitigando ataques de saturación o denegación de servicio en los mesones.
- **Bandeja de Cuarentena:** Toda solicitud enviada por esta vía se etiqueta automáticamente con `origen: 'QR_PUBLICO'`, `estado: 'EN_REVISION'` y se aísla en la cola de revisión hasta que un vendedor o el óptico clínico valide los antecedentes.

---

## 2. Rol 1: Portal del Paciente (`PACIENTE`)

Orientado a la autogestión clínica, comodidad visual y total transparencia del paciente particular o beneficiario de convenio.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PORTAL DEL PACIENTE (ROL 1)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  NAVBAR: [Óptica Amaru Logo]     [MIGUEL JORGE · PACIENTE]  [🟢 En Línea]   │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────┐     ┌─────────────────────────────────┐  │
│  │ BENTO: SUBE TU RECETA / WIZARD│     │ TRAZABILIDAD EN TIEMPO REAL     │  │
│  │ 1. Filiación                  │ ──> │ • Paso 1: Receta Validada       │  │
│  │ 2. Clínica (OD/OI + Receta)   │     │ • Paso 2: Talla y Biselado      │  │
│  │ 3. Pago & Retiro              │     │ • Paso 3: Listo en Sucursal     │  │
│  │   [Consentimiento Ley 21.719] │     │ • Paso 4: Entrega Conforme      │  │
│  └───────────────────────────────┘     └─────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ MIS DATOS DE CONTACTO: [🔒 RUT]  [🔒 Email]  [Teléfono]  [Ciudad]      │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.1. Identidad y Reglas RBAC
- **Nombre Completo en Badge Superior:** El badge superior muestra el nombre y apellido real del paciente (ej. `MIGUEL JORGE · PACIENTE`), eliminando etiquetas genéricas y humanizando el servicio.
- **Inmutabilidad de Datos Críticos:** En "Mis Datos de Contacto" y en todos los formularios del paciente:
  - `RUT` y `Correo Electrónico` son **estrictamente inalterables (`disabled / readOnly`)** con ícono de candado (`Lock`) para evitar usurpación de identidad y desvinculación maliciosa de expedientes médicos.
  - `Teléfono` y `Ciudad de Despacho` (**Calama** / **Antofagasta**) son 100% autogestionables para garantizar la entrega efectiva de avisos por WhatsApp y entrega física.

### 2.2. Bento Grid Dinámico y Trazabilidad en Tiempo Real
- **Conmutación Inteligente de Estado:**
  - Si el paciente no tiene pedidos activos: la tarjeta principal exhibe el llamador a la acción *"Sube tu Receta Médica"* para iniciar un nuevo encargo.
  - Si el paciente cuenta con una receta en proceso o aprobada: la tarjeta conmuta automáticamente al **Monitor de Trazabilidad en Tiempo Real (4 etapas)**, detallando la fecha de prescripción, tipo de lente, sucursal de retiro y el estado operativo transparente (Validación Clínica -> Laboratorio Óptico -> En Sucursal -> Entregado).

### 2.3. Wizard Oficial de Pre-Ingreso (3 Pasos)
1. **Paso 1: Filiación y Sucursal:** Selección de tienda física de retiro (**Calama** o **Antofagasta**) y confirmación de datos del titular.
2. **Paso 2: Clínica & Embudo:** Carga de archivo digital de la receta oftalmológica (PDF o imagen de alta resolución) e ingreso opcional de parámetros dioptricos (`OD` / `OI`: Esfera, Cilindro, Eje, Adición).
3. **Paso 3: Cotización, Pago & Consentimiento Legal:** Selección del tipo de armazón, modalidad de financiamiento (Particular 3 cuotas o Convenio por Planilla) y **Consentimiento Activo Ley 21.719 / Ley 21.663** desmarcado por defecto, obligatorio para formalizar el registro.

### 2.4. Vitrina Ligera & Componentes Vectoriales Propios
- Reemplazo de carritos de compra complejos y pesados por el catálogo ligero `<ArmazonesSVGs />` con renderizado de armazones vectoriales en SVG de alta resolución (`Titanio Pro`, `Lumière Acetato`, `Ultralight Flex`).
- Botón flotante directo `<WhatsAppIcon />` configurado con mensaje predeterminado a las ópticas para soporte clínico inmediato.

---

## 3. Rol 2: Punto de Venta del Vendedor / Operador (`OPERADOR`)

Diseñado como un punto de venta (POS) ágil, moderno (estilo Shopify POS / Linear) y multi-sucursal para atención de mesón en Calama y Antofagasta.

```
┌──────────────┬──────────────────────────────────────────────────────────────┐
│ SIDEBAR      │ CABECERA: [SUCURSAL: CALAMA ▼]   [PEDRO PÉREZ (VENDEDOR)]    │
│              │ [🟢 EN LÍNEA | SINK OK]                                      │
│ [LOGO ÓPTICA ├──────────────────────────────────────────────────────────────┤
│    AMARU]    │ 1. NUEVA ATENCIÓN                                            │
│              │    • Solicitudes Web/QR en Cuarentena                        │
│ 1. NUEVA     │    • Búsqueda por RUT + Tope Convenio                        │
│    ATENCIÓN  │    • Semáforo de Stock en Sucursal                           │
│ 2. INVENTARIO├──────────────────────────────────────────────────────────────┤
│    & STOCK   │ 2. INVENTARIO & STOCK                                        │
│ 3. SEGUI-    │    • Stock Filtrado por Sucursal Activa                      │
│    MIENTO    │    • Modal: "📦 Registrar Ingreso de Stock (Guía)"           │
│ 4. ENTREGAS  ├──────────────────────────────────────────────────────────────┤
│              │ 3. SEGUIMIENTO DE PEDIDOS                                    │
│ [CERRAR      │    • 4 Pasos Numerados: PASO 1 a PASO 4                      │
│   SESIÓN]    │    • Botón Directo WhatsApp + Salto a Entrega                │
│              ├──────────────────────────────────────────────────────────────┤
│              │ 4. ENTREGAS (CIERRE DE CICLO)                                │
│              │    • Pedidos Listos Hoy + Lectura PDF417 + Firma Digital     │
└──────────────┴──────────────────────────────────────────────────────────────┘
```

### 3.1. Layout POS con Sidebar Izquierdo Fijo (`App.tsx`)
- **Estructura Ergonómica:** Barra lateral fija (`w-64 lg:w-72 shrink-0`) con el logo protagónico de Óptica Amaru y navegación limpia sin barras de scroll nativas horizontales (`no-scrollbar`).
- **Barra de Estado Superior:** Muestra la identidad con formato estandarizado **`[NOMBRE COMPLETO] (VENDEDOR)`**, el selector de sucursal activa (**Calama** o **Antofagasta**) y el monitor unificado de conectividad de red + cola FIFO Dexie para contingencia sin conexión.

### 3.2. Orden Cronológico de las 4 Pestañas

#### 1. Nueva Atención (`/terminal`)
- **Bandeja de Solicitudes Web / QR:** Notificación visual con las recetas ingresadas en línea por los pacientes o desde el tótem QR para importación en un clic al mesón de atención.
- **Atención Ágil:** Búsqueda rápida por RUT, validación de cupo y tope de convenio corporativo, y semáforo de disponibilidad física del armazón en la sucursal seleccionada.

#### 2. Inventario & Stock (`/inventario`)
- **Catálogo Operativo Limpio:** Presentación de armazones, cristales y accesorios con stock real en la sucursal activa, ocultando precios de costo gerenciales y márgenes confidenciales.
- **Modal de Control Interno `"📦 Registrar Ingreso de Stock (Guía)"`:**
  - Formulario estricto que exige el **N° de Guía de Despacho o Factura de Proveedor**.
  - Asigna el incremento al inventario de la sucursal activa (`Calama` o `Antofagasta`).
  - Genera una entrada inmutable de auditoría con fecha, hora, responsable y folio de documento mercantil.

#### 3. Seguimiento de Pedidos (`/seguimiento`)
- **Descontaminación Visual:** Eliminación de advertencias judiciales, finiquitos laborales o trazas crudas de consola SHA-256.
- **Acreditación en 4 Pasos Numerados (`PASO 1` a `PASO 4`):**
  - `PASO 1: Receta Validada`: Aprobación clínica oftalmológica.
  - `PASO 2: En Laboratorio`: Talla digital y control de biselado.
  - `PASO 3: Llegada a Sucursal`: Hito interactivo con botón *"Acreditar Llegada a Tienda"* al recibir las valijas desde el laboratorio central.
  - `PASO 4: Entrega al Paciente`: Transición directa con botón *"Ir a Entregar Pedido ->"* que precarga el folio en el módulo de recepción.
- **Canal Directo de Mensajería:** Botón integrado para avisar al paciente por WhatsApp con plantilla pre-redactada cuando sus lentes se encuentran listos en el mesón.

#### 4. Entregas (`/despacho`)
- **Cierre del Ciclo Operativo:** Pestaña final del flujo de trabajo de la óptica.
- **Carrusel de Retiro Rápido:** Tarjetas superiores con pedidos prioritarios en estado *"Listo para Retiro Hoy"*.
- **Acreditación Fehaciente:** Simulación de lectura de código de barras bidimensional PDF417 de la cédula de identidad chilena y captura de firma digital conforme en canvas para blindar la entrega bajo **DS 594** y **Ley 21.663**.

---

## 4. Mapa de Sincronización hacia Backend Django (`models.py` / PostgreSQL)

Para la fase de consolidación y sustitución de estados en memoria/localStorage por persistencia transaccional definitiva en PostgreSQL, se define la siguiente matriz de integración:

| Clave `localStorage` (Frontend) | Rol Emisor | Modelo Django Destino | Tabla PostgreSQL | Campos Mapeados / Lógica de Consolidación |
| :--- | :--- | :--- | :--- | :--- |
| `amaru_access_token` | Todos | N/A (SimpleJWT) | N/A | Token Bearer en cabecera `Authorization: Bearer <token>`. |
| `amaru_sucursal_activa` | Operador | `StockSucursal` (`apps.transacciones`) | `stock_sucursal` | Filtra existencias por `sucursal` (`'CALAMA'` o `'ANTOFAGASTA'`). |
| `amaru_solicitudes_recetas` | Paciente / QR | `RecetaOptica` + `SolicitudEntrega` | `receta_optica`, `solicitud_entrega` | `origen = 'QR_PUBLICO'` o `'WEB_PACIENTE'`, `estado = 'EN_REVISION'`. Parámetros clínicos en `JSONField`. |
| `amaru_inventario_stock` | Operador / Admin | `ArmazonInventario` + `StockSucursal` | `armazon_inventario`, `stock_sucursal` | Desglose relacional `(sku_armazon, sucursal) -> stock_disponible`. |
| `amaru_movimientos_stock` | Operador | `MovimientoStock` (`apps.transacciones`) | `movimiento_stock` | `tipo_movimiento = 'AJUSTE_ENTRADA'`, `numero_guia_factura`, `rut_operador_id`, `cantidad`. |
| `amaru_llegadas_acreditadas` | Operador | `SolicitudEntrega` (`apps.transacciones`) | `solicitud_entrega` | Actualiza `estado_pedido = EstadoPedido.LISTA` (`'Lista'`). |
| `amaru_folio_entrega_precargado`| Operador | `RecepcionDespacho` (`apps.transacciones`)| `recepcion_despacho` | Transfiere `folio_unico_qr` para liquidar el despacho. |
| `amaru_qr_last_submission` | Anónimo | N/A (Throttling Redis) | Cache Layer | Clave de rate-limit IP/Fingerprint (60s) en servidor web. |
| `amaru_fifo_cola` | Operador | `TransaccionOffline` (`apps.transacciones`) | `transaccion_offline` | Cola de reconciliación idempotente para atenciones en contingencia. |

---

## 5. Próximos Hitos Pendientes (Roadmap Estratégico)

1. **Rol 3: Perfil del ADMINISTRADOR (`ADMINISTRADOR`):**
   - **Dashboard Gerencial:** Métricas en tiempo real de facturación, volumen de pedidos por sucursal (**Calama** vs **Antofagasta**) y tiempos promedio de laboratorio.
   - **Aprobación Clínica y Cuarentena:** Mesa de trabajo médica para validar recetas subidas por pacientes y vía QR público antes de derivación a taller.
   - **Gestión Maestra de Stock & Kardex:** Control de costos de adquisición, márgenes brutos, liquidación de convenios por nómina y balance de inventario central.

2. **Rol 4: Perfil del AUDITOR (`AUDITOR`):**
   - **Trazabilidad Criptográfica SHA-256:** Verificación y validación de sellos de integridad documental en los comprobantes PDF de entrega conforme.
   - **Logs de Acceso y Cumplimiento Normativo:** Registro inmutable de consultas a recetas oftalmológicas (Ley N° 21.719) y accesos al sistema (Ley N° 21.663).
   - **Auditoría Forense de Inventario:** Conciliación entre guías de despacho ingresadas en mesón y mermas físicas registradas en sucursales.
