import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, Receipt, FileDown } from "lucide-react";
import "./clinicPageShared.css";
import {
  ClinicTableSkeleton,
  ClinicEmptyState,
  ClinicStatPill,
  ClinicStatusPill,
  clinicDialogClass,
} from "../../components/clinic/ClinicPageUi";
import { useVet } from "../../context/VetContext";
import { useClinic } from "../../context/ClinicContext";
import {
  fetchInvoices,
  fetchInvoice,
  createInvoice,
  updateInvoice,
  fetchClients,
  fetchProducts,
} from "../../lib/clinicApi";
import { downloadInvoicePdf } from "../../lib/invoicePdf";
import { notifyError, notifySuccess } from "../../lib/appToast";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  QUICK_SALE_CONCEPTS,
  PAYMENT_METHODS,
} from "../../lib/clinicQuickForms";
import { DoctorPlumitas } from "../../components/brand/DoctorPlumitas";

const STATUS_LABELS = {
  draft: "Borrador",
  issued: "Emitido",
  paid: "Pagado",
  cancelled: "Cancelado",
};

const GENERAL_PUBLIC_ID = "__general__";
const GENERAL_PUBLIC_LABEL = "Público general";

const invoiceClientLabel = (invoice) =>
  invoice?.clients?.name || GENERAL_PUBLIC_LABEL;

const EMPTY_SALE = {
  client_id: GENERAL_PUBLIC_ID,
  payment_method: "efectivo",
  product_id: "",
  product_qty: "1",
  product_price: "",
  service_description: "",
  service_amount: "",
};

function buildSalePreview(form, products) {
  const items = [];
  const product = products.find((p) => p.id === form.product_id);

  if (form.product_id && product) {
    const quantity = Number(form.product_qty) || 0;
    const unitPrice = Number(form.product_price) || 0;
    if (quantity > 0 && unitPrice > 0) {
      items.push({
        product_id: form.product_id,
        description: product.name,
        quantity,
        unit_price: unitPrice,
        fromInventory: true,
      });
    }
  }

  const serviceDescription = form.service_description.trim();
  const serviceAmount = Number(form.service_amount) || 0;
  if (serviceDescription && serviceAmount > 0) {
    items.push({
      product_id: null,
      description: serviceDescription,
      quantity: 1,
      unit_price: serviceAmount,
      fromInventory: false,
    });
  }

  const total = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  return { items, total, product };
}

export function BillingPage() {
  const { veterinarian } = useVet();
  const { organization } = useClinic();
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saleForm, setSaleForm] = useState(EMPTY_SALE);

  const load = useCallback(async () => {
    if (!veterinarian?.id) return;
    setLoading(true);
    try {
      const [invData, clientsData, productsData] = await Promise.all([
        fetchInvoices(veterinarian.id),
        fetchClients(veterinarian.id),
        fetchProducts(veterinarian.id).catch(() => ({ products: [] })),
      ]);
      setInvoices(invData.invoices || []);
      setClients(clientsData.clients || []);
      setProducts((productsData.products || []).filter((p) => p.is_active !== false));
    } catch (err) {
      notifyError(err.message);
    } finally {
      setLoading(false);
    }
  }, [veterinarian?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = invoices.filter((inv) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (inv.invoice_number || "").toLowerCase().includes(q) ||
      invoiceClientLabel(inv).toLowerCase().includes(q)
    );
  });

  const stats = useMemo(() => {
    const paid = invoices.filter((inv) => inv.status === "paid");
    const revenue = paid.reduce((sum, inv) => sum + Number(inv.total || 0), 0);
    return { total: invoices.length, paid: paid.length, revenue };
  }, [invoices]);

  const salePreview = useMemo(
    () => buildSalePreview(saleForm, products),
    [saleForm, products],
  );

  const openCreate = () => {
    setSaleForm({ ...EMPTY_SALE });
    setDialogOpen(true);
  };

  const handleProductSelect = (productId) => {
    const product = products.find((p) => p.id === productId);
    setSaleForm((prev) => ({
      ...prev,
      product_id: productId,
      product_price:
        product?.price != null && product.price !== ""
          ? String(product.price)
          : prev.product_price,
    }));
  };

  const handleQuickSave = async (e) => {
    e.preventDefault();
    const { items, total, product } = salePreview;

    if (!items.length) {
      notifyError("Agrega al menos un producto del inventario o un servicio/concepto.");
      return;
    }

    const productLine = items.find((item) => item.fromInventory);
    if (productLine && product) {
      const available = Number(product.stock_qty) || 0;
      if (productLine.quantity > available) {
        notifyError(`Stock insuficiente para «${product.name}» (disponible: ${available}).`);
        return;
      }
    }

    setSaving(true);
    try {
      const hasInventory = items.some((item) => item.product_id);
      await createInvoice(veterinarian.id, {
        client_id:
          saleForm.client_id && saleForm.client_id !== GENERAL_PUBLIC_ID
            ? saleForm.client_id
            : null,
        tax_rate: 0,
        payment_method: saleForm.payment_method,
        notes: null,
        status: "paid",
        deduct_stock: hasInventory,
        items: items.map(({ product_id, description, quantity, unit_price }) => ({
          product_id,
          description,
          quantity,
          unit_price,
        })),
      });
      notifySuccess(
        hasInventory
          ? `Venta registrada por ${formatMoney(total)}. Stock actualizado.`
          : `Venta registrada por ${formatMoney(total)}.`,
      );
      setDialogOpen(false);
      load();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const markPaid = async (invoice) => {
    try {
      await updateInvoice(veterinarian.id, invoice.id, {
        status: "paid",
        payment_method: invoice.payment_method || "efectivo",
      });
      notifySuccess("Recibo marcado como pagado.");
      setDetailOpen(false);
      load();
    } catch (err) {
      notifyError(err.message);
    }
  };

  const openDetail = async (inv) => {
    try {
      const data = await fetchInvoice(veterinarian.id, inv.id);
      setDetail(data.invoice);
      setDetailOpen(true);
    } catch (err) {
      notifyError(err.message);
    }
  };

  const formatMoney = (n) => `$${Number(n || 0).toFixed(2)}`;

  const handleDownloadPdf = async () => {
    if (!detail) return;
    try {
      await downloadInvoicePdf(detail, { organizationName: organization?.name });
    } catch (err) {
      notifyError(err.message || "No se pudo generar el PDF");
    }
  };

  const selectedProduct = salePreview.product;

  return (
    <div className="clinic-page clinic-page-guiaa">
      <div className="clinic-page-header">
        <div>
          <p className="clinic-page-eyebrow">Consultorio</p>
          <h1>Ventas</h1>
          <p>Productos del inventario y servicios en un solo cobro.</p>
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus size={16} className="mr-1" /> Nueva Venta
        </Button>
      </div>

      <div className="clinic-toolbar">
        <div className="clinic-search">
          <Search size={16} />
          <Input
            placeholder="Buscar por folio, dueño o público general..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {!loading && invoices.length > 0 && (
        <div className="clinic-stats-row">
          <ClinicStatPill value={stats.total} label="Recibos" />
          <ClinicStatPill value={stats.paid} label="Pagados" />
          <ClinicStatPill value={formatMoney(stats.revenue)} label="Cobrado" />
        </div>
      )}

      {loading ? (
        <ClinicTableSkeleton rows={6} cols={5} />
      ) : filtered.length === 0 ? (
        <ClinicEmptyState
          mascot={<DoctorPlumitas size="sm" badge />}
          title={search.trim() ? "Sin resultados" : "Sin recibos registrados"}
          description={
            search.trim()
              ? "Prueba con otro folio o nombre de receptor."
              : "Registra la primera venta con producto, servicio o ambos."
          }
          actionLabel={search.trim() ? undefined : "Nueva venta"}
          onAction={search.trim() ? undefined : openCreate}
        />
      ) : (
        <div className="clinic-table-wrap">
          <table className="clinic-table">
            <thead>
              <tr>
                <th>Folio</th>
                <th>Receptor</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id} className="clinic-table-row-click" onClick={() => openDetail(inv)}>
                  <td><strong>{inv.invoice_number || inv.id.slice(0, 8)}</strong></td>
                  <td>{invoiceClientLabel(inv)}</td>
                  <td>{formatMoney(inv.total)}</td>
                  <td>
                    <ClinicStatusPill
                      status={inv.status}
                      label={STATUS_LABELS[inv.status] || inv.status}
                    />
                  </td>
                  <td>{inv.created_at ? new Date(inv.created_at).toLocaleDateString("es-MX") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clinicDialogClass("max-w-md", "clinic-sale-dialog")}>
          <DialogHeader>
            <DialogTitle>Nueva venta</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleQuickSave} className="clinic-form">
            <p className="clinic-muted clinic-quick-hint">
              Puedes cobrar producto del inventario, un servicio o ambos en la misma venta.
            </p>

            <div className="clinic-sale-section">
              <p className="clinic-form-section-label">Producto del inventario</p>
              {products.length === 0 ? (
                <p className="clinic-muted clinic-quick-hint">
                  Sin productos en inventario. Solo servicios por ahora.
                </p>
              ) : (
                <>
                  <div className="form-group">
                    <Label>Producto</Label>
                    <Select
                      value={saleForm.product_id || undefined}
                      onValueChange={handleProductSelect}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar producto (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} — stock {Number(p.stock_qty) || 0} {p.unit || "pza"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedProduct && (
                      <>
                        <p className="clinic-muted clinic-quick-hint">
                          Stock: {Number(selectedProduct.stock_qty) || 0} {selectedProduct.unit || "pza"}
                          {selectedProduct.sku ? ` · SKU ${selectedProduct.sku}` : ""}
                        </p>
                        <button
                          type="button"
                          className="clinic-link-btn"
                          onClick={() =>
                            setSaleForm((prev) => ({
                              ...prev,
                              product_id: "",
                              product_qty: "1",
                              product_price: "",
                            }))
                          }
                        >
                          Quitar producto de esta venta
                        </button>
                      </>
                    )}
                  </div>
                  <div className="clinic-form-grid-2">
                    <div className="form-group">
                      <Label htmlFor="sale-product-qty">Cantidad</Label>
                      <Input
                        id="sale-product-qty"
                        type="number"
                        min="0"
                        step="0.01"
                        value={saleForm.product_qty}
                        onChange={(e) => setSaleForm({ ...saleForm, product_qty: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <Label htmlFor="sale-product-price">Precio unitario</Label>
                      <Input
                        id="sale-product-price"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={saleForm.product_price}
                        onChange={(e) => setSaleForm({ ...saleForm, product_price: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="clinic-sale-section">
              <p className="clinic-form-section-label">Servicio o concepto</p>
              <div className="clinic-quick-chips" role="group" aria-label="Conceptos frecuentes">
                {QUICK_SALE_CONCEPTS.map((concept) => (
                  <button
                    key={concept}
                    type="button"
                    className={`clinic-quick-chip${saleForm.service_description === concept ? " is-active" : ""}`}
                    onClick={() => setSaleForm({ ...saleForm, service_description: concept })}
                  >
                    {concept}
                  </button>
                ))}
              </div>
              <div className="form-group mt-2">
                <Label htmlFor="sale-service-desc">Concepto</Label>
                <Input
                  id="sale-service-desc"
                  placeholder="Ej. Consulta general, baño..."
                  value={saleForm.service_description}
                  onChange={(e) => setSaleForm({ ...saleForm, service_description: e.target.value })}
                />
              </div>
              <div className="form-group">
                <Label htmlFor="sale-service-amount">Monto del servicio</Label>
                <Input
                  id="sale-service-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={saleForm.service_amount}
                  onChange={(e) => setSaleForm({ ...saleForm, service_amount: e.target.value })}
                />
              </div>
            </div>

            {salePreview.items.length > 0 && (
              <div className="clinic-sale-summary">
                <p className="clinic-form-section-label">Resumen</p>
                <ul className="clinic-sale-summary-list">
                  {salePreview.items.map((item) => (
                    <li key={`${item.description}-${item.fromInventory}`}>
                      <span>
                        {item.description}
                        {item.quantity > 1 ? ` × ${item.quantity}` : ""}
                      </span>
                      <strong>{formatMoney(item.quantity * item.unit_price)}</strong>
                    </li>
                  ))}
                </ul>
                <p className="clinic-sale-summary-total">
                  Total: <strong>{formatMoney(salePreview.total)}</strong>
                </p>
                {salePreview.items.some((item) => item.fromInventory) && (
                  <p className="clinic-muted clinic-quick-hint">
                    Los productos del inventario se descontarán al cobrar.
                  </p>
                )}
              </div>
            )}

            <div className="form-group">
              <Label>Receptor</Label>
              <Select
                value={saleForm.client_id || GENERAL_PUBLIC_ID}
                onValueChange={(v) => setSaleForm({ ...saleForm, client_id: v })}
              >
                <SelectTrigger><SelectValue placeholder="Receptor" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={GENERAL_PUBLIC_ID}>{GENERAL_PUBLIC_LABEL}</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="form-group">
              <Label>Método de pago</Label>
              <div className="clinic-quick-chips" role="group" aria-label="Método de pago">
                {PAYMENT_METHODS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={`clinic-quick-chip${saleForm.payment_method === value ? " is-active" : ""}`}
                    onClick={() => setSaleForm({ ...saleForm, payment_method: value })}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving || salePreview.items.length === 0}>
                {saving ? "Guardando..." : `Cobrar ${salePreview.total > 0 ? formatMoney(salePreview.total) : ""}`.trim()}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className={clinicDialogClass("max-w-md")}>
          <DialogHeader>
            <DialogTitle>{detail?.invoice_number || "Recibo"}</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="clinic-detail">
              <p><strong>Receptor:</strong> {invoiceClientLabel(detail)}</p>
              <p><strong>Estado:</strong> {STATUS_LABELS[detail.status] || detail.status}</p>
              <p><strong>Subtotal:</strong> {formatMoney(detail.subtotal)}</p>
              <p><strong>IVA:</strong> {formatMoney(detail.tax_amount)}</p>
              <p><strong>Total:</strong> {formatMoney(detail.total)}</p>
              {detail.items?.length > 0 && (
                <ul className="clinic-invoice-detail-list">
                  {detail.items.map((item) => (
                    <li key={item.id}>
                      {item.description} × {item.quantity} — {formatMoney(item.line_total)}
                    </li>
                  ))}
                </ul>
              )}
              {detail.status !== "paid" && detail.status !== "cancelled" && (
                <Button type="button" className="mt-4" onClick={() => markPaid(detail)}>
                  <Receipt size={16} className="mr-1" /> Marcar como pagado
                </Button>
              )}
              <Button type="button" variant="secondary" className="mt-4 ml-2" onClick={handleDownloadPdf}>
                <FileDown size={16} className="mr-1" /> Descargar PDF
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
