--
-- PostgreSQL database dump
--

\restrict 69DzgEZQgvnB9Du7LdYYPp93yVAzwW4cxkONyEoDLJd5no0CApzGQVLEFRY8yfX

-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.token_blacklist_outstandingtoken DROP CONSTRAINT IF EXISTS token_blacklist_outs_user_id_83bc629a_fk_auth_user;
ALTER TABLE IF EXISTS ONLY public.token_blacklist_blacklistedtoken DROP CONSTRAINT IF EXISTS token_blacklist_blacklistedtoken_token_id_3cc7fe56_fk;
ALTER TABLE IF EXISTS ONLY public.titular_pago DROP CONSTRAINT IF EXISTS titular_pago_id_empresa_7ecc5ea9_fk_empresa_convenio_id_empresa;
ALTER TABLE IF EXISTS ONLY public.solicitud_entrega DROP CONSTRAINT IF EXISTS solicitud_entrega_sku_armazon_17e012ff_fk_armazon_i;
ALTER TABLE IF EXISTS ONLY public.solicitud_entrega DROP CONSTRAINT IF EXISTS solicitud_entrega_rut_titular_pago_2040f8ff_fk_titular_p;
ALTER TABLE IF EXISTS ONLY public.solicitud_entrega DROP CONSTRAINT IF EXISTS solicitud_entrega_rut_paciente_feef0ae6_fk_paciente_rut_usuario;
ALTER TABLE IF EXISTS ONLY public.solicitud_entrega DROP CONSTRAINT IF EXISTS solicitud_entrega_id_receta_94ea0e09_fk_receta_optica_id_receta;
ALTER TABLE IF EXISTS ONLY public.reserva_hora DROP CONSTRAINT IF EXISTS reserva_hora_rut_paciente_007320b7_fk_paciente_rut_usuario;
ALTER TABLE IF EXISTS ONLY public.registro_auditoria DROP CONSTRAINT IF EXISTS registro_auditoria_rut_usuario_accion_ac1cbdb9_fk_usuario_r;
ALTER TABLE IF EXISTS ONLY public.receta_optica DROP CONSTRAINT IF EXISTS receta_optica_rut_paciente_df19992e_fk_paciente_rut_usuario;
ALTER TABLE IF EXISTS ONLY public.recepcion_despacho DROP CONSTRAINT IF EXISTS recepcion_despacho_folio_unico_qr_d1e6348a_fk_solicitud;
ALTER TABLE IF EXISTS ONLY public.presupuesto DROP CONSTRAINT IF EXISTS presupuesto_folio_unico_qr_83a7c806_fk_solicitud;
ALTER TABLE IF EXISTS ONLY public.personal_optica DROP CONSTRAINT IF EXISTS personal_optica_rut_usuario_a1d016bf_fk_usuario_rut_usuario;
ALTER TABLE IF EXISTS ONLY public.paciente DROP CONSTRAINT IF EXISTS paciente_rut_usuario_8b94d060_fk_usuario_rut_usuario;
ALTER TABLE IF EXISTS ONLY public.paciente DROP CONSTRAINT IF EXISTS paciente_id_empresa_65e67cd5_fk_empresa_convenio_id_empresa;
ALTER TABLE IF EXISTS ONLY public.movimiento_stock DROP CONSTRAINT IF EXISTS movimiento_stock_sku_armazon_35f53102_fk_armazon_i;
ALTER TABLE IF EXISTS ONLY public.movimiento_stock DROP CONSTRAINT IF EXISTS movimiento_stock_folio_unico_qr_df3903f2_fk_solicitud;
ALTER TABLE IF EXISTS ONLY public.lote_nomina_sindicato DROP CONSTRAINT IF EXISTS lote_nomina_sindicat_rut_responsable_carg_cdbb2c8b_fk_usuario_r;
ALTER TABLE IF EXISTS ONLY public.lote_nomina_sindicato DROP CONSTRAINT IF EXISTS lote_nomina_sindicat_id_empresa_45bd0538_fk_empresa_c;
ALTER TABLE IF EXISTS ONLY public.documento_respaldo DROP CONSTRAINT IF EXISTS documento_respaldo_folio_unico_qr_046509c7_fk_solicitud;
ALTER TABLE IF EXISTS ONLY public.django_admin_log DROP CONSTRAINT IF EXISTS django_admin_log_user_id_c564eba6_fk_auth_user_id;
ALTER TABLE IF EXISTS ONLY public.django_admin_log DROP CONSTRAINT IF EXISTS django_admin_log_content_type_id_c4bce8eb_fk_django_co;
ALTER TABLE IF EXISTS ONLY public.cuota_descuento DROP CONSTRAINT IF EXISTS cuota_descuento_id_presupuesto_1b361338_fk_presupues;
ALTER TABLE IF EXISTS ONLY public.auth_user_user_permissions DROP CONSTRAINT IF EXISTS auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id;
ALTER TABLE IF EXISTS ONLY public.auth_user_user_permissions DROP CONSTRAINT IF EXISTS auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm;
ALTER TABLE IF EXISTS ONLY public.auth_user_groups DROP CONSTRAINT IF EXISTS auth_user_groups_user_id_6a12ed8b_fk_auth_user_id;
ALTER TABLE IF EXISTS ONLY public.auth_user_groups DROP CONSTRAINT IF EXISTS auth_user_groups_group_id_97559544_fk_auth_group_id;
ALTER TABLE IF EXISTS ONLY public.auth_permission DROP CONSTRAINT IF EXISTS auth_permission_content_type_id_2f476e4b_fk_django_co;
ALTER TABLE IF EXISTS ONLY public.auth_group_permissions DROP CONSTRAINT IF EXISTS auth_group_permissions_group_id_b120cbf9_fk_auth_group_id;
ALTER TABLE IF EXISTS ONLY public.auth_group_permissions DROP CONSTRAINT IF EXISTS auth_group_permissio_permission_id_84c5c92e_fk_auth_perm;
DROP TRIGGER IF EXISTS trg_auditoria_append_only ON public.registro_auditoria;
DROP TRIGGER IF EXISTS trg_aplicar_movimiento_stock ON public.movimiento_stock;
DROP INDEX IF EXISTS public.usuario_rut_usuario_709240f4_like;
DROP INDEX IF EXISTS public.usuario_correo_electronico_095a0d38_like;
DROP INDEX IF EXISTS public.token_blacklist_outstandingtoken_user_id_83bc629a;
DROP INDEX IF EXISTS public.token_blacklist_outstandingtoken_jti_hex_d9bdf6f7_like;
DROP INDEX IF EXISTS public.titular_pago_rut_titular_bb43af68_like;
DROP INDEX IF EXISTS public.titular_pago_id_empresa_7ecc5ea9;
DROP INDEX IF EXISTS public.solicitud_entrega_sku_armazon_17e012ff_like;
DROP INDEX IF EXISTS public.solicitud_entrega_sku_armazon_17e012ff;
DROP INDEX IF EXISTS public.solicitud_entrega_rut_titular_pago_2040f8ff_like;
DROP INDEX IF EXISTS public.solicitud_entrega_rut_titular_pago_2040f8ff;
DROP INDEX IF EXISTS public.solicitud_entrega_rut_paciente_feef0ae6_like;
DROP INDEX IF EXISTS public.solicitud_entrega_rut_paciente_feef0ae6;
DROP INDEX IF EXISTS public.solicitud_entrega_id_receta_94ea0e09;
DROP INDEX IF EXISTS public.solicitud_entrega_folio_unico_qr_02db5daa_like;
DROP INDEX IF EXISTS public.reserva_hora_rut_paciente_007320b7_like;
DROP INDEX IF EXISTS public.reserva_hora_rut_paciente_007320b7;
DROP INDEX IF EXISTS public.registro_auditoria_rut_usuario_accion_ac1cbdb9_like;
DROP INDEX IF EXISTS public.registro_auditoria_rut_usuario_accion_ac1cbdb9;
DROP INDEX IF EXISTS public.receta_optica_rut_paciente_df19992e_like;
DROP INDEX IF EXISTS public.receta_optica_rut_paciente_df19992e;
DROP INDEX IF EXISTS public.recepcion_despacho_folio_unico_qr_d1e6348a_like;
DROP INDEX IF EXISTS public.presupuesto_folio_unico_qr_83a7c806_like;
DROP INDEX IF EXISTS public.personal_optica_rut_usuario_a1d016bf_like;
DROP INDEX IF EXISTS public.paciente_rut_usuario_8b94d060_like;
DROP INDEX IF EXISTS public.paciente_id_empresa_65e67cd5;
DROP INDEX IF EXISTS public.nomina_trabajador_rut_f6e9830a_like;
DROP INDEX IF EXISTS public.movimiento_stock_sku_armazon_35f53102_like;
DROP INDEX IF EXISTS public.movimiento_stock_sku_armazon_35f53102;
DROP INDEX IF EXISTS public.movimiento_stock_folio_unico_qr_df3903f2_like;
DROP INDEX IF EXISTS public.movimiento_stock_folio_unico_qr_df3903f2;
DROP INDEX IF EXISTS public.lote_nomina_sindicato_rut_responsable_carga_cdbb2c8b_like;
DROP INDEX IF EXISTS public.lote_nomina_sindicato_rut_responsable_carga_cdbb2c8b;
DROP INDEX IF EXISTS public.lote_nomina_sindicato_id_empresa_45bd0538;
DROP INDEX IF EXISTS public.empresa_convenio_rut_empresa_0572b84c_like;
DROP INDEX IF EXISTS public.documento_respaldo_folio_unico_qr_046509c7_like;
DROP INDEX IF EXISTS public.django_session_session_key_c0390e0f_like;
DROP INDEX IF EXISTS public.django_session_expire_date_a5c62663;
DROP INDEX IF EXISTS public.django_admin_log_user_id_c564eba6;
DROP INDEX IF EXISTS public.django_admin_log_content_type_id_c4bce8eb;
DROP INDEX IF EXISTS public.cuota_descuento_id_presupuesto_1b361338;
DROP INDEX IF EXISTS public.auth_user_username_6821ab7c_like;
DROP INDEX IF EXISTS public.auth_user_user_permissions_user_id_a95ead1b;
DROP INDEX IF EXISTS public.auth_user_user_permissions_permission_id_1fbb5f2c;
DROP INDEX IF EXISTS public.auth_user_groups_user_id_6a12ed8b;
DROP INDEX IF EXISTS public.auth_user_groups_group_id_97559544;
DROP INDEX IF EXISTS public.auth_permission_content_type_id_2f476e4b;
DROP INDEX IF EXISTS public.auth_group_permissions_permission_id_84c5c92e;
DROP INDEX IF EXISTS public.auth_group_permissions_group_id_b120cbf9;
DROP INDEX IF EXISTS public.auth_group_name_a6ea08ec_like;
DROP INDEX IF EXISTS public.armazon_inventario_sku_armazon_71661e83_like;
ALTER TABLE IF EXISTS ONLY public.usuario DROP CONSTRAINT IF EXISTS usuario_pkey;
ALTER TABLE IF EXISTS ONLY public.usuario DROP CONSTRAINT IF EXISTS usuario_correo_electronico_key;
ALTER TABLE IF EXISTS ONLY public.cuota_descuento DROP CONSTRAINT IF EXISTS uq_presupuesto_cuota;
ALTER TABLE IF EXISTS ONLY public.token_blacklist_outstandingtoken DROP CONSTRAINT IF EXISTS token_blacklist_outstandingtoken_pkey;
ALTER TABLE IF EXISTS ONLY public.token_blacklist_outstandingtoken DROP CONSTRAINT IF EXISTS token_blacklist_outstandingtoken_jti_hex_d9bdf6f7_uniq;
ALTER TABLE IF EXISTS ONLY public.token_blacklist_blacklistedtoken DROP CONSTRAINT IF EXISTS token_blacklist_blacklistedtoken_token_id_key;
ALTER TABLE IF EXISTS ONLY public.token_blacklist_blacklistedtoken DROP CONSTRAINT IF EXISTS token_blacklist_blacklistedtoken_pkey;
ALTER TABLE IF EXISTS ONLY public.titular_pago DROP CONSTRAINT IF EXISTS titular_pago_pkey;
ALTER TABLE IF EXISTS ONLY public.solicitud_entrega DROP CONSTRAINT IF EXISTS solicitud_entrega_pkey;
ALTER TABLE IF EXISTS ONLY public.reserva_hora DROP CONSTRAINT IF EXISTS reserva_hora_pkey;
ALTER TABLE IF EXISTS ONLY public.registro_auditoria DROP CONSTRAINT IF EXISTS registro_auditoria_pkey;
ALTER TABLE IF EXISTS ONLY public.receta_optica DROP CONSTRAINT IF EXISTS receta_optica_pkey;
ALTER TABLE IF EXISTS ONLY public.recepcion_despacho DROP CONSTRAINT IF EXISTS recepcion_despacho_pkey;
ALTER TABLE IF EXISTS ONLY public.recepcion_despacho DROP CONSTRAINT IF EXISTS recepcion_despacho_folio_unico_qr_key;
ALTER TABLE IF EXISTS ONLY public.presupuesto DROP CONSTRAINT IF EXISTS presupuesto_pkey;
ALTER TABLE IF EXISTS ONLY public.presupuesto DROP CONSTRAINT IF EXISTS presupuesto_folio_unico_qr_key;
ALTER TABLE IF EXISTS ONLY public.personal_optica DROP CONSTRAINT IF EXISTS personal_optica_pkey;
ALTER TABLE IF EXISTS ONLY public.paciente DROP CONSTRAINT IF EXISTS paciente_pkey;
ALTER TABLE IF EXISTS ONLY public.nomina_trabajador DROP CONSTRAINT IF EXISTS nomina_trabajador_rut_key;
ALTER TABLE IF EXISTS ONLY public.nomina_trabajador DROP CONSTRAINT IF EXISTS nomina_trabajador_pkey;
ALTER TABLE IF EXISTS ONLY public.movimiento_stock DROP CONSTRAINT IF EXISTS movimiento_stock_pkey;
ALTER TABLE IF EXISTS ONLY public.lote_nomina_sindicato DROP CONSTRAINT IF EXISTS lote_nomina_sindicato_pkey;
ALTER TABLE IF EXISTS ONLY public.empresa_convenio DROP CONSTRAINT IF EXISTS empresa_convenio_rut_empresa_key;
ALTER TABLE IF EXISTS ONLY public.empresa_convenio DROP CONSTRAINT IF EXISTS empresa_convenio_pkey;
ALTER TABLE IF EXISTS ONLY public.documento_respaldo DROP CONSTRAINT IF EXISTS documento_respaldo_pkey;
ALTER TABLE IF EXISTS ONLY public.documento_respaldo DROP CONSTRAINT IF EXISTS documento_respaldo_folio_unico_qr_key;
ALTER TABLE IF EXISTS ONLY public.django_session DROP CONSTRAINT IF EXISTS django_session_pkey;
ALTER TABLE IF EXISTS ONLY public.django_migrations DROP CONSTRAINT IF EXISTS django_migrations_pkey;
ALTER TABLE IF EXISTS ONLY public.django_content_type DROP CONSTRAINT IF EXISTS django_content_type_pkey;
ALTER TABLE IF EXISTS ONLY public.django_content_type DROP CONSTRAINT IF EXISTS django_content_type_app_label_model_76bd3d3b_uniq;
ALTER TABLE IF EXISTS ONLY public.django_admin_log DROP CONSTRAINT IF EXISTS django_admin_log_pkey;
ALTER TABLE IF EXISTS ONLY public.cuota_descuento DROP CONSTRAINT IF EXISTS cuota_descuento_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_user DROP CONSTRAINT IF EXISTS auth_user_username_key;
ALTER TABLE IF EXISTS ONLY public.auth_user_user_permissions DROP CONSTRAINT IF EXISTS auth_user_user_permissions_user_id_permission_id_14a6b632_uniq;
ALTER TABLE IF EXISTS ONLY public.auth_user_user_permissions DROP CONSTRAINT IF EXISTS auth_user_user_permissions_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_user DROP CONSTRAINT IF EXISTS auth_user_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_user_groups DROP CONSTRAINT IF EXISTS auth_user_groups_user_id_group_id_94350c0c_uniq;
ALTER TABLE IF EXISTS ONLY public.auth_user_groups DROP CONSTRAINT IF EXISTS auth_user_groups_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_permission DROP CONSTRAINT IF EXISTS auth_permission_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_permission DROP CONSTRAINT IF EXISTS auth_permission_content_type_id_codename_01ab375a_uniq;
ALTER TABLE IF EXISTS ONLY public.auth_group DROP CONSTRAINT IF EXISTS auth_group_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_group_permissions DROP CONSTRAINT IF EXISTS auth_group_permissions_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_group_permissions DROP CONSTRAINT IF EXISTS auth_group_permissions_group_id_permission_id_0cd325b0_uniq;
ALTER TABLE IF EXISTS ONLY public.auth_group DROP CONSTRAINT IF EXISTS auth_group_name_key;
ALTER TABLE IF EXISTS ONLY public.armazon_inventario DROP CONSTRAINT IF EXISTS armazon_inventario_pkey;
DROP TABLE IF EXISTS public.usuario;
DROP TABLE IF EXISTS public.token_blacklist_outstandingtoken;
DROP TABLE IF EXISTS public.token_blacklist_blacklistedtoken;
DROP TABLE IF EXISTS public.titular_pago;
DROP TABLE IF EXISTS public.solicitud_entrega;
DROP TABLE IF EXISTS public.reserva_hora;
DROP TABLE IF EXISTS public.registro_auditoria;
DROP TABLE IF EXISTS public.receta_optica;
DROP TABLE IF EXISTS public.recepcion_despacho;
DROP TABLE IF EXISTS public.presupuesto;
DROP TABLE IF EXISTS public.personal_optica;
DROP TABLE IF EXISTS public.paciente;
DROP TABLE IF EXISTS public.nomina_trabajador;
DROP TABLE IF EXISTS public.movimiento_stock;
DROP TABLE IF EXISTS public.lote_nomina_sindicato;
DROP TABLE IF EXISTS public.empresa_convenio;
DROP TABLE IF EXISTS public.documento_respaldo;
DROP TABLE IF EXISTS public.django_session;
DROP TABLE IF EXISTS public.django_migrations;
DROP TABLE IF EXISTS public.django_content_type;
DROP TABLE IF EXISTS public.django_admin_log;
DROP TABLE IF EXISTS public.cuota_descuento;
DROP TABLE IF EXISTS public.auth_user_user_permissions;
DROP TABLE IF EXISTS public.auth_user_groups;
DROP TABLE IF EXISTS public.auth_user;
DROP TABLE IF EXISTS public.auth_permission;
DROP TABLE IF EXISTS public.auth_group_permissions;
DROP TABLE IF EXISTS public.auth_group;
DROP TABLE IF EXISTS public.armazon_inventario;
DROP FUNCTION IF EXISTS public.bloquear_mutacion_auditoria();
DROP FUNCTION IF EXISTS public.actualizar_stock_por_movimiento();
--
-- Name: actualizar_stock_por_movimiento(); Type: FUNCTION; Schema: public; Owner: amaru_admin
--

CREATE FUNCTION public.actualizar_stock_por_movimiento() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.tipo_movimiento IN ('VENTA_DIRECTA', 'CONVENIO', 'MERMA') THEN
        IF (SELECT stock_disponible FROM armazon_inventario WHERE sku_armazon = NEW.sku_armazon) < NEW.cantidad THEN
            RAISE EXCEPTION 'Stock insuficiente para el SKU %', NEW.sku_armazon;
        END IF;
        UPDATE armazon_inventario SET stock_disponible = stock_disponible - NEW.cantidad WHERE sku_armazon = NEW.sku_armazon;
    ELSIF NEW.tipo_movimiento IN ('DEVOLUCION_GARANTIA', 'AJUSTE_ENTRADA') THEN
        UPDATE armazon_inventario SET stock_disponible = stock_disponible + NEW.cantidad WHERE sku_armazon = NEW.sku_armazon;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.actualizar_stock_por_movimiento() OWNER TO amaru_admin;

--
-- Name: bloquear_mutacion_auditoria(); Type: FUNCTION; Schema: public; Owner: amaru_admin
--

CREATE FUNCTION public.bloquear_mutacion_auditoria() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    RAISE EXCEPTION 'SEGURIDAD: Tabla de auditoria es inmutable (Append-Only).';
END;
$$;


ALTER FUNCTION public.bloquear_mutacion_auditoria() OWNER TO amaru_admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: armazon_inventario; Type: TABLE; Schema: public; Owner: amaru_admin
--

CREATE TABLE public.armazon_inventario (
    sku_armazon character varying(50) NOT NULL,
    modelo_lente character varying(100) NOT NULL,
    caracteristicas_tecnicas jsonb NOT NULL,
    certificaciones_multiples jsonb NOT NULL,
    stock_disponible integer NOT NULL,
    precio_clp integer NOT NULL
);


ALTER TABLE public.armazon_inventario OWNER TO amaru_admin;

--
-- Name: auth_group; Type: TABLE; Schema: public; Owner: amaru_admin
--

CREATE TABLE public.auth_group (
    id integer NOT NULL,
    name character varying(150) NOT NULL
);


ALTER TABLE public.auth_group OWNER TO amaru_admin;

--
-- Name: auth_group_id_seq; Type: SEQUENCE; Schema: public; Owner: amaru_admin
--

ALTER TABLE public.auth_group ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_group_permissions; Type: TABLE; Schema: public; Owner: amaru_admin
--

CREATE TABLE public.auth_group_permissions (
    id bigint NOT NULL,
    group_id integer NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.auth_group_permissions OWNER TO amaru_admin;

--
-- Name: auth_group_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: amaru_admin
--

ALTER TABLE public.auth_group_permissions ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_group_permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_permission; Type: TABLE; Schema: public; Owner: amaru_admin
--

CREATE TABLE public.auth_permission (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    content_type_id integer NOT NULL,
    codename character varying(100) NOT NULL
);


ALTER TABLE public.auth_permission OWNER TO amaru_admin;

--
-- Name: auth_permission_id_seq; Type: SEQUENCE; Schema: public; Owner: amaru_admin
--

ALTER TABLE public.auth_permission ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_permission_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_user; Type: TABLE; Schema: public; Owner: amaru_admin
--

CREATE TABLE public.auth_user (
    id integer NOT NULL,
    password character varying(128) NOT NULL,
    last_login timestamp with time zone,
    is_superuser boolean NOT NULL,
    username character varying(150) NOT NULL,
    first_name character varying(150) NOT NULL,
    last_name character varying(150) NOT NULL,
    email character varying(254) NOT NULL,
    is_staff boolean NOT NULL,
    is_active boolean NOT NULL,
    date_joined timestamp with time zone NOT NULL
);


ALTER TABLE public.auth_user OWNER TO amaru_admin;

--
-- Name: auth_user_groups; Type: TABLE; Schema: public; Owner: amaru_admin
--

CREATE TABLE public.auth_user_groups (
    id bigint NOT NULL,
    user_id integer NOT NULL,
    group_id integer NOT NULL
);


ALTER TABLE public.auth_user_groups OWNER TO amaru_admin;

--
-- Name: auth_user_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: amaru_admin
--

ALTER TABLE public.auth_user_groups ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_user_groups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_user_id_seq; Type: SEQUENCE; Schema: public; Owner: amaru_admin
--

ALTER TABLE public.auth_user ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_user_user_permissions; Type: TABLE; Schema: public; Owner: amaru_admin
--

CREATE TABLE public.auth_user_user_permissions (
    id bigint NOT NULL,
    user_id integer NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.auth_user_user_permissions OWNER TO amaru_admin;

--
-- Name: auth_user_user_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: amaru_admin
--

ALTER TABLE public.auth_user_user_permissions ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_user_user_permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cuota_descuento; Type: TABLE; Schema: public; Owner: amaru_admin
--

CREATE TABLE public.cuota_descuento (
    id_cuota uuid NOT NULL,
    numero_cuota integer NOT NULL,
    monto_cuota numeric(12,2) NOT NULL,
    mes_ejecucion date NOT NULL,
    estado_pago character varying(25) NOT NULL,
    id_presupuesto uuid NOT NULL
);


ALTER TABLE public.cuota_descuento OWNER TO amaru_admin;

--
-- Name: django_admin_log; Type: TABLE; Schema: public; Owner: amaru_admin
--

CREATE TABLE public.django_admin_log (
    id integer NOT NULL,
    action_time timestamp with time zone NOT NULL,
    object_id text,
    object_repr character varying(200) NOT NULL,
    action_flag smallint NOT NULL,
    change_message text NOT NULL,
    content_type_id integer,
    user_id integer NOT NULL,
    CONSTRAINT django_admin_log_action_flag_check CHECK ((action_flag >= 0))
);


ALTER TABLE public.django_admin_log OWNER TO amaru_admin;

--
-- Name: django_admin_log_id_seq; Type: SEQUENCE; Schema: public; Owner: amaru_admin
--

ALTER TABLE public.django_admin_log ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_admin_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_content_type; Type: TABLE; Schema: public; Owner: amaru_admin
--

CREATE TABLE public.django_content_type (
    id integer NOT NULL,
    app_label character varying(100) NOT NULL,
    model character varying(100) NOT NULL
);


ALTER TABLE public.django_content_type OWNER TO amaru_admin;

--
-- Name: django_content_type_id_seq; Type: SEQUENCE; Schema: public; Owner: amaru_admin
--

ALTER TABLE public.django_content_type ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_content_type_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_migrations; Type: TABLE; Schema: public; Owner: amaru_admin
--

CREATE TABLE public.django_migrations (
    id bigint NOT NULL,
    app character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    applied timestamp with time zone NOT NULL
);


ALTER TABLE public.django_migrations OWNER TO amaru_admin;

--
-- Name: django_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: amaru_admin
--

ALTER TABLE public.django_migrations ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_migrations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_session; Type: TABLE; Schema: public; Owner: amaru_admin
--

CREATE TABLE public.django_session (
    session_key character varying(40) NOT NULL,
    session_data text NOT NULL,
    expire_date timestamp with time zone NOT NULL
);


ALTER TABLE public.django_session OWNER TO amaru_admin;

--
-- Name: documento_respaldo; Type: TABLE; Schema: public; Owner: amaru_admin
--

CREATE TABLE public.documento_respaldo (
    id_documento uuid NOT NULL,
    url_imagen_s3 character varying(500) NOT NULL,
    validado_taller boolean NOT NULL,
    folio_unico_qr character varying(100) NOT NULL
);


ALTER TABLE public.documento_respaldo OWNER TO amaru_admin;

--
-- Name: empresa_convenio; Type: TABLE; Schema: public; Owner: amaru_admin
--

CREATE TABLE public.empresa_convenio (
    id_empresa integer NOT NULL,
    razon_social character varying(150) NOT NULL,
    rut_empresa character varying(12) NOT NULL,
    convenio_vigente boolean NOT NULL
);


ALTER TABLE public.empresa_convenio OWNER TO amaru_admin;

--
-- Name: empresa_convenio_id_empresa_seq; Type: SEQUENCE; Schema: public; Owner: amaru_admin
--

ALTER TABLE public.empresa_convenio ALTER COLUMN id_empresa ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.empresa_convenio_id_empresa_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: lote_nomina_sindicato; Type: TABLE; Schema: public; Owner: amaru_admin
--

CREATE TABLE public.lote_nomina_sindicato (
    id_lote uuid NOT NULL,
    total_registros integer NOT NULL,
    hash_archivo_sha256 character varying(64) NOT NULL,
    fecha_carga timestamp with time zone NOT NULL,
    id_empresa integer NOT NULL,
    rut_responsable_carga character varying(12) NOT NULL
);


ALTER TABLE public.lote_nomina_sindicato OWNER TO amaru_admin;

--
-- Name: movimiento_stock; Type: TABLE; Schema: public; Owner: amaru_admin
--

CREATE TABLE public.movimiento_stock (
    id_movimiento uuid NOT NULL,
    tipo_movimiento character varying(20) NOT NULL,
    cantidad integer NOT NULL,
    fecha_hora timestamp with time zone NOT NULL,
    sku_armazon character varying(50) NOT NULL,
    folio_unico_qr character varying(100)
);


ALTER TABLE public.movimiento_stock OWNER TO amaru_admin;

--
-- Name: nomina_trabajador; Type: TABLE; Schema: public; Owner: amaru_admin
--

CREATE TABLE public.nomina_trabajador (
    id bigint NOT NULL,
    rut character varying(12) NOT NULL,
    nombre_completo character varying(150) NOT NULL,
    empresa_sindicato character varying(150) NOT NULL,
    habilitado boolean NOT NULL,
    creado_el timestamp with time zone NOT NULL,
    actualizado_el timestamp with time zone NOT NULL
);


ALTER TABLE public.nomina_trabajador OWNER TO amaru_admin;

--
-- Name: nomina_trabajador_id_seq; Type: SEQUENCE; Schema: public; Owner: amaru_admin
--

ALTER TABLE public.nomina_trabajador ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.nomina_trabajador_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: paciente; Type: TABLE; Schema: public; Owner: amaru_admin
--

CREATE TABLE public.paciente (
    rut_usuario character varying(12) NOT NULL,
    tipo_cliente character varying(20) NOT NULL,
    consentimiento_biometrico boolean NOT NULL,
    id_empresa integer,
    consentimiento_ley_21719 boolean NOT NULL,
    fecha_consentimiento timestamp with time zone,
    ip_origen inet
);


ALTER TABLE public.paciente OWNER TO amaru_admin;

--
-- Name: personal_optica; Type: TABLE; Schema: public; Owner: amaru_admin
--

CREATE TABLE public.personal_optica (
    rut_usuario character varying(12) NOT NULL,
    rol_sistema character varying(20) NOT NULL
);


ALTER TABLE public.personal_optica OWNER TO amaru_admin;

--
-- Name: presupuesto; Type: TABLE; Schema: public; Owner: amaru_admin
--

CREATE TABLE public.presupuesto (
    id_presupuesto uuid NOT NULL,
    monto_total numeric(12,2) NOT NULL,
    clausula_aceleracion_aceptada boolean NOT NULL,
    folio_unico_qr character varying(100) NOT NULL
);


ALTER TABLE public.presupuesto OWNER TO amaru_admin;

--
-- Name: recepcion_despacho; Type: TABLE; Schema: public; Owner: amaru_admin
--

CREATE TABLE public.recepcion_despacho (
    id_recepcion uuid NOT NULL,
    tipo_receptor character varying(20) NOT NULL,
    rut_receptor character varying(12) NOT NULL,
    codigo_barras_pdf417_leido character varying(255) NOT NULL,
    fecha_entrega timestamp with time zone NOT NULL,
    folio_unico_qr character varying(100) NOT NULL,
    firma_digital_b64 text,
    sello_integridad_pdf character varying(64)
);


ALTER TABLE public.recepcion_despacho OWNER TO amaru_admin;

--
-- Name: receta_optica; Type: TABLE; Schema: public; Owner: amaru_admin
--

CREATE TABLE public.receta_optica (
    id_receta uuid NOT NULL,
    fecha_emision date NOT NULL,
    parametros_oftalmologicos jsonb NOT NULL,
    archivo_url character varying(500),
    version_seq integer NOT NULL,
    rut_paciente character varying(12) NOT NULL
);


ALTER TABLE public.receta_optica OWNER TO amaru_admin;

--
-- Name: registro_auditoria; Type: TABLE; Schema: public; Owner: amaru_admin
--

CREATE TABLE public.registro_auditoria (
    id_evento bigint NOT NULL,
    accion_realizada character varying(255) NOT NULL,
    hash_integridad_sha256 character varying(64) NOT NULL,
    fecha_hora timestamp with time zone NOT NULL,
    rut_usuario_accion character varying(12) NOT NULL
);


ALTER TABLE public.registro_auditoria OWNER TO amaru_admin;

--
-- Name: registro_auditoria_id_evento_seq; Type: SEQUENCE; Schema: public; Owner: amaru_admin
--

ALTER TABLE public.registro_auditoria ALTER COLUMN id_evento ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.registro_auditoria_id_evento_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: reserva_hora; Type: TABLE; Schema: public; Owner: amaru_admin
--

CREATE TABLE public.reserva_hora (
    id_reserva uuid NOT NULL,
    fecha_hora_reserva timestamp with time zone NOT NULL,
    estado_reserva character varying(20) NOT NULL,
    rut_paciente character varying(12) NOT NULL
);


ALTER TABLE public.reserva_hora OWNER TO amaru_admin;

--
-- Name: solicitud_entrega; Type: TABLE; Schema: public; Owner: amaru_admin
--

CREATE TABLE public.solicitud_entrega (
    folio_unico_qr character varying(100) NOT NULL,
    estado_pedido character varying(30) NOT NULL,
    version_seq integer NOT NULL,
    fecha_ingreso timestamp with time zone NOT NULL,
    id_receta uuid,
    rut_paciente character varying(12) NOT NULL,
    rut_titular_pago character varying(12),
    sku_armazon character varying(50) NOT NULL,
    sello_integridad_pdf character varying(64)
);


ALTER TABLE public.solicitud_entrega OWNER TO amaru_admin;

--
-- Name: titular_pago; Type: TABLE; Schema: public; Owner: amaru_admin
--

CREATE TABLE public.titular_pago (
    rut_titular character varying(12) NOT NULL,
    nombre_completo character varying(150) NOT NULL,
    cupo_disponible numeric(12,2) NOT NULL,
    estado_laboral character varying(20) NOT NULL,
    fecha_actualizacion_padron timestamp with time zone NOT NULL,
    id_empresa integer NOT NULL
);


ALTER TABLE public.titular_pago OWNER TO amaru_admin;

--
-- Name: token_blacklist_blacklistedtoken; Type: TABLE; Schema: public; Owner: amaru_admin
--

CREATE TABLE public.token_blacklist_blacklistedtoken (
    id bigint NOT NULL,
    blacklisted_at timestamp with time zone NOT NULL,
    token_id bigint NOT NULL
);


ALTER TABLE public.token_blacklist_blacklistedtoken OWNER TO amaru_admin;

--
-- Name: token_blacklist_blacklistedtoken_id_seq; Type: SEQUENCE; Schema: public; Owner: amaru_admin
--

ALTER TABLE public.token_blacklist_blacklistedtoken ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.token_blacklist_blacklistedtoken_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: token_blacklist_outstandingtoken; Type: TABLE; Schema: public; Owner: amaru_admin
--

CREATE TABLE public.token_blacklist_outstandingtoken (
    id bigint NOT NULL,
    token text NOT NULL,
    created_at timestamp with time zone,
    expires_at timestamp with time zone NOT NULL,
    user_id integer,
    jti character varying(255) NOT NULL
);


ALTER TABLE public.token_blacklist_outstandingtoken OWNER TO amaru_admin;

--
-- Name: token_blacklist_outstandingtoken_id_seq; Type: SEQUENCE; Schema: public; Owner: amaru_admin
--

ALTER TABLE public.token_blacklist_outstandingtoken ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.token_blacklist_outstandingtoken_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: usuario; Type: TABLE; Schema: public; Owner: amaru_admin
--

CREATE TABLE public.usuario (
    rut_usuario character varying(12) NOT NULL,
    nombres character varying(100) NOT NULL,
    apellidos character varying(100) NOT NULL,
    correo_electronico character varying(150) NOT NULL,
    contrasena_hash character varying(255) NOT NULL,
    creado_el timestamp with time zone NOT NULL
);


ALTER TABLE public.usuario OWNER TO amaru_admin;

--
-- Data for Name: armazon_inventario; Type: TABLE DATA; Schema: public; Owner: amaru_admin
--

COPY public.armazon_inventario (sku_armazon, modelo_lente, caracteristicas_tecnicas, certificaciones_multiples, stock_disponible, precio_clp) FROM stdin;
EPP-MIN-001	Titanium Shield Industrial Pro	{}	[]	15	85000
\.


--
-- Data for Name: auth_group; Type: TABLE DATA; Schema: public; Owner: amaru_admin
--

COPY public.auth_group (id, name) FROM stdin;
1	Administrador
2	Operador
3	Auditor
\.


--
-- Data for Name: auth_group_permissions; Type: TABLE DATA; Schema: public; Owner: amaru_admin
--

COPY public.auth_group_permissions (id, group_id, permission_id) FROM stdin;
1	1	101
2	1	102
3	3	102
4	2	102
\.


--
-- Data for Name: auth_permission; Type: TABLE DATA; Schema: public; Owner: amaru_admin
--

COPY public.auth_permission (id, name, content_type_id, codename) FROM stdin;
1	Can add log entry	1	add_logentry
2	Can change log entry	1	change_logentry
3	Can delete log entry	1	delete_logentry
4	Can view log entry	1	view_logentry
5	Can add permission	2	add_permission
6	Can change permission	2	change_permission
7	Can delete permission	2	delete_permission
8	Can view permission	2	view_permission
9	Can add group	3	add_group
10	Can change group	3	change_group
11	Can delete group	3	delete_group
12	Can view group	3	view_group
13	Can add user	4	add_user
14	Can change user	4	change_user
15	Can delete user	4	delete_user
16	Can view user	4	view_user
17	Can add content type	5	add_contenttype
18	Can change content type	5	change_contenttype
19	Can delete content type	5	delete_contenttype
20	Can view content type	5	view_contenttype
21	Can add session	6	add_session
22	Can change session	6	change_session
23	Can delete session	6	delete_session
24	Can view session	6	view_session
25	Can add Empresa en Convenio	7	add_empresaconvenio
26	Can change Empresa en Convenio	7	change_empresaconvenio
27	Can delete Empresa en Convenio	7	delete_empresaconvenio
28	Can view Empresa en Convenio	7	view_empresaconvenio
29	Can add Usuario	8	add_usuario
30	Can change Usuario	8	change_usuario
31	Can delete Usuario	8	delete_usuario
32	Can view Usuario	8	view_usuario
33	Can add Personal de Óptica	9	add_personaloptica
34	Can change Personal de Óptica	9	change_personaloptica
35	Can delete Personal de Óptica	9	delete_personaloptica
36	Can view Personal de Óptica	9	view_personaloptica
37	Can add Lote Nómina Sindicato	10	add_lotenominasindicato
38	Can change Lote Nómina Sindicato	10	change_lotenominasindicato
39	Can delete Lote Nómina Sindicato	10	delete_lotenominasindicato
40	Can view Lote Nómina Sindicato	10	view_lotenominasindicato
41	Can add Titular de Pago	11	add_titularpago
42	Can change Titular de Pago	11	change_titularpago
43	Can delete Titular de Pago	11	delete_titularpago
44	Can view Titular de Pago	11	view_titularpago
45	Can add Paciente	12	add_paciente
46	Can change Paciente	12	change_paciente
47	Can delete Paciente	12	delete_paciente
48	Can view Paciente	12	view_paciente
49	Can add Receta Óptica	13	add_recetaoptica
50	Can change Receta Óptica	13	change_recetaoptica
51	Can delete Receta Óptica	13	delete_recetaoptica
52	Can view Receta Óptica	13	view_recetaoptica
53	Can add Reserva de Hora	14	add_reservahora
54	Can change Reserva de Hora	14	change_reservahora
55	Can delete Reserva de Hora	14	delete_reservahora
56	Can view Reserva de Hora	14	view_reservahora
57	Can add Armazón en Inventario	15	add_armazoninventario
58	Can change Armazón en Inventario	15	change_armazoninventario
59	Can delete Armazón en Inventario	15	delete_armazoninventario
60	Can view Armazón en Inventario	15	view_armazoninventario
61	Can add Presupuesto	16	add_presupuesto
62	Can change Presupuesto	16	change_presupuesto
63	Can delete Presupuesto	16	delete_presupuesto
64	Can view Presupuesto	16	view_presupuesto
65	Can add Cuota de Descuento	17	add_cuotadescuento
66	Can change Cuota de Descuento	17	change_cuotadescuento
67	Can delete Cuota de Descuento	17	delete_cuotadescuento
68	Can view Cuota de Descuento	17	view_cuotadescuento
69	Can add Solicitud de Entrega	18	add_solicitudentrega
70	Can change Solicitud de Entrega	18	change_solicitudentrega
71	Can delete Solicitud de Entrega	18	delete_solicitudentrega
72	Can view Solicitud de Entrega	18	view_solicitudentrega
73	Can add Recepción y Despacho	19	add_recepciondespacho
74	Can change Recepción y Despacho	19	change_recepciondespacho
75	Can delete Recepción y Despacho	19	delete_recepciondespacho
76	Can view Recepción y Despacho	19	view_recepciondespacho
77	Can add Movimiento de Stock	20	add_movimientostock
78	Can change Movimiento de Stock	20	change_movimientostock
79	Can delete Movimiento de Stock	20	delete_movimientostock
80	Can view Movimiento de Stock	20	view_movimientostock
81	Can add Documento de Respaldo	21	add_documentorespaldo
82	Can change Documento de Respaldo	21	change_documentorespaldo
83	Can delete Documento de Respaldo	21	delete_documentorespaldo
84	Can view Documento de Respaldo	21	view_documentorespaldo
85	Can add Registro de Auditoría	22	add_registroauditoria
86	Can change Registro de Auditoría	22	change_registroauditoria
87	Can delete Registro de Auditoría	22	delete_registroauditoria
88	Can view Registro de Auditoría	22	view_registroauditoria
89	Can add Blacklisted Token	23	add_blacklistedtoken
90	Can change Blacklisted Token	23	change_blacklistedtoken
91	Can delete Blacklisted Token	23	delete_blacklistedtoken
92	Can view Blacklisted Token	23	view_blacklistedtoken
93	Can add Outstanding Token	24	add_outstandingtoken
94	Can change Outstanding Token	24	change_outstandingtoken
95	Can delete Outstanding Token	24	delete_outstandingtoken
96	Can view Outstanding Token	24	view_outstandingtoken
97	Can add Nómina de Trabajador	25	add_nominatrabajador
98	Can change Nómina de Trabajador	25	change_nominatrabajador
99	Can delete Nómina de Trabajador	25	delete_nominatrabajador
100	Can view Nómina de Trabajador	25	view_nominatrabajador
101	Puede ver Dashboard Gerencial	9	ver_dashboard
102	Puede ver Trazabilidad y Seguimiento	9	ver_trazabilidad
\.


--
-- Data for Name: auth_user; Type: TABLE DATA; Schema: public; Owner: amaru_admin
--

COPY public.auth_user (id, password, last_login, is_superuser, username, first_name, last_name, email, is_staff, is_active, date_joined) FROM stdin;
2	pbkdf2_sha256$720000$qN9EzJaCy4d6Y9nvuKfoms$n8VoGv/zc5LsO5PNPzkvFYUCflQJLvyQHJqg+226ZXI=	\N	f	99999991-K	Trabajador Demo 1	Automático		f	t	2026-11-03 19:53:54.415271+00
4	pbkdf2_sha256$720000$54qPd1wqMGAl7DwqTOekTC$8hfL1YoGJ4r7+mqlg4xE6aAXUU6/ywA51vZrrmZCU10=	\N	f	angel				f	t	2026-11-05 16:09:49+00
5	pbkdf2_sha256$720000$NTmsfWw2Mp1VMlIrld6cpD$hgpnRF+2zPxd/BFVYSnIqCDZJQvJzZTITe62TMDkhZs=	\N	f	juanita				f	t	2026-11-05 17:13:19+00
3	pbkdf2_sha256$720000$mgLNqkMeXOQo5usWxgxcpM$qpgudetmXhw8hmrTyB4PT2CbBvHsQlGFRTI+0yPkqRM=	2026-11-05 17:30:41.756967+00	t	migue			miguel@gmail.com	t	t	2026-11-04 20:34:02.786939+00
9	pbkdf2_sha256$1000000$6vMtvcVeNoXmwP7YsLeZEO$z4NXpg+6poD6Hy2sf6NKiWrrnFu5Jnt5b9HVaK4qRRI=	\N	f	18234567-8	Manuel	Gutiérrez	mgutierrez.centinela@minera.cl	f	t	2026-11-05 19:45:50.215146+00
1	pbkdf2_sha256$1000000$GZQqsebuiFAzpkPjUXXrMH$B4xsfJmVJapZZ1x5RzgzQfSwwnWnaq/MeH6A+fEpWeY=	2026-11-24 15:11:35.233665+00	t	miguel			miguel@gmail.com	t	t	2026-11-03 19:01:56.430649+00
6	pbkdf2_sha256$1000000$npd01oPMvML3ECl9Eiypkx$bBYh8QoRuK7e24ls87ZaVo8wvl676nd4a6O5GhXYtGo=	\N	t	15890123-4	Carlos	Mendoza	admin@opticaamaru.cl	t	t	2026-11-05 19:45:49.430501+00
7	pbkdf2_sha256$1000000$hiMYE68Sb0jn1ChEEP6Y6W$a3Lopyt+K1DaF52N9uv8viv6BQdcTpxjU4h1VsBoymY=	\N	f	17456789-2	Juanita	Araya	operador1@opticaamaru.cl	t	t	2026-11-05 19:45:49.704603+00
8	pbkdf2_sha256$1000000$xJyqShiiS7s5MpYnMMGci5$sjJmIwq54O7NEVEWEpZEj10OsCEVzqAmKRN6+EoqUG4=	\N	f	16345678-K	Rodrigo	Sanhueza	auditor@opticaamaru.cl	t	t	2026-11-05 19:45:49.960371+00
\.


--
-- Data for Name: auth_user_groups; Type: TABLE DATA; Schema: public; Owner: amaru_admin
--

COPY public.auth_user_groups (id, user_id, group_id) FROM stdin;
11	6	1
12	7	2
13	8	3
\.


--
-- Data for Name: auth_user_user_permissions; Type: TABLE DATA; Schema: public; Owner: amaru_admin
--

COPY public.auth_user_user_permissions (id, user_id, permission_id) FROM stdin;
\.


--
-- Data for Name: cuota_descuento; Type: TABLE DATA; Schema: public; Owner: amaru_admin
--

COPY public.cuota_descuento (id_cuota, numero_cuota, monto_cuota, mes_ejecucion, estado_pago, id_presupuesto) FROM stdin;
f6f3ec22-016d-4735-a4e8-1bc0246913a5	1	42500.00	2026-11-30	Cobrado_Finiquito	8e060316-7d07-43e5-8bc4-308b536e930f
fadaf1cd-8194-4413-9e66-75022c86f7df	2	42500.00	2026-12-30	Cobrado_Finiquito	8e060316-7d07-43e5-8bc4-308b536e930f
f371fdb2-749d-4480-b3d9-a7e212e66913	1	28333.00	2026-12-10	Cobrado_Finiquito	7debc0f3-7087-49dd-b247-4bed787e80d6
2c3df1f6-3545-4bca-a5e8-78b226707f71	2	28333.00	2027-01-10	Cobrado_Finiquito	7debc0f3-7087-49dd-b247-4bed787e80d6
ca59091c-c3da-4bbf-8eeb-deb61d7b4282	3	28333.00	2027-02-10	Cobrado_Finiquito	7debc0f3-7087-49dd-b247-4bed787e80d6
073a3737-56ec-4e8d-8b20-5ace18d8dd18	1	21250.00	2026-12-10	Pendiente	72aebd36-ccd8-4b35-8546-7113edd2056a
e9da226c-d927-4835-838e-797d9512c9b8	2	21250.00	2027-01-10	Pendiente	72aebd36-ccd8-4b35-8546-7113edd2056a
624391c0-6583-4ac2-9806-5521f07f2f07	3	21250.00	2027-02-10	Pendiente	72aebd36-ccd8-4b35-8546-7113edd2056a
724b8a7e-85db-4e74-bd19-fa960ce6d5e7	4	21250.00	2027-03-10	Pendiente	72aebd36-ccd8-4b35-8546-7113edd2056a
106583dd-5ff6-4977-ac80-67f1440b7dd7	1	21250.00	2026-12-13	Pendiente	11451db0-0231-4fa1-ac77-2c777be1ad67
a04112a4-8cae-404c-8b1a-dbd46fd87d03	2	21250.00	2027-01-13	Pendiente	11451db0-0231-4fa1-ac77-2c777be1ad67
c9ddbb5b-ee08-4a18-91be-dcab3110dffd	3	21250.00	2027-02-13	Pendiente	11451db0-0231-4fa1-ac77-2c777be1ad67
5a185b91-20dc-4328-812c-1d95c196aff7	4	21250.00	2027-03-13	Pendiente	11451db0-0231-4fa1-ac77-2c777be1ad67
\.


--
-- Data for Name: django_admin_log; Type: TABLE DATA; Schema: public; Owner: amaru_admin
--

COPY public.django_admin_log (id, action_time, object_id, object_repr, action_flag, change_message, content_type_id, user_id) FROM stdin;
1	2026-11-05 16:09:49.312767+00	4	angel	1	[{"added": {}}]	4	1
2	2026-11-05 16:10:24.38353+00	4	angel	2	[]	4	1
3	2026-11-05 17:13:20.369977+00	5	juanita	1	[{"added": {}}]	4	3
4	2026-11-05 17:13:25.558449+00	5	juanita	2	[]	4	3
\.


--
-- Data for Name: django_content_type; Type: TABLE DATA; Schema: public; Owner: amaru_admin
--

COPY public.django_content_type (id, app_label, model) FROM stdin;
1	admin	logentry
2	auth	permission
3	auth	group
4	auth	user
5	contenttypes	contenttype
6	sessions	session
7	autenticacion	empresaconvenio
8	autenticacion	usuario
9	autenticacion	personaloptica
10	autenticacion	lotenominasindicato
11	autenticacion	titularpago
12	autenticacion	paciente
13	clinico	recetaoptica
14	clinico	reservahora
15	transacciones	armazoninventario
16	transacciones	presupuesto
17	transacciones	cuotadescuento
18	transacciones	solicitudentrega
19	transacciones	recepciondespacho
20	transacciones	movimientostock
21	transacciones	documentorespaldo
22	auditoria	registroauditoria
23	token_blacklist	blacklistedtoken
24	token_blacklist	outstandingtoken
25	autenticacion	nominatrabajador
\.


--
-- Data for Name: django_migrations; Type: TABLE DATA; Schema: public; Owner: amaru_admin
--

COPY public.django_migrations (id, app, name, applied) FROM stdin;
1	contenttypes	0001_initial	2026-11-02 18:49:36.220665+00
2	auth	0001_initial	2026-11-02 18:49:36.328536+00
3	admin	0001_initial	2026-11-02 18:49:36.358018+00
4	admin	0002_logentry_remove_auto_add	2026-11-02 18:49:36.364153+00
5	admin	0003_logentry_add_action_flag_choices	2026-11-02 18:49:36.372403+00
6	autenticacion	0001_initial	2026-11-02 18:49:36.480597+00
7	auditoria	0001_initial	2026-11-02 18:49:36.50726+00
8	contenttypes	0002_remove_content_type_name	2026-11-02 18:49:36.531157+00
9	auth	0002_alter_permission_name_max_length	2026-11-02 18:49:36.540763+00
10	auth	0003_alter_user_email_max_length	2026-11-02 18:49:36.549859+00
11	auth	0004_alter_user_username_opts	2026-11-02 18:49:36.561241+00
12	auth	0005_alter_user_last_login_null	2026-11-02 18:49:36.572718+00
13	auth	0006_require_contenttypes_0002	2026-11-02 18:49:36.578375+00
14	auth	0007_alter_validators_add_error_messages	2026-11-02 18:49:36.587764+00
15	auth	0008_alter_user_username_max_length	2026-11-02 18:49:36.60943+00
16	auth	0009_alter_user_last_name_max_length	2026-11-02 18:49:36.620761+00
17	auth	0010_alter_group_name_max_length	2026-11-02 18:49:36.635845+00
18	auth	0011_update_proxy_permissions	2026-11-02 18:49:36.648912+00
19	auth	0012_alter_user_first_name_max_length	2026-11-02 18:49:36.662422+00
20	clinico	0001_initial	2026-11-02 18:49:36.711671+00
21	sessions	0001_initial	2026-11-02 18:49:36.739478+00
22	transacciones	0001_initial	2026-11-02 18:49:36.960713+00
23	auditoria	0002_triggers_integridad	2026-11-02 18:51:54.703258+00
24	token_blacklist	0001_initial	2026-11-03 18:50:43.840577+00
25	token_blacklist	0002_outstandingtoken_jti_hex	2026-11-03 18:50:43.851034+00
26	token_blacklist	0003_auto_20171017_2007	2026-11-03 18:50:43.865227+00
27	token_blacklist	0004_auto_20171017_2013	2026-11-03 18:50:43.885554+00
28	token_blacklist	0005_remove_outstandingtoken_jti	2026-11-03 18:50:43.898094+00
29	token_blacklist	0006_auto_20171017_2113	2026-11-03 18:50:43.91998+00
30	token_blacklist	0007_auto_20171017_2214	2026-11-03 18:50:43.95906+00
31	token_blacklist	0008_migrate_to_bigautofield	2026-11-03 18:50:44.015014+00
32	token_blacklist	0010_fix_migrate_to_bigautofield	2026-11-03 18:50:44.025767+00
33	token_blacklist	0011_linearizes_history	2026-11-03 18:50:44.029386+00
34	token_blacklist	0012_alter_outstandingtoken_user	2026-11-03 18:50:44.037385+00
35	token_blacklist	0013_alter_blacklistedtoken_options_and_more	2026-11-03 18:50:44.044949+00
36	autenticacion	0002_paciente_consentimiento_ley_21719_and_more	2026-11-08 12:25:54.306337+00
37	autenticacion	0003_nominatrabajador	2026-11-10 13:24:18.710452+00
38	transacciones	0002_recepciondespacho_firma_digital_b64_and_more	2026-11-10 13:41:15.560414+00
\.


--
-- Data for Name: django_session; Type: TABLE DATA; Schema: public; Owner: amaru_admin
--

COPY public.django_session (session_key, session_data, expire_date) FROM stdin;
uwfu41fgaxo1l4b2eumnp3i2bmcf23fg	.eJxVjEsOwjAMBe-SNYqStI1rluw5Q-TYDimgVupnhbg7VOoCtm9m3ssk2taatkXnNIg5m8acfrdM_NBxB3Kn8TZZnsZ1HrLdFXvQxV4n0eflcP8OKi31W7MCxth7ZlUBIBccRUWCVrOU3DssHVNofNOiy4oArkjoOo_Fo3gw7w_-EjgV:1xP10g:eesWcQPsK4QQhJlj0AyItt2maaoNm_5rPi-tb3-b8sY	2026-11-19 17:12:22.648902+00
arji5d20ay10gegit4z8lugdcgz6varx	.eJxVjEsOwjAMBe-SNYqStI1rluw5Q-TYDimgVupnhbg7VOoCtm9m3ssk2taatkXnNIg5m8acfrdM_NBxB3Kn8TZZnsZ1HrLdFXvQxV4n0eflcP8OKi31W7MCxth7ZlUBIBccRUWCVrOU3DssHVNofNOiy4oArkjoOo_Fo3gw7w_-EjgV:1xP1IP:Vtsofyj9ja4hQEtk27sx7xff3j8A066HIdhsQgx90u8	2026-11-19 17:30:41.759407+00
cncnl8dec2rz6ggu4cuprl2r8l19ym6f	.eJxVjMsOwiAQRf-FtSFAGR4u3fsNBGZAqgaS0q6M_65NutDtPefcFwtxW2vYRl7CTOzMJDv9biniI7cd0D22W-fY27rMie8KP-jg1075eTncv4MaR_3WkzPaqiwJCynjDUkQzjoqtqCDCIBKg1fSlzQJFFREToqE1UCJrJ_Y-wPUpzex:1xVsBD:ugA9pdYlSfWLAMw3qmc5cgjaHhAZb3ty4eKK0Balt90	2026-12-08 15:11:35.236199+00
\.


--
-- Data for Name: documento_respaldo; Type: TABLE DATA; Schema: public; Owner: amaru_admin
--

COPY public.documento_respaldo (id_documento, url_imagen_s3, validado_taller, folio_unico_qr) FROM stdin;
fc157ffe-9df3-47db-ac6e-a0acac60e438	https://s3.amazonaws.com/amaru-comprobantes/FOLIO-402C7356_package.json	t	FOLIO-402C7356
\.


--
-- Data for Name: empresa_convenio; Type: TABLE DATA; Schema: public; Owner: amaru_admin
--

COPY public.empresa_convenio (id_empresa, razon_social, rut_empresa, convenio_vigente) FROM stdin;
1	Minera Faena Norte	76111222-3	t
\.


--
-- Data for Name: lote_nomina_sindicato; Type: TABLE DATA; Schema: public; Owner: amaru_admin
--

COPY public.lote_nomina_sindicato (id_lote, total_registros, hash_archivo_sha256, fecha_carga, id_empresa, rut_responsable_carga) FROM stdin;
\.


--
-- Data for Name: movimiento_stock; Type: TABLE DATA; Schema: public; Owner: amaru_admin
--

COPY public.movimiento_stock (id_movimiento, tipo_movimiento, cantidad, fecha_hora, sku_armazon, folio_unico_qr) FROM stdin;
4ce76981-3a1c-4635-89b6-9d472336bb0a	CONVENIO	1	2026-11-02 19:37:04.131127+00	EPP-MIN-001	FOLIO-402C7356
e56391e8-a0d0-4c56-acd2-e7c9aeaa73d7	VENTA_DIRECTA	1	2026-11-03 20:13:05.307224+00	EPP-MIN-001	FOLIO-61E9FB66
cd631eed-3267-4f2c-b21c-f9e1fc704e98	VENTA_DIRECTA	1	2026-11-10 15:21:45.774944+00	EPP-MIN-001	FOLIO-8F1085AD
09d86273-d09e-4eeb-bdb5-47ddcf27fdfb	VENTA_DIRECTA	1	2026-11-10 18:11:02.997277+00	EPP-MIN-001	FOLIO-09B9A753
6af18ed3-6ff1-42f5-bd4d-5dcbbda47481	VENTA_DIRECTA	1	2026-11-13 00:30:55.94513+00	EPP-MIN-001	FOLIO-54CA6923
\.


--
-- Data for Name: nomina_trabajador; Type: TABLE DATA; Schema: public; Owner: amaru_admin
--

COPY public.nomina_trabajador (id, rut, nombre_completo, empresa_sindicato, habilitado, creado_el, actualizado_el) FROM stdin;
1	24533343-9	Trabajador Optisalud Demo	Minera Escondida	t	2026-11-10 14:22:17.973198+00	2026-11-10 14:22:17.97341+00
\.


--
-- Data for Name: paciente; Type: TABLE DATA; Schema: public; Owner: amaru_admin
--

COPY public.paciente (rut_usuario, tipo_cliente, consentimiento_biometrico, id_empresa, consentimiento_ley_21719, fecha_consentimiento, ip_origen) FROM stdin;
12345678-9	Convenio	f	1	f	\N	\N
2222222-2	Convenio	f	1	f	\N	\N
99999991-K	Convenio	t	1	f	\N	\N
99999992-K	Convenio	t	1	f	\N	\N
99999993-K	Convenio	t	1	f	\N	\N
99999994-K	Convenio	t	1	f	\N	\N
99999995-K	Convenio	t	1	f	\N	\N
99999996-K	Convenio	t	1	f	\N	\N
99999997-K	Convenio	t	1	f	\N	\N
99999998-K	Convenio	t	1	f	\N	\N
99999999-K	Convenio	t	1	f	\N	\N
999999910-K	Convenio	t	1	f	\N	\N
24533343-9	Convenio	t	1	f	\N	\N
\.


--
-- Data for Name: personal_optica; Type: TABLE DATA; Schema: public; Owner: amaru_admin
--

COPY public.personal_optica (rut_usuario, rol_sistema) FROM stdin;
15890123-4	Admin
17456789-2	Operador
16345678-K	Auditor
\.


--
-- Data for Name: presupuesto; Type: TABLE DATA; Schema: public; Owner: amaru_admin
--

COPY public.presupuesto (id_presupuesto, monto_total, clausula_aceleracion_aceptada, folio_unico_qr) FROM stdin;
8e060316-7d07-43e5-8bc4-308b536e930f	85000.00	t	FOLIO-402C7356
4a11ee76-3f36-4b74-babc-95023fb87925	85000.00	t	FOLIO-61E9FB66
7debc0f3-7087-49dd-b247-4bed787e80d6	85000.00	t	FOLIO-8F1085AD
72aebd36-ccd8-4b35-8546-7113edd2056a	85000.00	t	FOLIO-09B9A753
11451db0-0231-4fa1-ac77-2c777be1ad67	85000.00	t	FOLIO-54CA6923
\.


--
-- Data for Name: recepcion_despacho; Type: TABLE DATA; Schema: public; Owner: amaru_admin
--

COPY public.recepcion_despacho (id_recepcion, tipo_receptor, rut_receptor, codigo_barras_pdf417_leido, fecha_entrega, folio_unico_qr, firma_digital_b64, sello_integridad_pdf) FROM stdin;
\.


--
-- Data for Name: receta_optica; Type: TABLE DATA; Schema: public; Owner: amaru_admin
--

COPY public.receta_optica (id_receta, fecha_emision, parametros_oftalmologicos, archivo_url, version_seq, rut_paciente) FROM stdin;
594c0d73-99d3-4ff3-9de1-3d093550e754	2026-11-05	{"ojo_derecho": {"dp": 31, "eje": 90, "esfera": -1.25, "adicion": 1.5, "cilindro": -0.5}, "ojo_izquierdo": {"dp": 31, "eje": 85, "esfera": -1.0, "adicion": 1.5, "cilindro": -0.25}}	\N	1	12345678-9
1e94e2bb-7b29-479a-a430-71b0869f3517	2026-11-05	{"ojo_derecho": {"dp": 31.5, "eje": 90, "esfera": -2.0, "adicion": 1.75, "cilindro": -0.5}, "ojo_izquierdo": {"dp": 31.0, "eje": 85, "esfera": -1.75, "adicion": 1.75, "cilindro": -0.75}}	\N	1	12345678-9
048ed8da-3e24-46d3-a464-a10a1d8a0d19	2026-04-10	{"ojo_derecho": {"dp": 31.5, "eje": 90, "esfera": -1.5, "adicion": 1.75, "cilindro": -0.5}, "ojo_izquierdo": {"dp": 31, "eje": 85, "esfera": -1.25, "adicion": 1.75, "cilindro": -0.75}}	/media/recetas/048ed8da-3e24-46d3-a464-a10a1d8a0d19_Captura de pantalla 2026-11-10 094137.png	1	24533343-9
febad2ca-e2e2-4db9-8a91-37615dd6ec6f	2026-11-10	{"ojo_derecho": {"dp": 31.5, "eje": 90, "esfera": -1.5, "adicion": 1.75, "cilindro": -0.5}, "ojo_izquierdo": {"dp": 31, "eje": 85, "esfera": -1.25, "adicion": 1.75, "cilindro": -0.75}}	/media/recetas/febad2ca-e2e2-4db9-8a91-37615dd6ec6f_Captura de pantalla 2026-11-10 094137.png	1	24533343-9
4677c67d-cdec-4842-bb3a-4f600b1d63b6	2026-11-10	{"ojo_derecho": {"dp": 31.5, "eje": 90, "esfera": -1.5, "adicion": 1.75, "cilindro": -0.5}, "ojo_izquierdo": {"dp": 31, "eje": 85, "esfera": -1.25, "adicion": 1.75, "cilindro": -0.75}}	/media/recetas/4677c67d-cdec-4842-bb3a-4f600b1d63b6_Captura de pantalla 2026-11-10 094137.png	1	24533343-9
196aa964-60f1-4eb1-ab26-e42e1848e55f	2026-11-10	{"ojo_derecho": {"dp": 31.5, "eje": 90, "esfera": -1.5, "adicion": 1.75, "cilindro": -0.5}, "ojo_izquierdo": {"dp": 31, "eje": 85, "esfera": -1.25, "adicion": 1.75, "cilindro": -0.75}}	/media/recetas/196aa964-60f1-4eb1-ab26-e42e1848e55f_Captura de pantalla 2026-11-10 094137.png	1	24533343-9
2be6be97-67a9-4fc4-bd4d-2b5f2b70b94e	2026-02-13	{"ojo_derecho": {"dp": 31.5, "eje": 90, "esfera": -1.5, "adicion": 1.75, "cilindro": -0.5}, "observaciones": "ninguno", "ojo_izquierdo": {"dp": 31, "eje": 85, "esfera": -1.25, "adicion": 1.75, "cilindro": -0.75}}	/media/recetas/2be6be97-67a9-4fc4-bd4d-2b5f2b70b94e_Captura de pantalla 2026-11-10 094137.png	1	24533343-9
c40103a7-b465-4308-adaa-c779cc900f87	2026-01-13	{"ojo_derecho": {"dp": 31.5, "eje": 90, "esfera": -1.5, "adicion": 1.75, "cilindro": -0.5}, "ojo_izquierdo": {"dp": 31, "eje": 85, "esfera": -1.25, "adicion": 1.75, "cilindro": -0.75}}	/media/recetas/c40103a7-b465-4308-adaa-c779cc900f87_Captura de pantalla 2026-11-10 094137.png	1	24533343-9
\.


--
-- Data for Name: registro_auditoria; Type: TABLE DATA; Schema: public; Owner: amaru_admin
--

COPY public.registro_auditoria (id_evento, accion_realizada, hash_integridad_sha256, fecha_hora, rut_usuario_accion) FROM stdin;
1	ACELERACION_FINIQUITO	8668eae01329a410937da67173c64a231f6527bab5f9644b43d12bfc2ac481b4	2026-11-02 19:44:02.041955+00	12345678-9
2	ACELERACION_FINIQUITO	1e9acb4c06c70b9459dd36a17d4bfe64a8084e1945d9358cd657a5d0e49266f8	2026-11-05 16:42:35.995374+00	12345678-9
3	ACELERACION_FINIQUITO	bc11b41392bc2eaaf2612d06d56398168f71d4e1c603ab7ad3c9b56836677ac4	2026-11-05 16:58:11.506962+00	12345678-9
4	ACELERACION_FINIQUITO	2f9df337da615b0dbb0579feb3caf3c9b7231bce457d4dd33a7fe79cedb47e3f	2026-11-10 15:22:09.428633+00	12345678-9
5	ACELERACION_FINIQUITO	89344219c8fb5d848a4f3da2caa093925c1e52bd6f7b56666a00823ea5efdad7	2026-11-10 17:55:19.336289+00	24533343-9
\.


--
-- Data for Name: reserva_hora; Type: TABLE DATA; Schema: public; Owner: amaru_admin
--

COPY public.reserva_hora (id_reserva, fecha_hora_reserva, estado_reserva, rut_paciente) FROM stdin;
\.


--
-- Data for Name: solicitud_entrega; Type: TABLE DATA; Schema: public; Owner: amaru_admin
--

COPY public.solicitud_entrega (folio_unico_qr, estado_pedido, version_seq, fecha_ingreso, id_receta, rut_paciente, rut_titular_pago, sku_armazon, sello_integridad_pdf) FROM stdin;
FOLIO-402C7356	Retencion_Laboral	5	2026-11-02 19:37:04.109401+00	594c0d73-99d3-4ff3-9de1-3d093550e754	2222222-2	2222222-2	EPP-MIN-001	\N
FOLIO-61E9FB66	Retencion_Laboral	2	2026-11-03 20:13:05.29227+00	\N	99999991-K	\N	EPP-MIN-001	\N
FOLIO-09B9A753	Recibida	1	2026-11-10 18:11:02.96445+00	196aa964-60f1-4eb1-ab26-e42e1848e55f	24533343-9	\N	EPP-MIN-001	\N
FOLIO-8F1085AD	Retencion_Laboral	3	2026-11-10 15:21:45.753963+00	048ed8da-3e24-46d3-a464-a10a1d8a0d19	24533343-9	\N	EPP-MIN-001	5300ca508e377a64acddee4e58ce9ebde92bf9c593a9553b2f4fcf30d1872ed7
FOLIO-54CA6923	Recibida	1	2026-11-13 00:30:55.918313+00	2be6be97-67a9-4fc4-bd4d-2b5f2b70b94e	24533343-9	\N	EPP-MIN-001	\N
\.


--
-- Data for Name: titular_pago; Type: TABLE DATA; Schema: public; Owner: amaru_admin
--

COPY public.titular_pago (rut_titular, nombre_completo, cupo_disponible, estado_laboral, fecha_actualizacion_padron, id_empresa) FROM stdin;
12345678-9	Operador Minero	500000.00	Activo	2026-11-02 19:22:32.049281+00	1
2222222-2	Trabajador Dos	400000.00	Activo	2026-11-02 19:29:19.545263+00	1
\.


--
-- Data for Name: token_blacklist_blacklistedtoken; Type: TABLE DATA; Schema: public; Owner: amaru_admin
--

COPY public.token_blacklist_blacklistedtoken (id, blacklisted_at, token_id) FROM stdin;
\.


--
-- Data for Name: token_blacklist_outstandingtoken; Type: TABLE DATA; Schema: public; Owner: amaru_admin
--

COPY public.token_blacklist_outstandingtoken (id, token, created_at, expires_at, user_id, jti) FROM stdin;
1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NDMzNzMzMSwiaWF0IjoxNzkzNzMyNTMxLCJqdGkiOiI5ZjliMzk1NDRjMjM0ZGI0YTI4MTU0ZWNkMDkwOWJjOCIsInVzZXJfaWQiOiIxIn0.wAACbEkZPstFRZPDfBph3oVYj7MLf2HfPOdr-dTM3Hc	2026-11-03 19:02:11.772895+00	2026-11-10 19:02:11+00	1	9f9b39544c234db4a28154ecd0909bc8
2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NDM0MTQzOCwiaWF0IjoxNzkzNzM2NjM4LCJqdGkiOiIyN2RkZWFmZjNhODE0ODIzODlhNTBmNTJmMGIwNzM0YSIsInVzZXJfaWQiOiIxIn0.vBIYQ5u6UKMKwIUuwMRIql0VpqQhHp9Z0muvhFMyK2s	2026-11-03 20:10:38.39916+00	2026-11-10 20:10:38+00	1	27ddeaff3a81482389a50f52f0b0734a
3	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NDM0MTU2NiwiaWF0IjoxNzkzNzM2NzY2LCJqdGkiOiI2NTNmMzkwMzUyMzQ0YjZhYTY2NGVlNDJkMTAxNTRjZSIsInVzZXJfaWQiOiIxIn0.z8ulDgWo68mJq-PjsTIrO4_LIHcB0TRp5rllCx2Uzs0	2026-11-03 20:12:46.032667+00	2026-11-10 20:12:46+00	1	653f390352344b6aa664ee42d10154ce
4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NDUwMDAwNywiaWF0IjoxNzkzODk1MjA3LCJqdGkiOiI5YzVjNDliZDkwOGU0YmU1YTZhYjljZmZiZTRiZWNlMCIsInVzZXJfaWQiOiI0In0.zrA6eGCgbeymgTwbQmEewuRONUD96IkksiJEjk-IXgI	2026-11-05 16:13:27.113276+00	2026-11-12 16:13:27+00	4	9c5c49bd908e4be5a6ab9cffbe4bece0
5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NDUwMDQ1MywiaWF0IjoxNzkzODk1NjUzLCJqdGkiOiJmYzE1YWMzNzE5OWI0NTdlODQzZmU1MzYxOWE4YmVmMSIsInVzZXJfaWQiOiIxIn0.nYK3-LKBkf3vy2TTK9AX87rIXgbtxHaRzrQ_AlXI8AI	2026-11-05 16:20:53.789005+00	2026-11-12 16:20:53+00	1	fc15ac37199b457e843fe53619a8bef1
6	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NDUwMDQ1MywiaWF0IjoxNzkzODk1NjUzLCJqdGkiOiI1NTgzZmU1NmY5Y2E0OWI5ODc2ZjVhOTViYzM3ZWU5MiIsInVzZXJfaWQiOiI0In0.OiTpPZGmRSdGK0R04iviOldVXT3y5U8p0MZOMPAbvEo	2026-11-05 16:20:53.822186+00	2026-11-12 16:20:53+00	4	5583fe56f9ca49b9876f5a95bc37ee92
7	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NDUwMDU3NywiaWF0IjoxNzkzODk1Nzc3LCJqdGkiOiJjMGZjOTBhZTczYTc0YTBkYjlmNDYxMjk0OTA2Y2ZmMyIsInVzZXJfaWQiOiIxIn0.xOvdQHsYT5VVz1F0EYtVAC-j8WtbjoWj9YX8_G-aXrs	2026-11-05 16:22:57.906023+00	2026-11-12 16:22:57+00	1	c0fc90ae73a74a0db9f461294906cff3
8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NDUwMDU3OCwiaWF0IjoxNzkzODk1Nzc4LCJqdGkiOiI5YzZhOWZkZDQxZTI0Y2UyOTdhNmUwN2FiNDRmNTgwMiIsInVzZXJfaWQiOiI0In0.vXZUfAX-jZ-Zd66MrHgZiEdyo-B_M0Oihlv755xrSl0	2026-11-05 16:22:58.24526+00	2026-11-12 16:22:58+00	4	9c6a9fdd41e24ce297a6e07ab44f5802
9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NDUwMDU4OCwiaWF0IjoxNzkzODk1Nzg4LCJqdGkiOiJjZDZmODExYjRkMjQ0YmVlODEyMTVhNTg1OGIzZTk0YyIsInVzZXJfaWQiOiIxIn0.B8UuD4K19k4FIqn6KBV1HEY1ionhdLgM2dL-FWknLI4	2026-11-05 16:23:08.692756+00	2026-11-12 16:23:08+00	1	cd6f811b4d244bee81215a5858b3e94c
10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NDUwMDU4OSwiaWF0IjoxNzkzODk1Nzg5LCJqdGkiOiI1Njk5ZDBjODdhZWE0YjVkOWU2OTYxNjRkN2Q4NDZjZiIsInVzZXJfaWQiOiI0In0.5YieVps0jRGtmZ2RT8rP9GvQitcvW9N0yY93piQDonA	2026-11-05 16:23:09.141738+00	2026-11-12 16:23:09+00	4	5699d0c87aea4b5d9e696164d7d846cf
11	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NDUwMDgzMSwiaWF0IjoxNzkzODk2MDMxLCJqdGkiOiI0MDJiYTRjYzBiNWY0OTE5YTRiNGZjMThjMWM5ZjJmYSIsInVzZXJfaWQiOiIxIn0.jmn6OCXf2a8Ep3FsHEfkGa99gYGD7XcdlvF4qPSaP-A	2026-11-05 16:27:11.203725+00	2026-11-12 16:27:11+00	1	402ba4cc0b5f4919a4b4fc18c1c9f2fa
12	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NDUwMDgzMSwiaWF0IjoxNzkzODk2MDMxLCJqdGkiOiIzNmU1ZWNmZjdhYzY0ZTJlYTIwMzFjMmY1ZGI0YTA0ZiIsInVzZXJfaWQiOiI0In0.HPQ3ja2N3wiwRWlmkXMQELNHZe1B0Wflaa0GHpX2BAA	2026-11-05 16:27:11.555199+00	2026-11-12 16:27:11+00	4	36e5ecff7ac64e2ea2031c2f5db4a04f
13	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NDUwMjY5MSwiaWF0IjoxNzkzODk3ODkxLCJqdGkiOiJhZWNiMDYzZmI2ZTM0NTlhYmRkYzRhMTBjNDQwYWEzYyIsInVzZXJfaWQiOiIxIn0.qO3cxWPYlt2R2QDjSyihn0FC29paStewuw9ZCdI_7M8	2026-11-05 16:58:11.233894+00	2026-11-12 16:58:11+00	1	aecb063fb6e3459abddc4a10c440aa3c
14	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NDUwMzYxNywiaWF0IjoxNzkzODk4ODE3LCJqdGkiOiIyY2M2ZTUxM2E2YTI0NjAyOWQzY2ZlMmNjMGFlYTc1OSIsInVzZXJfaWQiOiI1In0.6JChq2Uyi_pFjcoa0gRU1nla2ya-jIA6R8YSY0xeC7A	2026-11-05 17:13:37.311904+00	2026-11-12 17:13:37+00	5	2cc6e513a6a246029d3cfe2cc0aea759
15	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NDUwMzc3NiwiaWF0IjoxNzkzODk4OTc2LCJqdGkiOiI0MjEzYWRhZmVkYmE0NDU2YjQ4ZWIxNzQxMWU3YTdmYyIsInVzZXJfaWQiOiI1In0.n8ovI7guH7mnUJWUcPmaNfbB-XYJay65XuzVaktORBA	2026-11-05 17:16:16.881501+00	2026-11-12 17:16:16+00	5	4213adafedba4456b48eb17411e7a7fc
16	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NDUwNDkyMCwiaWF0IjoxNzkzOTAwMTIwLCJqdGkiOiJmYzc5NTk5ZDJhMjE0MWNjOGI3ZDBiOGM3NGJjNGU2OCIsInVzZXJfaWQiOiI1In0.ybtL7QrKK0Q5feEY_gCBqhpJpatiWue8KoK6UN4ujpM	2026-11-05 17:35:20.185307+00	2026-11-12 17:35:20+00	5	fc79599d2a2141cc8b7d0b8c74bc4e68
17	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NDUxMDgzOCwiaWF0IjoxNzkzOTA2MDM4LCJqdGkiOiJiNjYzMTZiOTdkNWQ0YjQwOTI4ODRiMjdkMjU0OWE0ZiIsInVzZXJfaWQiOiI1In0.HpFhL19iGN4pM4pmaQ4MrburzvsSkE-tzloTiFoWUSI	2026-11-05 19:13:58.236231+00	2026-11-12 19:13:58+00	5	b66316b97d5d4b4092884b27d2549a4f
18	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NDUxMzAyNSwiaWF0IjoxNzkzOTA4MjI1LCJqdGkiOiI3NTIwMTIyYjMwY2Q0MTAyYWMyZTYwZDYwN2E3N2E1MiIsInVzZXJfaWQiOiI2In0.Yx-SIIwDz4GmRyB9S8JPONDq08Ud-OypLkJ_aLEj7Fs	2026-11-05 19:50:25.686141+00	2026-11-12 19:50:25+00	6	7520122b30cd4102ac2e60d607a77a52
19	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NDUxMzA5NCwiaWF0IjoxNzkzOTA4Mjk0LCJqdGkiOiI2YmIzYmE1MDlmYzk0NDQwOGJjMWFhNDZjN2Y0OTA3NCIsInVzZXJfaWQiOiI3In0.8JA7sSd5ROTxAlAE-g5m26hoYtwaJgM1DpQwR9IMOSg	2026-11-05 19:51:34.990577+00	2026-11-12 19:51:34+00	7	6bb3ba509fc944408bc1aa46c7f49074
20	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NDUxMzExNywiaWF0IjoxNzkzOTA4MzE3LCJqdGkiOiI0MGZiNTk5NmI5MWU0ZWFlODE3NTEwMzFjZWI0OWYyZCIsInVzZXJfaWQiOiI4In0.F_q9u3uR78hUJPtOp32BltsnHaTEyDuj1xQ4GDNuJCI	2026-11-05 19:51:57.84481+00	2026-11-12 19:51:57+00	8	40fb5996b91e4eae81751031ceb49f2d
21	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NDUxMzE0OCwiaWF0IjoxNzkzOTA4MzQ4LCJqdGkiOiJmNTEwMTVjYjdiN2Q0NGMwODVkMzgyZjcxMTBiYTE1YiIsInVzZXJfaWQiOiI5In0.090qr-TnyEX239gZEEL22xpNUXljqzLQRg_yNxB5yxs	2026-11-05 19:52:28.625117+00	2026-11-12 19:52:28+00	9	f51015cb7b7d44c085d382f7110ba15b
22	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NDUxMzIwOCwiaWF0IjoxNzkzOTA4NDA4LCJqdGkiOiJkMWU0NDU3NzdlZWU0YzdlODFiZDdmYjdhOTJlOWQyMCIsInVzZXJfaWQiOiI2In0.r5hqRLvibMNsptREQzSj6OY2r1yuvmNs7_anSndwa9w	2026-11-05 19:53:28.033113+00	2026-11-12 19:53:28+00	6	d1e445777eee4c7e81bd7fb7a92e9d20
23	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NDkxODI4OSwiaWF0IjoxNzk0MzEzNDg5LCJqdGkiOiJiNWIxMWY4YzE0NTc0OTc4OTI3ZjliZGRkZjkzNDU2NyIsInVzZXJfaWQiOiI2In0.m8jxmwd0LN9DEs1iX2b0pNMS-AWhc0YTJzBXmXezYW8	2026-11-10 12:24:49.057735+00	2026-11-17 12:24:49+00	6	b5b11f8c14574978927f9bdddf934567
24	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NDkxODMyNywiaWF0IjoxNzk0MzEzNTI3LCJqdGkiOiI2NTJjOThiMTg4MzE0NDAwYjExNjNkMmY3ZGUwZThlZCIsInVzZXJfaWQiOiI2In0.yD9CKRKZc54D9wCrZUeFuBvNfINQYTKt34YVb3KrXgU	2026-11-10 12:25:27.876177+00	2026-11-17 12:25:27+00	6	652c98b188314400b1163d2f7de0e8ed
25	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NDkyNDExMCwiaWF0IjoxNzk0MzE5MzEwLCJqdGkiOiJlNmEwNWVmMGFhY2I0OWVmYTAzYjQxZjg5ODBkZWU3MiIsInVzZXJfaWQiOiI2In0.drVolo6BDVQbvye4mBBsgyUGHO95fSGQJ-ERXxn95FM	2026-11-10 14:01:50.997647+00	2026-11-17 14:01:50+00	6	e6a05ef0aacb49efa03b41f8980dee72
26	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NDkzNzE2NiwiaWF0IjoxNzk0MzMyMzY2LCJqdGkiOiI4NmNjY2Q1NzYyYzI0NmVkOWJiODU1NzU2YmIxYzcwMiIsInVzZXJfaWQiOiI2In0.MkDuTE4mhS2LClDjmfhVRBd_zXgX2SFmvKKVW4e7Lw4	2026-11-10 17:39:26.744936+00	2026-11-17 17:39:26+00	6	86cccd5762c246ed9bb855756bb1c702
27	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NDkzNzk0OCwiaWF0IjoxNzk0MzMzMTQ4LCJqdGkiOiI0MjNlYjk5MWNmMGY0MmJkOTA0YmI1YTg4OTYwODNlMSIsInVzZXJfaWQiOiI4In0.2VjLdIX60uhugfr6xEi-XEWZUvR0T-39jGmOj98KKK8	2026-11-10 17:52:28.217638+00	2026-11-17 17:52:28+00	8	423eb991cf0f42bd904bb5a8896083e1
28	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NDkzODAxOSwiaWF0IjoxNzk0MzMzMjE5LCJqdGkiOiJiOTA4MjE0ZTUzMWY0MGY5YmFhMWM5ODEwNDgwYmM5NCIsInVzZXJfaWQiOiI3In0.dfHQRzYtTaZUEej87ctAlsYXNq2hTQGY5bu1vTPbgOw	2026-11-10 17:53:39.382347+00	2026-11-17 17:53:39+00	7	b908214e531f40f9baa1c9810480bc94
29	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NDkzODA1NCwiaWF0IjoxNzk0MzMzMjU0LCJqdGkiOiI2MmYwZTU4NTg3NjE0OTE2ODIxZjFkNzNhMGE4MDI5NSIsInVzZXJfaWQiOiI5In0.HdRhY5szL8Rmy8RNXVMJ0aevvSFTLf1GQyVuN4Vuleo	2026-11-10 17:54:14.668816+00	2026-11-17 17:54:14+00	9	62f0e58587614916821f1d73a0a80295
30	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NDkzODIyOSwiaWF0IjoxNzk0MzMzNDI5LCJqdGkiOiIyODE1ZWEzYmZhMzk0YzAyOTQxMDM2MGExMGU3MDBkNCIsInVzZXJfaWQiOiI2In0.z-FMQt85GIU-v3kzK7sCra1o5IZuqasNrPt8U919pog	2026-11-10 17:57:09.449883+00	2026-11-17 17:57:09+00	6	2815ea3bfa394c029410360a10e700d4
31	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NDkzODU1MiwiaWF0IjoxNzk0MzMzNzUyLCJqdGkiOiJjNzdlNDMzMjkxNmY0ZDM4OWEyMzIxNWUwZWQ2Y2E3NiIsInVzZXJfaWQiOiI2In0.7l07jIDnprAhGFtD6EKcwq0xCKfyIMHcoMJqbn_W0NM	2026-11-10 18:02:32.043259+00	2026-11-17 18:02:32+00	6	c77e4332916f4d389a23215e0ed6ca76
32	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NTEzMzk2MCwiaWF0IjoxNzk0NTI5MTYwLCJqdGkiOiJmZTAyNWY4ZmU4ZGY0ZjgzYmQ5MTc1MzhhNThlZGFiNSIsInVzZXJfaWQiOiI2In0.WVLa1hM2wkLteIZeTpQmmbhj9jv1yy7E2yR8DJ_LueE	2026-11-13 00:19:20.419864+00	2026-11-20 00:19:20+00	6	fe025f8fe8df4f83bd917538a58edab5
33	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NTEzNDQ3OCwiaWF0IjoxNzk0NTI5Njc4LCJqdGkiOiIzMDA3ZmVmY2E4ZDY0NGNjYmEwOTg2ZWZiYzlkNGFkMyIsInVzZXJfaWQiOiI3In0.3qcmZuAmpFF_tpoPa3V00XZVyszgZl3UJo_IknyLp1I	2026-11-13 00:27:58.706188+00	2026-11-20 00:27:58+00	7	3007fefca8d644ccba0986efbc9d4ad3
34	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NTEzNDUzMiwiaWF0IjoxNzk0NTI5NzMyLCJqdGkiOiJmN2MzNWFiM2E2MWQ0ZDAxODk5ZjA4ZjlkZTAwNDcwMiIsInVzZXJfaWQiOiI4In0.EzlTuSmD7CN_wenJ1xUHBWSZSV3CUeDOV7zu3nQUObc	2026-11-13 00:28:52.234149+00	2026-11-20 00:28:52+00	8	f7c35ab3a61d4d01899f08f9de004702
35	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NTEzNDcxNCwiaWF0IjoxNzk0NTI5OTE0LCJqdGkiOiJjN2UxYjQxZmQ4MjY0NWVhOThlYzEyNDMwMDNiYTE2YiIsInVzZXJfaWQiOiI5In0.K48LHr7fquj-_lmoWb-SJ3VRlzDhCx7OhzAKX6naMbo	2026-11-13 00:31:54.733088+00	2026-11-20 00:31:54+00	9	c7e1b41fd82645ea98ec1243003ba16b
36	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NTEzNDkyOCwiaWF0IjoxNzk0NTMwMTI4LCJqdGkiOiI4YjY3MWUxZTE3NDQ0OGU1Yjg5MzcwNThhZmZhNDAzOSIsInVzZXJfaWQiOiI5In0.ue84ZPG4AhfjSBjKX7bLmXl6x0J73YifaDAQbeyxfW8	2026-11-13 00:35:28.481306+00	2026-11-20 00:35:28+00	9	8b671e1e174448e5b8937058affa4039
37	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NTEzNTk4OSwiaWF0IjoxNzk0NTMxMTg5LCJqdGkiOiJkOWFlNjRlMzQxMzA0NTMzODk4YThiNTg5ZjI3YWUwMSIsInVzZXJfaWQiOiI5In0.sPJtRqu7RtlO9p6C3DecVQHMcC6WvSWBUbWQqJL6a3g	2026-11-13 00:53:09.716377+00	2026-11-20 00:53:09+00	9	d9ae64e341304533898a8b589f27ae01
38	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NTEzODE2OCwiaWF0IjoxNzk0NTMzMzY4LCJqdGkiOiI1MDY0YWIyNzQ3NGU0NDcwOGE0M2M2Mzk5NmEyNjYxMyIsInVzZXJfaWQiOiI5In0.FOW4QDENdnkevSPA9rTZqdptEAM2To9cpL2ExtnHfEE	2026-11-13 01:29:28.838047+00	2026-11-20 01:29:28+00	9	5064ab27474e44708a43c63996a26613
39	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NTE0MTI0NiwiaWF0IjoxNzk0NTM2NDQ2LCJqdGkiOiIxMTNiNGIzMDQ0MzI0OTU4ODk2ZWI5M2EyNGZmOTZmNSIsInVzZXJfaWQiOiI5In0.HYKjB4U2hI8-juR1LH_UVWR_ehaO8Dp-nH_EAKpEx5E	2026-11-13 02:20:46.89767+00	2026-11-20 02:20:46+00	9	113b4b3044324958896eb93a24ff96f5
40	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NTE0MTM3MCwiaWF0IjoxNzk0NTM2NTcwLCJqdGkiOiI2MGM1NGQ1MTVjNmM0YmI1YmFiN2M5ZmQxOWYxZjcwZCIsInVzZXJfaWQiOiI3In0.dOV4dX6uhBu9UC0DzFSM222ocgsaadmosmknmURPXcE	2026-11-13 02:22:50.882229+00	2026-11-20 02:22:50+00	7	60c54d515c6c4bb5bab7c9fd19f1f70d
41	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NTE0MTQzNCwiaWF0IjoxNzk0NTM2NjM0LCJqdGkiOiJmZTAzZDZmMTdlZDg0MzFiYTJkMjZjOTk0MTY4ODY1OSIsInVzZXJfaWQiOiI2In0.kJs4OsWTVzvwZXMbsA0GwNhKrGOi8zqEyq68atL9Kks	2026-11-13 02:23:54.432175+00	2026-11-20 02:23:54+00	6	fe03d6f17ed8431ba2d26c9941688659
42	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NTE0MTU1MCwiaWF0IjoxNzk0NTM2NzUwLCJqdGkiOiJlNDY2OGFkYjA5ZmU0MjY1OTA1ODZiMThkNmUxNTY1ZiIsInVzZXJfaWQiOiI5In0.p0xn9oaCeLekR3EeaTIFsoo7w93vbKNKywuuHq4YpOs	2026-11-13 02:25:50.967843+00	2026-11-20 02:25:50+00	9	e4668adb09fe426590586b18d6e1565f
43	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NTE0Mjg0NSwiaWF0IjoxNzk0NTM4MDQ1LCJqdGkiOiJmZWI4ZTk2MjExYzI0ZWEzYmMwYjgzZWQzZGNkNGIwNCIsInVzZXJfaWQiOiI2In0.QoIva-QAfA0NP0IWuaQavZ8t8Zx29KCfjjtHLSItdjs	2026-11-13 02:47:25.118224+00	2026-11-20 02:47:25+00	6	feb8e96211c24ea3bc0b83ed3dcd4b04
44	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NTE0Mjk3OSwiaWF0IjoxNzk0NTM4MTc5LCJqdGkiOiJlNWIyZGYxYjM0NmI0NGI2OTBlNmExMWFhNDBjMDUwMiIsInVzZXJfaWQiOiI5In0.au0D-xOOvcGfFwCc5SPdZODmhEaIqrZmi5CiIQXk_Ek	2026-11-13 02:49:39.5356+00	2026-11-20 02:49:39+00	9	e5b2df1b346b44b690e6a11aa40c0502
45	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NTE0Mzk3NSwiaWF0IjoxNzk0NTM5MTc1LCJqdGkiOiJkNDAwNjU4MWMyMDc0MGU2OWI0ZDZmMzZjYTA4ZDQ1ZCIsInVzZXJfaWQiOiI5In0.PVIfuAS_UHF5HBSboPmRW_gsxJgWPOKxD-vIys7Utuw	2026-11-13 03:06:15.173812+00	2026-11-20 03:06:15+00	9	d4006581c20740e69b4d6f36ca08d45d
46	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NTE0NDI5OSwiaWF0IjoxNzk0NTM5NDk5LCJqdGkiOiIxMzY3ZDM2OTk4MzU0MTg0YTI4ZDI2ZjliODIxYzg5OSIsInVzZXJfaWQiOiI3In0.nZ9QL9NOoLXmcgWNeBqRNS62NxMo3UOohVoNPhcXZ40	2026-11-13 03:11:39.726573+00	2026-11-20 03:11:39+00	7	1367d36998354184a28d26f9b821c899
47	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NTIxNzYwMCwiaWF0IjoxNzk0NjEyODAwLCJqdGkiOiJhNzA2Y2RjOThhZDA0OTAwYjEyZjNiMjI4NmYxMzY5NCIsInVzZXJfaWQiOiI3In0.fbU64eFsucj6OCdPOfB2QLIYfCNqFKJDRn7X3QSTDQY	2026-11-13 23:33:20.804045+00	2026-11-20 23:33:20+00	7	a706cdc98ad04900b12f3b2286f13694
48	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NTMwMzc3NiwiaWF0IjoxNzk0Njk4OTc2LCJqdGkiOiJkN2Y4MWIyZGUwZTM0ZGM3OTkzZDJjYzc4NDZiMmQ2MyIsInVzZXJfaWQiOiI2In0.yQfnUYL60Swx1OvSx0XUvCUOcpav54_AH5xdMsOa7E4	2026-11-14 23:29:36.226836+00	2026-11-21 23:29:36+00	6	d7f81b2de0e34dc7993d2cc7846b2d63
49	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NTMwOTkxMCwiaWF0IjoxNzk0NzA1MTEwLCJqdGkiOiIxMDZmNjdkZGQ4ZmQ0ZTM4OTYzZTFkM2NjMzkyMDg4NSIsInVzZXJfaWQiOiI2In0.A9W0-bAjxwwyXFXUkHKO-SG3SXjqgkfEVbdRicbvJlM	2026-11-15 01:11:50.427226+00	2026-11-22 01:11:50+00	6	106f67ddd8fd4e38963e1d3cc3920885
50	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NTM5MTA4MywiaWF0IjoxNzk0Nzg2MjgzLCJqdGkiOiIwODg5OWI2NmMwZWM0NzVkOTE3ZWVkZTFlYWMxODYyNSIsInVzZXJfaWQiOiI4In0.6pTrhYckd-FUMad2J-7DZRAy-UTvm1i64tlHpl4dN6c	2026-11-15 23:44:43.245779+00	2026-11-22 23:44:43+00	8	08899b66c0ec475d917eede1eac18625
51	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NjEzNzk5MywiaWF0IjoxNzk1NTMzMTkzLCJqdGkiOiIyZWFhZTVkNDIxODQ0Mjc5YTAzMjJlZTg5MGNiZmFhNyIsInVzZXJfaWQiOiI2In0.pjAUaYC7c1KLzDtz5hhaqNflK7FWvbYzV_KETc6chME	2026-11-24 15:13:13.569244+00	2026-12-01 15:13:13+00	6	2eaae5d421844279a0322ee890cbfaa7
52	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NjE0NTYzMywiaWF0IjoxNzk1NTQwODMzLCJqdGkiOiJiMDFhNzEyMzMxNTI0MzkzODk5NTU1NTZmMzBjMWI3OSIsInVzZXJfaWQiOiI2In0.68XlnRVu98-FwD7vFguSqqC95VW5Y7c0VlWCPXoaRxM	2026-11-24 17:20:33.256313+00	2026-12-01 17:20:33+00	6	b01a71233152439389955556f30c1b79
53	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NjE0NTY3NiwiaWF0IjoxNzk1NTQwODc2LCJqdGkiOiJhMTQ1ZTkwMzJjNWM0YTViYWZhNDFmYjU4N2VlMGNlZCIsInVzZXJfaWQiOiI3In0.9k2wgK1-jqU94qcWZJJN9eZwLAOZIN05VLTXT9uLU_4	2026-11-24 17:21:16.164936+00	2026-12-01 17:21:16+00	7	a145e9032c5c4a5bafa41fb587ee0ced
54	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NjE0NjE2NSwiaWF0IjoxNzk1NTQxMzY1LCJqdGkiOiIxYzZlOTJmYTgxYmY0NTg4OTMwYjJiZmZiNjExNDk0ZSIsInVzZXJfaWQiOiI5In0.CBBLOk0YVEMFER5cPlCM4jJbA9rYXCF8Lwj9N7Un6d4	2026-11-24 17:29:25.977607+00	2026-12-01 17:29:25+00	9	1c6e92fa81bf4588930b2bffb611494e
55	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NjE0NzUxOSwiaWF0IjoxNzk1NTQyNzE5LCJqdGkiOiI0YTUzYzQxYmUxMWE0YzFiODE1YjQ3NjE5NWZiNzA1ZSIsInVzZXJfaWQiOiI5In0.oB2FV934VZ-wBbYsYYy5gn_TRPpMZQ0FPt1y6skEcRY	2026-11-24 17:51:59.794241+00	2026-12-01 17:51:59+00	9	4a53c41be11a4c1b815b476195fb705e
56	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NjE0Nzk0NiwiaWF0IjoxNzk1NTQzMTQ2LCJqdGkiOiI2YWVjNjlkYTkyMDA0ZGQ5ODU0Y2JmMzJiYzU2MmUxOCIsInVzZXJfaWQiOiI2In0.zXOo4xDY0_1NMdtxu3SI9_VLjuKtbZVgCur9wzyTZvk	2026-11-24 17:59:06.751701+00	2026-12-01 17:59:06+00	6	6aec69da92004dd9854cbf32bc562e18
57	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NjE0ODIyMiwiaWF0IjoxNzk1NTQzNDIyLCJqdGkiOiJlZjUyYTQzMTRlZTQ0ODg1YTU1NGY0NWMxNWJlODdmZCIsInVzZXJfaWQiOiI4In0.WztNs0qA-FbwYNBwsYAFr3-uK0GJgFxfXlZoUvmRzXw	2026-11-24 18:03:42.239217+00	2026-12-01 18:03:42+00	8	ef52a4314ee44885a554f45c15be87fd
58	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NjE0ODI4MSwiaWF0IjoxNzk1NTQzNDgxLCJqdGkiOiJjZjA3YThiMGJjNzc0NmI2OWE1N2FiZDNkMTc4N2MyNiIsInVzZXJfaWQiOiI2In0.-53Co-xyXAVgR91i0ixInBKNTWnmoDk9xzFCvfo4TBU	2026-11-24 18:04:41.544232+00	2026-12-01 18:04:41+00	6	cf07a8b0bc7746b69a57abd3d1787c26
59	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NjE0ODcyOCwiaWF0IjoxNzk1NTQzOTI4LCJqdGkiOiJiMTc4NjZkYTQ2NjA0ZDZkOWM1NDQ2MjMyZTA4MGMwNyIsInVzZXJfaWQiOiI5In0.t-R36V96PCI6aaY8vr651aYivSjM8_NZohwTbuAmqSQ	2026-11-24 18:12:08.400611+00	2026-12-01 18:12:08+00	9	b17866da46604d6d9c5446232e080c07
60	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NjE0ODg4MSwiaWF0IjoxNzk1NTQ0MDgxLCJqdGkiOiIwZjU2NWVmMTc0ZDk0MzhhYjFkYjcwYTIwMTFmODJiNiIsInVzZXJfaWQiOiI2In0.ZArGerD-lrpIAMBteyzfiZybBbBeynML1McdtX1Ypko	2026-11-24 18:14:41.475309+00	2026-12-01 18:14:41+00	6	0f565ef174d9438ab1db70a2011f82b6
61	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5NjE0ODkyNiwiaWF0IjoxNzk1NTQ0MTI2LCJqdGkiOiIwNjY4NWRlN2RhNTg0ZGQ5YWZmNzEyMWY3MTQ1YjNlOCIsInVzZXJfaWQiOiI4In0.2ZICDzM-Lf6pqD_tz3TZ60GrxsAO--tLskga4VSnNqs	2026-11-24 18:15:26.05304+00	2026-12-01 18:15:26+00	8	06685de7da584dd9aff7121f7145b3e8
\.


--
-- Data for Name: usuario; Type: TABLE DATA; Schema: public; Owner: amaru_admin
--

COPY public.usuario (rut_usuario, nombres, apellidos, correo_electronico, contrasena_hash, creado_el) FROM stdin;
12345678-9	Operador	Minero	operador@minera.cl	hash_demo	2026-11-02 19:22:32.038502+00
2222222-2	Trabajador	Dos	dos@minera.cl	demo	2026-11-02 19:29:19.534908+00
99999991-K	Trabajador Demo 1	Automático	demo1@amaru.cl	sin_acceso_web	2026-11-03 19:59:42.562971+00
99999992-K	Trabajador Demo 2	Automático	demo2@amaru.cl	sin_acceso_web	2026-11-03 19:59:42.579875+00
99999993-K	Trabajador Demo 3	Automático	demo3@amaru.cl	sin_acceso_web	2026-11-03 19:59:42.592887+00
99999994-K	Trabajador Demo 4	Automático	demo4@amaru.cl	sin_acceso_web	2026-11-03 19:59:42.608176+00
99999995-K	Trabajador Demo 5	Automático	demo5@amaru.cl	sin_acceso_web	2026-11-03 19:59:42.613443+00
99999996-K	Trabajador Demo 6	Automático	demo6@amaru.cl	sin_acceso_web	2026-11-03 19:59:42.620743+00
99999997-K	Trabajador Demo 7	Automático	demo7@amaru.cl	sin_acceso_web	2026-11-03 19:59:42.626696+00
99999998-K	Trabajador Demo 8	Automático	demo8@amaru.cl	sin_acceso_web	2026-11-03 19:59:42.631522+00
99999999-K	Trabajador Demo 9	Automático	demo9@amaru.cl	sin_acceso_web	2026-11-03 19:59:42.64134+00
999999910-K	Trabajador Demo 10	Automático	demo10@amaru.cl	sin_acceso_web	2026-11-03 19:59:42.647055+00
24533343-9	Trabajador	Optisalud	test@optisalud.cl	demo123	2026-11-10 14:22:17.982089+00
15890123-4	Carlos	Mendoza	admin@opticaamaru.cl	sha256$placeholder	2026-11-12 23:19:26.438522+00
17456789-2	Juanita	Araya	operador1@opticaamaru.cl	sha256$placeholder	2026-11-12 23:19:26.852201+00
16345678-K	Rodrigo	Sanhueza	auditor@opticaamaru.cl	sha256$placeholder	2026-11-12 23:19:27.122952+00
\.


--
-- Name: auth_group_id_seq; Type: SEQUENCE SET; Schema: public; Owner: amaru_admin
--

SELECT pg_catalog.setval('public.auth_group_id_seq', 3, true);


--
-- Name: auth_group_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: amaru_admin
--

SELECT pg_catalog.setval('public.auth_group_permissions_id_seq', 12, true);


--
-- Name: auth_permission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: amaru_admin
--

SELECT pg_catalog.setval('public.auth_permission_id_seq', 102, true);


--
-- Name: auth_user_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: amaru_admin
--

SELECT pg_catalog.setval('public.auth_user_groups_id_seq', 13, true);


--
-- Name: auth_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: amaru_admin
--

SELECT pg_catalog.setval('public.auth_user_id_seq', 9, true);


--
-- Name: auth_user_user_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: amaru_admin
--

SELECT pg_catalog.setval('public.auth_user_user_permissions_id_seq', 1, false);


--
-- Name: django_admin_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: amaru_admin
--

SELECT pg_catalog.setval('public.django_admin_log_id_seq', 4, true);


--
-- Name: django_content_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: amaru_admin
--

SELECT pg_catalog.setval('public.django_content_type_id_seq', 25, true);


--
-- Name: django_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: amaru_admin
--

SELECT pg_catalog.setval('public.django_migrations_id_seq', 38, true);


--
-- Name: empresa_convenio_id_empresa_seq; Type: SEQUENCE SET; Schema: public; Owner: amaru_admin
--

SELECT pg_catalog.setval('public.empresa_convenio_id_empresa_seq', 1, false);


--
-- Name: nomina_trabajador_id_seq; Type: SEQUENCE SET; Schema: public; Owner: amaru_admin
--

SELECT pg_catalog.setval('public.nomina_trabajador_id_seq', 1, true);


--
-- Name: registro_auditoria_id_evento_seq; Type: SEQUENCE SET; Schema: public; Owner: amaru_admin
--

SELECT pg_catalog.setval('public.registro_auditoria_id_evento_seq', 5, true);


--
-- Name: token_blacklist_blacklistedtoken_id_seq; Type: SEQUENCE SET; Schema: public; Owner: amaru_admin
--

SELECT pg_catalog.setval('public.token_blacklist_blacklistedtoken_id_seq', 1, false);


--
-- Name: token_blacklist_outstandingtoken_id_seq; Type: SEQUENCE SET; Schema: public; Owner: amaru_admin
--

SELECT pg_catalog.setval('public.token_blacklist_outstandingtoken_id_seq', 61, true);


--
-- Name: armazon_inventario armazon_inventario_pkey; Type: CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.armazon_inventario
    ADD CONSTRAINT armazon_inventario_pkey PRIMARY KEY (sku_armazon);


--
-- Name: auth_group auth_group_name_key; Type: CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.auth_group
    ADD CONSTRAINT auth_group_name_key UNIQUE (name);


--
-- Name: auth_group_permissions auth_group_permissions_group_id_permission_id_0cd325b0_uniq; Type: CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_group_id_permission_id_0cd325b0_uniq UNIQUE (group_id, permission_id);


--
-- Name: auth_group_permissions auth_group_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_pkey PRIMARY KEY (id);


--
-- Name: auth_group auth_group_pkey; Type: CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.auth_group
    ADD CONSTRAINT auth_group_pkey PRIMARY KEY (id);


--
-- Name: auth_permission auth_permission_content_type_id_codename_01ab375a_uniq; Type: CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_content_type_id_codename_01ab375a_uniq UNIQUE (content_type_id, codename);


--
-- Name: auth_permission auth_permission_pkey; Type: CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_pkey PRIMARY KEY (id);


--
-- Name: auth_user_groups auth_user_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.auth_user_groups
    ADD CONSTRAINT auth_user_groups_pkey PRIMARY KEY (id);


--
-- Name: auth_user_groups auth_user_groups_user_id_group_id_94350c0c_uniq; Type: CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.auth_user_groups
    ADD CONSTRAINT auth_user_groups_user_id_group_id_94350c0c_uniq UNIQUE (user_id, group_id);


--
-- Name: auth_user auth_user_pkey; Type: CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.auth_user
    ADD CONSTRAINT auth_user_pkey PRIMARY KEY (id);


--
-- Name: auth_user_user_permissions auth_user_user_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permissions_pkey PRIMARY KEY (id);


--
-- Name: auth_user_user_permissions auth_user_user_permissions_user_id_permission_id_14a6b632_uniq; Type: CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permissions_user_id_permission_id_14a6b632_uniq UNIQUE (user_id, permission_id);


--
-- Name: auth_user auth_user_username_key; Type: CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.auth_user
    ADD CONSTRAINT auth_user_username_key UNIQUE (username);


--
-- Name: cuota_descuento cuota_descuento_pkey; Type: CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.cuota_descuento
    ADD CONSTRAINT cuota_descuento_pkey PRIMARY KEY (id_cuota);


--
-- Name: django_admin_log django_admin_log_pkey; Type: CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_pkey PRIMARY KEY (id);


--
-- Name: django_content_type django_content_type_app_label_model_76bd3d3b_uniq; Type: CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.django_content_type
    ADD CONSTRAINT django_content_type_app_label_model_76bd3d3b_uniq UNIQUE (app_label, model);


--
-- Name: django_content_type django_content_type_pkey; Type: CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.django_content_type
    ADD CONSTRAINT django_content_type_pkey PRIMARY KEY (id);


--
-- Name: django_migrations django_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.django_migrations
    ADD CONSTRAINT django_migrations_pkey PRIMARY KEY (id);


--
-- Name: django_session django_session_pkey; Type: CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.django_session
    ADD CONSTRAINT django_session_pkey PRIMARY KEY (session_key);


--
-- Name: documento_respaldo documento_respaldo_folio_unico_qr_key; Type: CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.documento_respaldo
    ADD CONSTRAINT documento_respaldo_folio_unico_qr_key UNIQUE (folio_unico_qr);


--
-- Name: documento_respaldo documento_respaldo_pkey; Type: CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.documento_respaldo
    ADD CONSTRAINT documento_respaldo_pkey PRIMARY KEY (id_documento);


--
-- Name: empresa_convenio empresa_convenio_pkey; Type: CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.empresa_convenio
    ADD CONSTRAINT empresa_convenio_pkey PRIMARY KEY (id_empresa);


--
-- Name: empresa_convenio empresa_convenio_rut_empresa_key; Type: CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.empresa_convenio
    ADD CONSTRAINT empresa_convenio_rut_empresa_key UNIQUE (rut_empresa);


--
-- Name: lote_nomina_sindicato lote_nomina_sindicato_pkey; Type: CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.lote_nomina_sindicato
    ADD CONSTRAINT lote_nomina_sindicato_pkey PRIMARY KEY (id_lote);


--
-- Name: movimiento_stock movimiento_stock_pkey; Type: CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.movimiento_stock
    ADD CONSTRAINT movimiento_stock_pkey PRIMARY KEY (id_movimiento);


--
-- Name: nomina_trabajador nomina_trabajador_pkey; Type: CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.nomina_trabajador
    ADD CONSTRAINT nomina_trabajador_pkey PRIMARY KEY (id);


--
-- Name: nomina_trabajador nomina_trabajador_rut_key; Type: CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.nomina_trabajador
    ADD CONSTRAINT nomina_trabajador_rut_key UNIQUE (rut);


--
-- Name: paciente paciente_pkey; Type: CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.paciente
    ADD CONSTRAINT paciente_pkey PRIMARY KEY (rut_usuario);


--
-- Name: personal_optica personal_optica_pkey; Type: CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.personal_optica
    ADD CONSTRAINT personal_optica_pkey PRIMARY KEY (rut_usuario);


--
-- Name: presupuesto presupuesto_folio_unico_qr_key; Type: CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.presupuesto
    ADD CONSTRAINT presupuesto_folio_unico_qr_key UNIQUE (folio_unico_qr);


--
-- Name: presupuesto presupuesto_pkey; Type: CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.presupuesto
    ADD CONSTRAINT presupuesto_pkey PRIMARY KEY (id_presupuesto);


--
-- Name: recepcion_despacho recepcion_despacho_folio_unico_qr_key; Type: CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.recepcion_despacho
    ADD CONSTRAINT recepcion_despacho_folio_unico_qr_key UNIQUE (folio_unico_qr);


--
-- Name: recepcion_despacho recepcion_despacho_pkey; Type: CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.recepcion_despacho
    ADD CONSTRAINT recepcion_despacho_pkey PRIMARY KEY (id_recepcion);


--
-- Name: receta_optica receta_optica_pkey; Type: CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.receta_optica
    ADD CONSTRAINT receta_optica_pkey PRIMARY KEY (id_receta);


--
-- Name: registro_auditoria registro_auditoria_pkey; Type: CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.registro_auditoria
    ADD CONSTRAINT registro_auditoria_pkey PRIMARY KEY (id_evento);


--
-- Name: reserva_hora reserva_hora_pkey; Type: CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.reserva_hora
    ADD CONSTRAINT reserva_hora_pkey PRIMARY KEY (id_reserva);


--
-- Name: solicitud_entrega solicitud_entrega_pkey; Type: CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.solicitud_entrega
    ADD CONSTRAINT solicitud_entrega_pkey PRIMARY KEY (folio_unico_qr);


--
-- Name: titular_pago titular_pago_pkey; Type: CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.titular_pago
    ADD CONSTRAINT titular_pago_pkey PRIMARY KEY (rut_titular);


--
-- Name: token_blacklist_blacklistedtoken token_blacklist_blacklistedtoken_pkey; Type: CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.token_blacklist_blacklistedtoken
    ADD CONSTRAINT token_blacklist_blacklistedtoken_pkey PRIMARY KEY (id);


--
-- Name: token_blacklist_blacklistedtoken token_blacklist_blacklistedtoken_token_id_key; Type: CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.token_blacklist_blacklistedtoken
    ADD CONSTRAINT token_blacklist_blacklistedtoken_token_id_key UNIQUE (token_id);


--
-- Name: token_blacklist_outstandingtoken token_blacklist_outstandingtoken_jti_hex_d9bdf6f7_uniq; Type: CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.token_blacklist_outstandingtoken
    ADD CONSTRAINT token_blacklist_outstandingtoken_jti_hex_d9bdf6f7_uniq UNIQUE (jti);


--
-- Name: token_blacklist_outstandingtoken token_blacklist_outstandingtoken_pkey; Type: CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.token_blacklist_outstandingtoken
    ADD CONSTRAINT token_blacklist_outstandingtoken_pkey PRIMARY KEY (id);


--
-- Name: cuota_descuento uq_presupuesto_cuota; Type: CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.cuota_descuento
    ADD CONSTRAINT uq_presupuesto_cuota UNIQUE (id_presupuesto, numero_cuota);


--
-- Name: usuario usuario_correo_electronico_key; Type: CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_correo_electronico_key UNIQUE (correo_electronico);


--
-- Name: usuario usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_pkey PRIMARY KEY (rut_usuario);


--
-- Name: armazon_inventario_sku_armazon_71661e83_like; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX armazon_inventario_sku_armazon_71661e83_like ON public.armazon_inventario USING btree (sku_armazon varchar_pattern_ops);


--
-- Name: auth_group_name_a6ea08ec_like; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX auth_group_name_a6ea08ec_like ON public.auth_group USING btree (name varchar_pattern_ops);


--
-- Name: auth_group_permissions_group_id_b120cbf9; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX auth_group_permissions_group_id_b120cbf9 ON public.auth_group_permissions USING btree (group_id);


--
-- Name: auth_group_permissions_permission_id_84c5c92e; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX auth_group_permissions_permission_id_84c5c92e ON public.auth_group_permissions USING btree (permission_id);


--
-- Name: auth_permission_content_type_id_2f476e4b; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX auth_permission_content_type_id_2f476e4b ON public.auth_permission USING btree (content_type_id);


--
-- Name: auth_user_groups_group_id_97559544; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX auth_user_groups_group_id_97559544 ON public.auth_user_groups USING btree (group_id);


--
-- Name: auth_user_groups_user_id_6a12ed8b; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX auth_user_groups_user_id_6a12ed8b ON public.auth_user_groups USING btree (user_id);


--
-- Name: auth_user_user_permissions_permission_id_1fbb5f2c; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX auth_user_user_permissions_permission_id_1fbb5f2c ON public.auth_user_user_permissions USING btree (permission_id);


--
-- Name: auth_user_user_permissions_user_id_a95ead1b; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX auth_user_user_permissions_user_id_a95ead1b ON public.auth_user_user_permissions USING btree (user_id);


--
-- Name: auth_user_username_6821ab7c_like; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX auth_user_username_6821ab7c_like ON public.auth_user USING btree (username varchar_pattern_ops);


--
-- Name: cuota_descuento_id_presupuesto_1b361338; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX cuota_descuento_id_presupuesto_1b361338 ON public.cuota_descuento USING btree (id_presupuesto);


--
-- Name: django_admin_log_content_type_id_c4bce8eb; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX django_admin_log_content_type_id_c4bce8eb ON public.django_admin_log USING btree (content_type_id);


--
-- Name: django_admin_log_user_id_c564eba6; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX django_admin_log_user_id_c564eba6 ON public.django_admin_log USING btree (user_id);


--
-- Name: django_session_expire_date_a5c62663; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX django_session_expire_date_a5c62663 ON public.django_session USING btree (expire_date);


--
-- Name: django_session_session_key_c0390e0f_like; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX django_session_session_key_c0390e0f_like ON public.django_session USING btree (session_key varchar_pattern_ops);


--
-- Name: documento_respaldo_folio_unico_qr_046509c7_like; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX documento_respaldo_folio_unico_qr_046509c7_like ON public.documento_respaldo USING btree (folio_unico_qr varchar_pattern_ops);


--
-- Name: empresa_convenio_rut_empresa_0572b84c_like; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX empresa_convenio_rut_empresa_0572b84c_like ON public.empresa_convenio USING btree (rut_empresa varchar_pattern_ops);


--
-- Name: lote_nomina_sindicato_id_empresa_45bd0538; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX lote_nomina_sindicato_id_empresa_45bd0538 ON public.lote_nomina_sindicato USING btree (id_empresa);


--
-- Name: lote_nomina_sindicato_rut_responsable_carga_cdbb2c8b; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX lote_nomina_sindicato_rut_responsable_carga_cdbb2c8b ON public.lote_nomina_sindicato USING btree (rut_responsable_carga);


--
-- Name: lote_nomina_sindicato_rut_responsable_carga_cdbb2c8b_like; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX lote_nomina_sindicato_rut_responsable_carga_cdbb2c8b_like ON public.lote_nomina_sindicato USING btree (rut_responsable_carga varchar_pattern_ops);


--
-- Name: movimiento_stock_folio_unico_qr_df3903f2; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX movimiento_stock_folio_unico_qr_df3903f2 ON public.movimiento_stock USING btree (folio_unico_qr);


--
-- Name: movimiento_stock_folio_unico_qr_df3903f2_like; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX movimiento_stock_folio_unico_qr_df3903f2_like ON public.movimiento_stock USING btree (folio_unico_qr varchar_pattern_ops);


--
-- Name: movimiento_stock_sku_armazon_35f53102; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX movimiento_stock_sku_armazon_35f53102 ON public.movimiento_stock USING btree (sku_armazon);


--
-- Name: movimiento_stock_sku_armazon_35f53102_like; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX movimiento_stock_sku_armazon_35f53102_like ON public.movimiento_stock USING btree (sku_armazon varchar_pattern_ops);


--
-- Name: nomina_trabajador_rut_f6e9830a_like; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX nomina_trabajador_rut_f6e9830a_like ON public.nomina_trabajador USING btree (rut varchar_pattern_ops);


--
-- Name: paciente_id_empresa_65e67cd5; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX paciente_id_empresa_65e67cd5 ON public.paciente USING btree (id_empresa);


--
-- Name: paciente_rut_usuario_8b94d060_like; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX paciente_rut_usuario_8b94d060_like ON public.paciente USING btree (rut_usuario varchar_pattern_ops);


--
-- Name: personal_optica_rut_usuario_a1d016bf_like; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX personal_optica_rut_usuario_a1d016bf_like ON public.personal_optica USING btree (rut_usuario varchar_pattern_ops);


--
-- Name: presupuesto_folio_unico_qr_83a7c806_like; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX presupuesto_folio_unico_qr_83a7c806_like ON public.presupuesto USING btree (folio_unico_qr varchar_pattern_ops);


--
-- Name: recepcion_despacho_folio_unico_qr_d1e6348a_like; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX recepcion_despacho_folio_unico_qr_d1e6348a_like ON public.recepcion_despacho USING btree (folio_unico_qr varchar_pattern_ops);


--
-- Name: receta_optica_rut_paciente_df19992e; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX receta_optica_rut_paciente_df19992e ON public.receta_optica USING btree (rut_paciente);


--
-- Name: receta_optica_rut_paciente_df19992e_like; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX receta_optica_rut_paciente_df19992e_like ON public.receta_optica USING btree (rut_paciente varchar_pattern_ops);


--
-- Name: registro_auditoria_rut_usuario_accion_ac1cbdb9; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX registro_auditoria_rut_usuario_accion_ac1cbdb9 ON public.registro_auditoria USING btree (rut_usuario_accion);


--
-- Name: registro_auditoria_rut_usuario_accion_ac1cbdb9_like; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX registro_auditoria_rut_usuario_accion_ac1cbdb9_like ON public.registro_auditoria USING btree (rut_usuario_accion varchar_pattern_ops);


--
-- Name: reserva_hora_rut_paciente_007320b7; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX reserva_hora_rut_paciente_007320b7 ON public.reserva_hora USING btree (rut_paciente);


--
-- Name: reserva_hora_rut_paciente_007320b7_like; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX reserva_hora_rut_paciente_007320b7_like ON public.reserva_hora USING btree (rut_paciente varchar_pattern_ops);


--
-- Name: solicitud_entrega_folio_unico_qr_02db5daa_like; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX solicitud_entrega_folio_unico_qr_02db5daa_like ON public.solicitud_entrega USING btree (folio_unico_qr varchar_pattern_ops);


--
-- Name: solicitud_entrega_id_receta_94ea0e09; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX solicitud_entrega_id_receta_94ea0e09 ON public.solicitud_entrega USING btree (id_receta);


--
-- Name: solicitud_entrega_rut_paciente_feef0ae6; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX solicitud_entrega_rut_paciente_feef0ae6 ON public.solicitud_entrega USING btree (rut_paciente);


--
-- Name: solicitud_entrega_rut_paciente_feef0ae6_like; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX solicitud_entrega_rut_paciente_feef0ae6_like ON public.solicitud_entrega USING btree (rut_paciente varchar_pattern_ops);


--
-- Name: solicitud_entrega_rut_titular_pago_2040f8ff; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX solicitud_entrega_rut_titular_pago_2040f8ff ON public.solicitud_entrega USING btree (rut_titular_pago);


--
-- Name: solicitud_entrega_rut_titular_pago_2040f8ff_like; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX solicitud_entrega_rut_titular_pago_2040f8ff_like ON public.solicitud_entrega USING btree (rut_titular_pago varchar_pattern_ops);


--
-- Name: solicitud_entrega_sku_armazon_17e012ff; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX solicitud_entrega_sku_armazon_17e012ff ON public.solicitud_entrega USING btree (sku_armazon);


--
-- Name: solicitud_entrega_sku_armazon_17e012ff_like; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX solicitud_entrega_sku_armazon_17e012ff_like ON public.solicitud_entrega USING btree (sku_armazon varchar_pattern_ops);


--
-- Name: titular_pago_id_empresa_7ecc5ea9; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX titular_pago_id_empresa_7ecc5ea9 ON public.titular_pago USING btree (id_empresa);


--
-- Name: titular_pago_rut_titular_bb43af68_like; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX titular_pago_rut_titular_bb43af68_like ON public.titular_pago USING btree (rut_titular varchar_pattern_ops);


--
-- Name: token_blacklist_outstandingtoken_jti_hex_d9bdf6f7_like; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX token_blacklist_outstandingtoken_jti_hex_d9bdf6f7_like ON public.token_blacklist_outstandingtoken USING btree (jti varchar_pattern_ops);


--
-- Name: token_blacklist_outstandingtoken_user_id_83bc629a; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX token_blacklist_outstandingtoken_user_id_83bc629a ON public.token_blacklist_outstandingtoken USING btree (user_id);


--
-- Name: usuario_correo_electronico_095a0d38_like; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX usuario_correo_electronico_095a0d38_like ON public.usuario USING btree (correo_electronico varchar_pattern_ops);


--
-- Name: usuario_rut_usuario_709240f4_like; Type: INDEX; Schema: public; Owner: amaru_admin
--

CREATE INDEX usuario_rut_usuario_709240f4_like ON public.usuario USING btree (rut_usuario varchar_pattern_ops);


--
-- Name: movimiento_stock trg_aplicar_movimiento_stock; Type: TRIGGER; Schema: public; Owner: amaru_admin
--

CREATE TRIGGER trg_aplicar_movimiento_stock AFTER INSERT ON public.movimiento_stock FOR EACH ROW EXECUTE FUNCTION public.actualizar_stock_por_movimiento();


--
-- Name: registro_auditoria trg_auditoria_append_only; Type: TRIGGER; Schema: public; Owner: amaru_admin
--

CREATE TRIGGER trg_auditoria_append_only BEFORE DELETE OR UPDATE ON public.registro_auditoria FOR EACH ROW EXECUTE FUNCTION public.bloquear_mutacion_auditoria();


--
-- Name: auth_group_permissions auth_group_permissio_permission_id_84c5c92e_fk_auth_perm; Type: FK CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissio_permission_id_84c5c92e_fk_auth_perm FOREIGN KEY (permission_id) REFERENCES public.auth_permission(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_group_permissions auth_group_permissions_group_id_b120cbf9_fk_auth_group_id; Type: FK CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_group_id_b120cbf9_fk_auth_group_id FOREIGN KEY (group_id) REFERENCES public.auth_group(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_permission auth_permission_content_type_id_2f476e4b_fk_django_co; Type: FK CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_content_type_id_2f476e4b_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_user_groups auth_user_groups_group_id_97559544_fk_auth_group_id; Type: FK CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.auth_user_groups
    ADD CONSTRAINT auth_user_groups_group_id_97559544_fk_auth_group_id FOREIGN KEY (group_id) REFERENCES public.auth_group(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_user_groups auth_user_groups_user_id_6a12ed8b_fk_auth_user_id; Type: FK CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.auth_user_groups
    ADD CONSTRAINT auth_user_groups_user_id_6a12ed8b_fk_auth_user_id FOREIGN KEY (user_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_user_user_permissions auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm; Type: FK CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm FOREIGN KEY (permission_id) REFERENCES public.auth_permission(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_user_user_permissions auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id; Type: FK CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id FOREIGN KEY (user_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: cuota_descuento cuota_descuento_id_presupuesto_1b361338_fk_presupues; Type: FK CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.cuota_descuento
    ADD CONSTRAINT cuota_descuento_id_presupuesto_1b361338_fk_presupues FOREIGN KEY (id_presupuesto) REFERENCES public.presupuesto(id_presupuesto) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: django_admin_log django_admin_log_content_type_id_c4bce8eb_fk_django_co; Type: FK CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_content_type_id_c4bce8eb_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: django_admin_log django_admin_log_user_id_c564eba6_fk_auth_user_id; Type: FK CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_user_id_c564eba6_fk_auth_user_id FOREIGN KEY (user_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: documento_respaldo documento_respaldo_folio_unico_qr_046509c7_fk_solicitud; Type: FK CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.documento_respaldo
    ADD CONSTRAINT documento_respaldo_folio_unico_qr_046509c7_fk_solicitud FOREIGN KEY (folio_unico_qr) REFERENCES public.solicitud_entrega(folio_unico_qr) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: lote_nomina_sindicato lote_nomina_sindicat_id_empresa_45bd0538_fk_empresa_c; Type: FK CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.lote_nomina_sindicato
    ADD CONSTRAINT lote_nomina_sindicat_id_empresa_45bd0538_fk_empresa_c FOREIGN KEY (id_empresa) REFERENCES public.empresa_convenio(id_empresa) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: lote_nomina_sindicato lote_nomina_sindicat_rut_responsable_carg_cdbb2c8b_fk_usuario_r; Type: FK CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.lote_nomina_sindicato
    ADD CONSTRAINT lote_nomina_sindicat_rut_responsable_carg_cdbb2c8b_fk_usuario_r FOREIGN KEY (rut_responsable_carga) REFERENCES public.usuario(rut_usuario) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: movimiento_stock movimiento_stock_folio_unico_qr_df3903f2_fk_solicitud; Type: FK CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.movimiento_stock
    ADD CONSTRAINT movimiento_stock_folio_unico_qr_df3903f2_fk_solicitud FOREIGN KEY (folio_unico_qr) REFERENCES public.solicitud_entrega(folio_unico_qr) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: movimiento_stock movimiento_stock_sku_armazon_35f53102_fk_armazon_i; Type: FK CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.movimiento_stock
    ADD CONSTRAINT movimiento_stock_sku_armazon_35f53102_fk_armazon_i FOREIGN KEY (sku_armazon) REFERENCES public.armazon_inventario(sku_armazon) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: paciente paciente_id_empresa_65e67cd5_fk_empresa_convenio_id_empresa; Type: FK CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.paciente
    ADD CONSTRAINT paciente_id_empresa_65e67cd5_fk_empresa_convenio_id_empresa FOREIGN KEY (id_empresa) REFERENCES public.empresa_convenio(id_empresa) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: paciente paciente_rut_usuario_8b94d060_fk_usuario_rut_usuario; Type: FK CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.paciente
    ADD CONSTRAINT paciente_rut_usuario_8b94d060_fk_usuario_rut_usuario FOREIGN KEY (rut_usuario) REFERENCES public.usuario(rut_usuario) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: personal_optica personal_optica_rut_usuario_a1d016bf_fk_usuario_rut_usuario; Type: FK CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.personal_optica
    ADD CONSTRAINT personal_optica_rut_usuario_a1d016bf_fk_usuario_rut_usuario FOREIGN KEY (rut_usuario) REFERENCES public.usuario(rut_usuario) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: presupuesto presupuesto_folio_unico_qr_83a7c806_fk_solicitud; Type: FK CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.presupuesto
    ADD CONSTRAINT presupuesto_folio_unico_qr_83a7c806_fk_solicitud FOREIGN KEY (folio_unico_qr) REFERENCES public.solicitud_entrega(folio_unico_qr) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: recepcion_despacho recepcion_despacho_folio_unico_qr_d1e6348a_fk_solicitud; Type: FK CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.recepcion_despacho
    ADD CONSTRAINT recepcion_despacho_folio_unico_qr_d1e6348a_fk_solicitud FOREIGN KEY (folio_unico_qr) REFERENCES public.solicitud_entrega(folio_unico_qr) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: receta_optica receta_optica_rut_paciente_df19992e_fk_paciente_rut_usuario; Type: FK CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.receta_optica
    ADD CONSTRAINT receta_optica_rut_paciente_df19992e_fk_paciente_rut_usuario FOREIGN KEY (rut_paciente) REFERENCES public.paciente(rut_usuario) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: registro_auditoria registro_auditoria_rut_usuario_accion_ac1cbdb9_fk_usuario_r; Type: FK CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.registro_auditoria
    ADD CONSTRAINT registro_auditoria_rut_usuario_accion_ac1cbdb9_fk_usuario_r FOREIGN KEY (rut_usuario_accion) REFERENCES public.usuario(rut_usuario) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: reserva_hora reserva_hora_rut_paciente_007320b7_fk_paciente_rut_usuario; Type: FK CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.reserva_hora
    ADD CONSTRAINT reserva_hora_rut_paciente_007320b7_fk_paciente_rut_usuario FOREIGN KEY (rut_paciente) REFERENCES public.paciente(rut_usuario) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: solicitud_entrega solicitud_entrega_id_receta_94ea0e09_fk_receta_optica_id_receta; Type: FK CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.solicitud_entrega
    ADD CONSTRAINT solicitud_entrega_id_receta_94ea0e09_fk_receta_optica_id_receta FOREIGN KEY (id_receta) REFERENCES public.receta_optica(id_receta) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: solicitud_entrega solicitud_entrega_rut_paciente_feef0ae6_fk_paciente_rut_usuario; Type: FK CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.solicitud_entrega
    ADD CONSTRAINT solicitud_entrega_rut_paciente_feef0ae6_fk_paciente_rut_usuario FOREIGN KEY (rut_paciente) REFERENCES public.paciente(rut_usuario) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: solicitud_entrega solicitud_entrega_rut_titular_pago_2040f8ff_fk_titular_p; Type: FK CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.solicitud_entrega
    ADD CONSTRAINT solicitud_entrega_rut_titular_pago_2040f8ff_fk_titular_p FOREIGN KEY (rut_titular_pago) REFERENCES public.titular_pago(rut_titular) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: solicitud_entrega solicitud_entrega_sku_armazon_17e012ff_fk_armazon_i; Type: FK CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.solicitud_entrega
    ADD CONSTRAINT solicitud_entrega_sku_armazon_17e012ff_fk_armazon_i FOREIGN KEY (sku_armazon) REFERENCES public.armazon_inventario(sku_armazon) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: titular_pago titular_pago_id_empresa_7ecc5ea9_fk_empresa_convenio_id_empresa; Type: FK CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.titular_pago
    ADD CONSTRAINT titular_pago_id_empresa_7ecc5ea9_fk_empresa_convenio_id_empresa FOREIGN KEY (id_empresa) REFERENCES public.empresa_convenio(id_empresa) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: token_blacklist_blacklistedtoken token_blacklist_blacklistedtoken_token_id_3cc7fe56_fk; Type: FK CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.token_blacklist_blacklistedtoken
    ADD CONSTRAINT token_blacklist_blacklistedtoken_token_id_3cc7fe56_fk FOREIGN KEY (token_id) REFERENCES public.token_blacklist_outstandingtoken(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: token_blacklist_outstandingtoken token_blacklist_outs_user_id_83bc629a_fk_auth_user; Type: FK CONSTRAINT; Schema: public; Owner: amaru_admin
--

ALTER TABLE ONLY public.token_blacklist_outstandingtoken
    ADD CONSTRAINT token_blacklist_outs_user_id_83bc629a_fk_auth_user FOREIGN KEY (user_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- PostgreSQL database dump complete
--

\unrestrict 69DzgEZQgvnB9Du7LdYYPp93yVAzwW4cxkONyEoDLJd5no0CApzGQVLEFRY8yfX

