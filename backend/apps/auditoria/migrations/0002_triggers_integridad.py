from django.db import migrations


TRIGGER_STOCK_SQL = """
CREATE OR REPLACE FUNCTION actualizar_stock_por_movimiento() RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_aplicar_movimiento_stock 
AFTER INSERT ON movimiento_stock
FOR EACH ROW EXECUTE FUNCTION actualizar_stock_por_movimiento();
"""

TRIGGER_AUDITORIA_SQL = """
CREATE OR REPLACE FUNCTION bloquear_mutacion_auditoria() RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'SEGURIDAD: Tabla de auditoria es inmutable (Append-Only).';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_auditoria_append_only 
BEFORE UPDATE OR DELETE ON registro_auditoria
FOR EACH ROW EXECUTE FUNCTION bloquear_mutacion_auditoria();
"""

REVERSE_SQL = """
DROP TRIGGER IF EXISTS trg_aplicar_movimiento_stock ON movimiento_stock;
DROP FUNCTION IF EXISTS actualizar_stock_por_movimiento();
DROP TRIGGER IF EXISTS trg_auditoria_append_only ON registro_auditoria;
DROP FUNCTION IF EXISTS bloquear_mutacion_auditoria();
"""


class Migration(migrations.Migration):

    dependencies = [
        ('auditoria', '0001_initial'),
        ('transacciones', '0001_initial'),
    ]

    operations = [
        migrations.RunSQL(
            sql=TRIGGER_STOCK_SQL + TRIGGER_AUDITORIA_SQL,
            reverse_sql=REVERSE_SQL
        )
    ]