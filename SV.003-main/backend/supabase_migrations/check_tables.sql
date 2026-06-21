-- Ejecutar en Supabase → SQL Editor → Run
-- Muestra qué tablas clínicas existen y cuáles faltan

WITH expected(name, migration_hint) AS (
  VALUES
    ('profiles', 'core'),
    ('consultations', 'core'),
    ('medical_images', 'core'),
    ('payment_transactions', '20251229_payment_transactions'),
    ('organizations', '20260614_clinic_phase1_schema'),
    ('clients', '20260614_clinic_phase1_schema'),
    ('patients', '20260614_clinic_phase1_schema'),
    ('appointments', '20260614_clinic_phase1_schema'),
    ('appointment_requests', '20260616_appointment_requests'),
    ('products', '20260617_inventory_billing'),
    ('stock_movements', '20260617_inventory_billing'),
    ('clinical_invoices', '20260617_inventory_billing'),
    ('clinical_invoice_items', '20260617_inventory_billing'),
    ('platform_admins', '20260620_platform_security'),
    ('admin_audit_log', '20260620_platform_security'),
    ('support_tickets', '20260621_support_tickets'),
    ('support_messages', '20260621_support_tickets')
)
SELECT
  e.name AS tabla,
  e.migration_hint AS migracion,
  CASE
    WHEN t.table_name IS NOT NULL THEN 'OK'
    ELSE 'FALTA'
  END AS estado
FROM expected e
LEFT JOIN information_schema.tables t
  ON t.table_schema = 'public' AND t.table_name = e.name
ORDER BY
  CASE WHEN t.table_name IS NULL THEN 0 ELSE 1 END,
  e.name;
