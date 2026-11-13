import re
import json
import datetime
from datetime import date
from django.utils import timezone
from rest_framework import serializers
from .models import RecetaOptica, ReservaHora
from .validators import validar_magic_bytes
from .ocr_validator import validar_receta_ocr
from apps.autenticacion.models import Paciente


class RecetaOpticaSerializer(serializers.ModelSerializer):
    """
    Serializador para recetas ópticas con validación de vigencia (máx. 365 días).

    HU-SEC-02: el campo `archivo_receta` aplica `validar_magic_bytes`
    para rechazar archivos cuyo MIME real (magic bytes) no sea PDF, JPEG o PNG.
    El campo es de escritura solamente (write_only=True) y no se persiste en BD
    directamente desde este serializador; el handler de la vista lo procesa.
    """
    rut_paciente = serializers.PrimaryKeyRelatedField(
        queryset=Paciente.objects.all()
    )

    # ── HU-SEC-02: Campo de subida de archivo con validación de MIME real ─────
    archivo_receta = serializers.FileField(
        required=False,
        allow_null=True,
        write_only=True,
        validators=[validar_magic_bytes],
        help_text="PDF, JPEG o PNG de la receta médica. Se valida el tipo MIME real (magic bytes).",
    )
    es_vigente = serializers.SerializerMethodField(read_only=True)
    dias_antiguedad = serializers.SerializerMethodField(read_only=True)
    paciente_nombre = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = RecetaOptica
        fields = [
            'id_receta',
            'rut_paciente',
            'paciente_nombre',
            'fecha_emision',
            'parametros_oftalmologicos',
            'archivo_receta',   # write-only: entrada del archivo a validar
            'archivo_url',      # read-only: URL resultante tras almacenamiento
            'version_seq',
            'es_vigente',
            'dias_antiguedad',
        ]
        read_only_fields = ['id_receta', 'version_seq', 'es_vigente', 'dias_antiguedad']

    def get_es_vigente(self, obj: RecetaOptica) -> bool:
        if not obj.fecha_emision:
            return False
        hoy = timezone.now().date()
        dias = (hoy - obj.fecha_emision).days
        return 0 <= dias <= 365

    def get_dias_antiguedad(self, obj: RecetaOptica) -> int:
        if not obj.fecha_emision:
            return 9999
        hoy = timezone.now().date()
        return (hoy - obj.fecha_emision).days

    def get_paciente_nombre(self, obj: RecetaOptica) -> str:
        try:
            u = obj.rut_paciente.rut_usuario
            return f"{u.nombres} {u.apellidos}"
        except Exception:
            return str(obj.rut_paciente_id)

    def validate_fecha_emision(self, value: date) -> date:
        hoy = timezone.now().date()
        if value > hoy:
            raise serializers.ValidationError("La fecha de emisión no puede ser una fecha futura.")
        dias = (hoy - value).days
        if dias > 365:
            raise serializers.ValidationError(
                f"La receta médica está vencida ({dias} días de antigüedad). "
                "La normativa vigente exige un máximo de 365 días para la fabricación de EPP óptico certificado."
            )
        return value

    def to_internal_value(self, data):
        try:
            datos = data.copy()
        except AttributeError:
            datos = dict(data)

        # 1. Intercepta fecha_emision: de DD-MM-YYYY a YYYY-MM-DD
        fecha_emision = datos.get('fecha_emision')
        if fecha_emision:
            for fmt in ('%d-%m-%Y', '%d/%m/%Y'):
                try:
                    fecha_obj = datetime.datetime.strptime(str(fecha_emision), fmt)
                    datos['fecha_emision'] = fecha_obj.strftime('%Y-%m-%d')
                    break
                except ValueError:
                    pass

        # 2. Intercepta los campos numéricos y aplica .replace(',', '.')
        campos_numericos = [
            'esfera_od', 'cilindro_od', 'adicion_od', 'dp_od',
            'esfera_oi', 'cilindro_oi', 'adicion_oi', 'dp_oi'
        ]
        
        for campo in campos_numericos:
            valor = datos.get(campo)
            if valor and isinstance(valor, str):
                datos[campo] = valor.replace(',', '.')

        # Sanitizar parametros_oftalmologicos si viene como JSON string o dict con comas
        if 'parametros_oftalmologicos' in datos:
            params_raw = datos['parametros_oftalmologicos']
            if isinstance(params_raw, str):
                try:
                    params_raw = json.loads(params_raw)
                    datos['parametros_oftalmologicos'] = params_raw
                except Exception:
                    pass
            if isinstance(datos.get('parametros_oftalmologicos'), dict):
                p_dict = datos['parametros_oftalmologicos']
                for ojo in ('ojo_derecho', 'ojo_izquierdo'):
                    if ojo in p_dict and isinstance(p_dict[ojo], dict):
                        for k, v in p_dict[ojo].items():
                            if isinstance(v, str):
                                try:
                                    p_dict[ojo][k] = float(v.replace(',', '.').strip())
                                except ValueError:
                                    pass

        # 3. Intercepta el string de rut_paciente y resuelve la PK
        rut = datos.get('rut_paciente')
        if rut:
            paciente = Paciente.objects.filter(rut_usuario_id=str(rut)).first()
            if not paciente:
                # Fallback resiliente si viene con o sin puntos (ej: 24.533.343-9 -> 24533343-9)
                paciente = Paciente.objects.filter(rut_usuario_id=str(rut).replace('.', '')).first()
            if paciente:
                datos['rut_paciente'] = paciente.pk
            else:
                datos.pop('rut_paciente', None)

        # Construir parametros_oftalmologicos si solo vienen campos aplanados
        if 'parametros_oftalmologicos' not in datos and any(k in datos for k in ('esfera_od', 'cilindro_od')):
            def _clean_num(val):
                try:
                    return float(str(val).replace(',', '.').strip())
                except (ValueError, TypeError):
                    return 0.0
            datos['parametros_oftalmologicos'] = {
                'ojo_derecho': {
                    'esfera': _clean_num(datos.get('esfera_od')),
                    'cilindro': _clean_num(datos.get('cilindro_od')),
                    'eje': int(_clean_num(datos.get('eje_od', 0))),
                    'adicion': _clean_num(datos.get('adicion_od')),
                    'dp': _clean_num(datos.get('dp_od')),
                },
                'ojo_izquierdo': {
                    'esfera': _clean_num(datos.get('esfera_oi')),
                    'cilindro': _clean_num(datos.get('cilindro_oi')),
                    'eje': int(_clean_num(datos.get('eje_oi', 0))),
                    'adicion': _clean_num(datos.get('adicion_oi')),
                    'dp': _clean_num(datos.get('dp_oi')),
                },
                'observaciones': datos.get('observaciones', '')
            }

        # Asegurar formato JSON string si proviene de multipart QueryDict
        from django.http import QueryDict
        if isinstance(datos, QueryDict):
            if isinstance(datos.get('parametros_oftalmologicos'), dict):
                datos['parametros_oftalmologicos'] = json.dumps(datos['parametros_oftalmologicos'])

        return super().to_internal_value(datos)

    def validate_parametros_oftalmologicos(self, value):
        if isinstance(value, str):
            import json
            try:
                value = json.loads(value)
            except Exception:
                raise serializers.ValidationError("Los parámetros oftalmológicos deben ser un JSON válido.")
        if not isinstance(value, dict):
            raise serializers.ValidationError("Los parámetros oftalmológicos deben ser un objeto JSON.")
        return value

    def validate(self, attrs):
        attrs = super().validate(attrs)
        archivo = attrs.get('archivo_receta')
        if archivo:
            validar_receta_ocr(
                archivo_imagen=archivo,
                rut_esperado=attrs.get('rut_paciente'),
                fecha_emision_esperada=attrs.get('fecha_emision')
            )
        return attrs

    def create(self, validated_data):
        # 1. Extraemos el archivo para que no rompa el .create() del modelo
        archivo = validated_data.pop('archivo_receta', None)

        # 2. Creamos el registro clínico sin el campo conflictivo
        receta = super().create(validated_data)

        # Opcional: Si el sistema requiere procesar/guardar el archivo físico 
        # en un Storage o actualizar una URL, esa lógica va aquí usando la variable 'archivo'
        if archivo and not receta.archivo_url:
            receta.archivo_url = f"/media/recetas/{receta.id_receta}_{getattr(archivo, 'name', 'receta.pdf')}"
            receta.save(update_fields=['archivo_url'])

        return receta

    def update(self, instance, validated_data):
        validated_data.pop('archivo_receta', None)
        return super().update(instance, validated_data)


class ReservaHoraSerializer(serializers.ModelSerializer):
    rut_paciente = serializers.PrimaryKeyRelatedField(
        queryset=Paciente.objects.all()
    )

    class Meta:
        model = ReservaHora
        fields = [
            'id_reserva',
            'rut_paciente',
            'fecha_hora_reserva',
            'estado_reserva',
        ]
        read_only_fields = ['id_reserva']

