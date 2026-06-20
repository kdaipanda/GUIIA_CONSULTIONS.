-- Fase 4 PMS: Inventario + Facturación clínica (sin CFDI)

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  sku text,
  category text,
  unit text NOT NULL DEFAULT 'pza',
  price numeric(12, 2) NOT NULL DEFAULT 0,
  cost numeric(12, 2) NOT NULL DEFAULT 0,
  stock_qty numeric(12, 3) NOT NULL DEFAULT 0,
  min_stock numeric(12, 3) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_products_organization_id ON public.products(organization_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(organization_id, name);

CREATE TABLE IF NOT EXISTS public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  movement_type text NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
  quantity numeric(12, 3) NOT NULL CHECK (quantity > 0),
  reason text,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON public.stock_movements(product_id);

CREATE TABLE IF NOT EXISTS public.clinical_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  invoice_number text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'issued', 'paid', 'cancelled')),
  subtotal numeric(12, 2) NOT NULL DEFAULT 0,
  tax_rate numeric(5, 2) NOT NULL DEFAULT 0,
  tax_amount numeric(12, 2) NOT NULL DEFAULT 0,
  total numeric(12, 2) NOT NULL DEFAULT 0,
  payment_method text,
  paid_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_clinical_invoices_org ON public.clinical_invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_clinical_invoices_client ON public.clinical_invoices(client_id);

CREATE TABLE IF NOT EXISTS public.clinical_invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.clinical_invoices(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  description text NOT NULL,
  quantity numeric(12, 3) NOT NULL DEFAULT 1,
  unit_price numeric(12, 2) NOT NULL,
  line_total numeric(12, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_clinical_invoice_items_invoice ON public.clinical_invoice_items(invoice_id);

COMMENT ON TABLE public.products IS 'Catálogo de productos / insumos clínicos';
COMMENT ON TABLE public.stock_movements IS 'Movimientos de inventario';
COMMENT ON TABLE public.clinical_invoices IS 'Recibos y facturación clínica (sin timbrado CFDI)';
COMMENT ON TABLE public.clinical_invoice_items IS 'Líneas de factura clínica';
