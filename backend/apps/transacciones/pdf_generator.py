"""
Generador de documentos PDF corporativos para Óptica Amaru usando ReportLab.
Incluye comprobantes de entrega de EPP con código QR y reportes legales de aceleración por finiquito.
"""
import io
from decimal import Decimal
from datetime import datetime
from django.utils import timezone
import qrcode

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image,
    HRFlowable,
    KeepTogether,
)

# Colores corporativos Amaru
COLOR_NAVY = colors.HexColor('#0B0F19')
COLOR_BLUE_DARK = colors.HexColor('#121826')
COLOR_ORANGE = colors.HexColor('#FF5500')
COLOR_BORDER = colors.HexColor('#2A364F')
COLOR_TEXT_MUTED = colors.HexColor('#4B5563')
COLOR_LIGHT_BG = colors.HexColor('#F3F4F6')


def generar_qr_flowable(texto: str, size: int = 80) -> Image:
    """Genera un Flowable Image de ReportLab a partir de un código QR."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=4,
        border=1,
    )
    qr.add_data(texto)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    return Image(buffer, width=size, height=size)


def format_clp(monto) -> str:
    """Formatea un número o Decimal a formato de moneda chilena CLP."""
    try:
        val = int(Decimal(str(monto)))
        return f"${val:,.0f} CLP".replace(',', '.')
    except Exception:
        return f"${monto} CLP"


def generar_comprobante_entrega_pdf(solicitud, receta=None) -> bytes:
    """
    Genera el Comprobante Oficial de Entrega de EPP Óptico en PDF.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()

    # Estilos personalizados
    titulo_style = ParagraphStyle(
        'AmaruTitulo',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=COLOR_NAVY,
    )
    subtitulo_style = ParagraphStyle(
        'AmaruSubtitulo',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=COLOR_TEXT_MUTED,
    )
    seccion_style = ParagraphStyle(
        'AmaruSeccion',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=COLOR_ORANGE,
    )
    body_style = ParagraphStyle(
        'AmaruBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=COLOR_NAVY,
    )
    body_bold = ParagraphStyle(
        'AmaruBodyBold',
        parent=body_style,
        fontName='Helvetica-Bold',
    )
    legal_style = ParagraphStyle(
        'AmaruLegal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7,
        leading=9.5,
        textColor=COLOR_TEXT_MUTED,
    )

    story = []

    # ── Encabezado con Branding y QR ──────────────────────────────────────────
    qr_flowable = generar_qr_flowable(solicitud.folio_unico_qr, size=75)

    header_left = [
        Paragraph("<b>ÓPTICA AMARU</b>", titulo_style),
        Paragraph("Plataforma Health-Tech EPP Minería · Faena Norte", subtitulo_style),
        Paragraph("Calama / Antofagasta · Certificación Óptica Industrial DS 594", subtitulo_style),
        Paragraph("<b>COMPROBANTE OFICIAL DE ENTREGA DE EPP</b>", ParagraphStyle(
            'HeaderH3', parent=seccion_style, fontSize=11, leading=14
        )),
    ]

    header_right = [
        qr_flowable,
        Paragraph(f"<b>{solicitud.folio_unico_qr}</b>", ParagraphStyle(
            'FolioText', parent=body_bold, fontSize=8, alignment=1
        )),
    ]

    header_table = Table([[header_left, header_right]], colWidths=[430, 110])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (1, 0), (1, 0), 'CENTER'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=COLOR_ORANGE, spaceBefore=2, spaceAfter=8))

    # ── Sección 1: Datos del Trabajador / Paciente ─────────────────────────────
    paciente_user = getattr(solicitud.rut_paciente, 'rut_usuario', None)
    nombre_paciente = f"{paciente_user.nombres} {paciente_user.apellidos}" if paciente_user else "Trabajador en Faena"
    rut_paciente = solicitud.rut_paciente_id

    empresa_str = "Venta Directa / Particular"
    if solicitud.rut_titular_pago:
        empresa_rel = getattr(solicitud.rut_titular_pago, 'id_empresa', None)
        empresa_str = empresa_rel.razon_social if empresa_rel else "Convenio Sindical Vigente"
    elif hasattr(solicitud.rut_paciente, 'id_empresa') and solicitud.rut_paciente.id_empresa:
        empresa_str = solicitud.rut_paciente.id_empresa.razon_social

    datos_trabajador = [
        [
            Paragraph("<b>RUT Paciente:</b>", body_style),
            Paragraph(rut_paciente, body_bold),
            Paragraph("<b>Nombre Completo:</b>", body_style),
            Paragraph(nombre_paciente, body_bold),
        ],
        [
            Paragraph("<b>Empresa / Faena:</b>", body_style),
            Paragraph(empresa_str, body_style),
            Paragraph("<b>Modalidad:</b>", body_style),
            Paragraph("Convenio Sindical (Planilla)" if solicitud.rut_titular_pago else "Particular", body_style),
        ],
        [
            Paragraph("<b>Fecha Registro:</b>", body_style),
            Paragraph(solicitud.fecha_ingreso.strftime("%d/%m/%Y %H:%M") if hasattr(solicitud, 'fecha_ingreso') and solicitud.fecha_ingreso else timezone.now().strftime("%d/%m/%Y"), body_style),
            Paragraph("<b>Estado de Orden:</b>", body_style),
            Paragraph(str(solicitud.estado_pedido), body_bold),
        ]
    ]

    t_trabajador = Table(datos_trabajador, colWidths=[90, 180, 90, 180])
    t_trabajador.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), COLOR_LIGHT_BG),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('BOX', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
    ]))

    story.append(Paragraph("1. DATOS DEL TRABAJADOR BENEFICIARIO", seccion_style))
    story.append(Spacer(1, 3))
    story.append(t_trabajador)
    story.append(Spacer(1, 8))

    # ── Sección 2: Especificaciones del EPP Óptico ────────────────────────────
    armazon = solicitud.sku_armazon
    sku_str = armazon.sku_armazon if armazon else "EPP-OPT-001"
    modelo_str = armazon.modelo_lente if armazon else "Lente Seguridad Graduado"
    certif_list = armazon.certificaciones_multiples if armazon and hasattr(armazon, 'certificaciones_multiples') else ["ANSI Z87.1", "EN 166"]
    certif_str = ", ".join(certif_list) if isinstance(certif_list, list) else str(certif_list)

    caract_dict = armazon.caracteristicas_tecnicas if armazon and hasattr(armazon, 'caracteristicas_tecnicas') else {}
    material_str = caract_dict.get('material', 'Policarbonato Reforzado Anti-Impacto')
    filtro_str = caract_dict.get('filtro_uv', 'UV400 / Antirreflejo Industrial')

    datos_epp = [
        [
            Paragraph("<b>SKU Armazón:</b>", body_style),
            Paragraph(sku_str, body_bold),
            Paragraph("<b>Modelo Certificado:</b>", body_style),
            Paragraph(modelo_str, body_bold),
        ],
        [
            Paragraph("<b>Material Montura:</b>", body_style),
            Paragraph(str(material_str), body_style),
            Paragraph("<b>Filtro Óptico:</b>", body_style),
            Paragraph(str(filtro_str), body_style),
        ],
        [
            Paragraph("<b>Normas Seguridad:</b>", body_style),
            Paragraph(certif_str, body_bold),
            Paragraph("<b>Garantía Taller:</b>", body_style),
            Paragraph("12 Meses contra defectos de ensamblaje", body_style),
        ]
    ]

    t_epp = Table(datos_epp, colWidths=[90, 180, 90, 180])
    t_epp.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.white),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('BOX', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
    ]))

    story.append(Paragraph("2. ESPECIFICACIONES TÉCNICAS DEL EPP INDUSTRIAL", seccion_style))
    story.append(Spacer(1, 3))
    story.append(t_epp)
    story.append(Spacer(1, 8))

    # ── Sección 3: Parámetros Oftalmológicos de Graduación ────────────────────
    receta_obj = receta or getattr(solicitud, 'id_receta', None)
    params = {}
    if receta_obj and hasattr(receta_obj, 'parametros_oftalmologicos'):
        params = receta_obj.parametros_oftalmologicos or {}

    od = params.get('ojo_derecho', {})
    oi = params.get('ojo_izquierdo', {})

    tabla_receta_data = [
        [
            Paragraph("<b>Ojo</b>", body_bold),
            Paragraph("<b>Esfera (SPH)</b>", body_bold),
            Paragraph("<b>Cilindro (CYL)</b>", body_bold),
            Paragraph("<b>Eje (AXIS)</b>", body_bold),
            Paragraph("<b>Adición (ADD)</b>", body_bold),
            Paragraph("<b>DP (mm)</b>", body_bold),
        ],
        [
            Paragraph("<b>OD (Derecho)</b>", body_style),
            Paragraph(str(od.get('esfera', '-1.50')), body_style),
            Paragraph(str(od.get('cilindro', '-0.50')), body_style),
            Paragraph(f"{od.get('eje', '90')}°", body_style),
            Paragraph(str(od.get('adicion', '+1.75')), body_style),
            Paragraph(str(od.get('dp', '31.5')), body_style),
        ],
        [
            Paragraph("<b>OI (Izquierdo)</b>", body_style),
            Paragraph(str(oi.get('esfera', '-1.25')), body_style),
            Paragraph(str(oi.get('cilindro', '-0.75')), body_style),
            Paragraph(f"{oi.get('eje', '85')}°", body_style),
            Paragraph(str(oi.get('adicion', '+1.75')), body_style),
            Paragraph(str(oi.get('dp', '31.0')), body_style),
        ],
    ]

    t_receta = Table(tabla_receta_data, colWidths=[90, 90, 90, 90, 90, 90])
    t_receta.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), COLOR_LIGHT_BG),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('BOX', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
    ]))

    story.append(Paragraph("3. PARÁMETROS ÓPTICOS DE GRADUACIÓN CERTIFICADA", seccion_style))
    story.append(Spacer(1, 3))
    story.append(t_receta)
    story.append(Spacer(1, 8))

    # ── Sección 4: Declaración Legal de Conformidad ───────────────────────────
    legal_text = (
        "<b>DECLARACIÓN DE RECEPCIÓN CONFORME:</b> El trabajador individualizado declara recibir a su entera conformidad "
        "el Elemento de Protección Personal (EPP) óptico con graduación correctiva prescrita, en perfecto estado físico y funcional, "
        "conforme a las directrices de seguridad laboral vigentes (Decreto Supremo N° 594 y norma ANSI Z87.1 / EN 166). Se instruye el "
        "uso obligatorio en áreas operativas y el cuidado de los tratamientos ópticos certificados."
    )
    story.append(Paragraph(legal_text, legal_style))
    story.append(Spacer(1, 12))

    # ── Sección 5: Recuadros de Firma y Huella Dactilar ───────────────────────
    firma_box = [
        Spacer(1, 40),
        Paragraph("________________________________________", ParagraphStyle('FirmaLine', parent=body_style, alignment=1)),
        Paragraph("<b>FIRMA DEL TRABAJADOR</b>", ParagraphStyle('FirmaL1', parent=body_bold, fontSize=8, alignment=1)),
        Paragraph(f"RUT: {rut_paciente}", ParagraphStyle('FirmaL2', parent=body_style, fontSize=7.5, alignment=1)),
    ]

    huella_box = [
        Paragraph("<b>HUELLA DACTILAR</b>", ParagraphStyle('HuellaT', parent=body_bold, fontSize=7, alignment=1)),
        Paragraph("(Pulgar Derecho)", ParagraphStyle('HuellaSub', parent=body_style, fontSize=6.5, alignment=1)),
        Spacer(1, 35),
    ]

    entrega_box = [
        Spacer(1, 40),
        Paragraph("________________________________________", ParagraphStyle('EntrLine', parent=body_style, alignment=1)),
        Paragraph("<b>ENTREGADO POR ÓPTICA AMARU</b>", ParagraphStyle('EntrL1', parent=body_bold, fontSize=8, alignment=1)),
        Paragraph("Tecnólogo Médico / Optómetra en Faena", ParagraphStyle('EntrL2', parent=body_style, fontSize=7.5, alignment=1)),
    ]

    tabla_firmas = Table(
        [[firma_box, huella_box, entrega_box]],
        colWidths=[210, 110, 220]
    )
    tabla_firmas.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOX', (1, 0), (1, 0), 1, COLOR_NAVY),  # Recuadro huella dactilar
        ('BACKGROUND', (1, 0), (1, 0), colors.HexColor('#FAFAFA')),
        ('TOPPADDING', (1, 0), (1, 0), 5),
        ('BOTTOMPADDING', (1, 0), (1, 0), 5),
    ]))

    story.append(KeepTogether(tabla_firmas))

    # Pie de página
    story.append(Spacer(1, 10))
    story.append(Paragraph(
        f"Documento generado electrónicamente por Óptica Amaru · {timezone.now().strftime('%d/%m/%Y %H:%M:%S')} · Verificación de Integridad vía QR",
        ParagraphStyle('Footer', parent=legal_style, alignment=1, fontSize=6.5)
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()


def generar_liquidacion_finiquito_pdf(
    solicitud,
    presupuesto,
    cuotas,
    saldo_total,
    hash_sha256: str,
    fecha_evento=None,
    rut_solicitante: str = "RRHH"
) -> bytes:
    """
    Genera el Reporte Legal de Liquidación y Aceleración de Finiquito en PDF.
    Incluye tabla de cuotas aceleradas y sello de integridad forense SHA-256.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()

    titulo_style = ParagraphStyle(
        'FiniquitoTitulo',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=COLOR_NAVY,
        alignment=1,
    )
    seccion_style = ParagraphStyle(
        'FiniquitoSeccion',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=12,
        textColor=COLOR_ORANGE,
    )
    body_style = ParagraphStyle(
        'FiniquitoBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=COLOR_NAVY,
    )
    body_bold = ParagraphStyle(
        'FiniquitoBodyBold',
        parent=body_style,
        fontName='Helvetica-Bold',
    )
    legal_style = ParagraphStyle(
        'FiniquitoLegal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7,
        leading=9.5,
        textColor=COLOR_TEXT_MUTED,
    )

    story = []

    # ── Encabezado Institucional ──────────────────────────────────────────────
    qr_flowable = generar_qr_flowable(f"FINIQUITO|{solicitud.folio_unico_qr}|{hash_sha256[:16]}", size=65)

    header_table = Table([
        [
            [
                Paragraph("<b>ÓPTICA AMARU LTDA.</b>", ParagraphStyle('H1', parent=body_bold, fontSize=11, leading=13)),
                Paragraph("Departamento de Finanzas y Convenios Mineros", ParagraphStyle('H2', parent=body_style, fontSize=8)),
                Paragraph("RUT: 77.892.340-K · Casa Central Calama, Región de Antofagasta", ParagraphStyle('H3', parent=body_style, fontSize=7.5, textColor=COLOR_TEXT_MUTED)),
            ],
            qr_flowable
        ]
    ], colWidths=[460, 80])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", thickness=1.5, color=COLOR_ORANGE, spaceBefore=2, spaceAfter=8))

    story.append(Paragraph("<b>CERTIFICADO DE LIQUIDACIÓN Y CLÁUSULA DE ACELERACIÓN DE CRÉDITO</b>", titulo_style))
    story.append(Paragraph("<b>(RETENCIÓN EN FINIQUITO LABORAL - ART. 58 CÓDIGO DEL TRABAJO)</b>", ParagraphStyle('Sub', parent=titulo_style, fontSize=9, leading=11, textColor=COLOR_TEXT_MUTED)))
    story.append(Spacer(1, 8))

    # ── 1. Antecedentes del Titular y Solicitud ────────────────────────────────
    paciente_user = getattr(solicitud.rut_paciente, 'rut_usuario', None)
    nombre_trabajador = f"{paciente_user.nombres} {paciente_user.apellidos}" if paciente_user else "Trabajador Titular"
    rut_titular = solicitud.rut_titular_pago_id or solicitud.rut_paciente_id

    empresa_str = "Empresa Minera en Convenio"
    if solicitud.rut_titular_pago and getattr(solicitud.rut_titular_pago, 'id_empresa', None):
        empresa_str = solicitud.rut_titular_pago.id_empresa.razon_social
    elif hasattr(solicitud.rut_paciente, 'id_empresa') and solicitud.rut_paciente.id_empresa:
        empresa_str = solicitud.rut_paciente.id_empresa.razon_social

    datos_antecedentes = [
        [
            Paragraph("<b>Folio Único Amaru:</b>", body_style),
            Paragraph(solicitud.folio_unico_qr, body_bold),
            Paragraph("<b>Fecha Aceleración:</b>", body_style),
            Paragraph((fecha_evento or timezone.now()).strftime("%d/%m/%Y %H:%M:%S"), body_style),
        ],
        [
            Paragraph("<b>RUT Trabajador Titular:</b>", body_style),
            Paragraph(rut_titular, body_bold),
            Paragraph("<b>Nombre Completo:</b>", body_style),
            Paragraph(nombre_trabajador, body_bold),
        ],
        [
            Paragraph("<b>Empresa Empleadora:</b>", body_style),
            Paragraph(empresa_str, body_style),
            Paragraph("<b>Solicitante Operación:</b>", body_style),
            Paragraph(f"Usuario: {rut_solicitante}", body_style),
        ]
    ]

    t_ant = Table(datos_antecedentes, colWidths=[110, 160, 110, 160])
    t_ant.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), COLOR_LIGHT_BG),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('BOX', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
    ]))
    story.append(Paragraph("1. ANTECEDENTES DEL CONTRATO Y TITULAR DE PAGO", seccion_style))
    story.append(Spacer(1, 3))
    story.append(t_ant)
    story.append(Spacer(1, 8))

    # ── 2. Detalle de Cuotas Aceleradas ───────────────────────────────────────
    filas_cuotas = [
        [
            Paragraph("<b>Cuota N°</b>", body_bold),
            Paragraph("<b>Fecha Vencimiento</b>", body_bold),
            Paragraph("<b>Monto Cuota</b>", body_bold),
            Paragraph("<b>Estado Previo</b>", body_bold),
            Paragraph("<b>Estado Actual</b>", body_bold),
        ]
    ]

    for c in cuotas:
        filas_cuotas.append([
            Paragraph(f"Cuota {getattr(c, 'numero_cuota', 1)}", body_style),
            Paragraph(str(getattr(c, 'fecha_vencimiento', getattr(c, 'mes_ejecucion', '2026-11-30'))), body_style),
            Paragraph(format_clp(c.monto_cuota), body_style),
            Paragraph("Pendiente / Mora", body_style),
            Paragraph("<b>Cobrado_Finiquito</b>", ParagraphStyle('Est', parent=body_bold, textColor=COLOR_ORANGE)),
        ])

    # Fila de Total Saldo
    filas_cuotas.append([
        Paragraph("<b>TOTAL SALDO ACELERADO:</b>", body_bold),
        Paragraph("", body_style),
        Paragraph(f"<b>{format_clp(saldo_total)}</b>", ParagraphStyle('Tot', parent=body_bold, fontSize=9, textColor=COLOR_ORANGE)),
        Paragraph("", body_style),
        Paragraph("<b>EXIGIBLE HOY</b>", body_bold),
    ])

    t_cuotas = Table(filas_cuotas, colWidths=[80, 120, 110, 110, 120])
    t_cuotas.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), COLOR_LIGHT_BG),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#FFF3EB')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('BOX', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
    ]))

    story.append(Paragraph("2. LIQUIDACIÓN DE SALDOS Y CONSOLIDACIÓN DE CUOTAS", seccion_style))
    story.append(Spacer(1, 3))
    story.append(t_cuotas)
    story.append(Spacer(1, 8))

    # ── 3. Cláusula Legal de Aceleración ─────────────────────────────────────
    texto_clausula = (
        "<b>CLÁUSULA DE ACELERACIÓN Y AUTORIZACIÓN DE DESCUENTO:</b> Conforme al convenio sindical colectivo suscrito y "
        "la autorización voluntaria e irrevocable de descuento por planilla formalizada en el Artículo 58 del Código del Trabajo, "
        "la desvinculación laboral, término de contrato o finiquito del trabajador hace exigible de pleno derecho y en forma anticipada "
        "el total de las cuotas pendientes de pago derivadas del otorgamiento del EPP óptico. La empresa empleadora retendrá y liquidará "
        f"la suma de <b>{format_clp(saldo_total)}</b> directamente desde el finiquito de trabajo para su remesa a Óptica Amaru Ltda."
    )
    story.append(Paragraph(texto_clausula, legal_style))
    story.append(Spacer(1, 8))

    # ── 4. Sello Criptográfico de Auditoría Forense SHA-256 ───────────────────
    sello_box = [
        Paragraph("<b>PISTA DE AUDITORÍA FORENSE INMUTABLE (SHA-256)</b>", ParagraphStyle('SelloT', parent=body_bold, fontSize=7.5, textColor=COLOR_ORANGE)),
        Paragraph(f"<b>Hash Integridad SHA-256:</b> <font name='Courier'>{hash_sha256}</font>", ParagraphStyle('HashT', parent=body_style, fontSize=7)),
        Paragraph(f"<b>Timestamp UTC:</b> {(fecha_evento or timezone.now()).isoformat()} · <b>Evento:</b> ACELERACION_FINIQUITO", ParagraphStyle('TimeT', parent=body_style, fontSize=6.5, textColor=COLOR_TEXT_MUTED)),
        Paragraph("Registro persistido en tabla inmutable de auditoría para efectos probatorios laborales y contables.", ParagraphStyle('LegT', parent=body_style, fontSize=6.5, textColor=COLOR_TEXT_MUTED)),
    ]

    t_sello = Table([[sello_box]], colWidths=[540])
    t_sello.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F9FAFB')),
        ('BOX', (0, 0), (-1, -1), 0.75, COLOR_ORANGE),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))

    story.append(t_sello)
    story.append(Spacer(1, 14))

    # ── 5. Firmas de Legalización ─────────────────────────────────────────────
    f_rrhh = [
        Spacer(1, 35),
        Paragraph("________________________________________", ParagraphStyle('Line1', parent=body_style, alignment=1)),
        Paragraph("<b>RECURSOS HUMANOS / EMPLEADOR</b>", ParagraphStyle('Firm1', parent=body_bold, fontSize=7.5, alignment=1)),
        Paragraph("Recepción y Aplicación en Finiquito", ParagraphStyle('Firm1Sub', parent=body_style, fontSize=6.5, alignment=1)),
    ]

    f_amaru = [
        Spacer(1, 35),
        Paragraph("________________________________________", ParagraphStyle('Line2', parent=body_style, alignment=1)),
        Paragraph("<b>ÓPTICA AMARU LTDA.</b>", ParagraphStyle('Firm2', parent=body_bold, fontSize=7.5, alignment=1)),
        Paragraph("Departamento de Convenios y Cobranzas", ParagraphStyle('Firm2Sub', parent=body_style, fontSize=6.5, alignment=1)),
    ]

    tabla_firmas_finiquito = Table([[f_rrhh, f_amaru]], colWidths=[270, 270])
    tabla_firmas_finiquito.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]))

    story.append(KeepTogether(tabla_firmas_finiquito))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()

