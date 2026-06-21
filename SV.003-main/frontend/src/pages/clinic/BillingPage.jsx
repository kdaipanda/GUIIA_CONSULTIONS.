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
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
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

const EMPTY_LINE = { product_id: "", description: "", quantity: "1", unit_price: "" };

export function BillingPage() {
  const { veterinarian } = useVet();
  const { organization } = useClinic();
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    client_id: "",
    tax_rate: "0",
    payment_method: "efectivo",
    notes: "",
    deduct_stock: true,
    items: [{ ...EMPTY_LINE }],
  });

  const load = useCallback(async () => {
    if (!veterinarian?.id) return;
    setLoading(true);
    setError("");
    try {
      const [invData, clientsData] = await Promise.all([
        fetchInvoices(veterinarian.id),
        fetchClients(veterinarian.id),
      ]);
      setInvoices(invData.invoices || []);
      setClients(clientsData.clients || []);
      try {
        const prodData = await fetchProducts(veterinarian.id);
        setProducts(prodData.products || []);
      } catch {
        setProducts([]);
      }
    } catch (err) {
      setError(err.message);
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

  const openCreate = () => {
    setForm({
      client_id: GENERAL_PUBLIC_ID,
      tax_rate: "0",
      payment_method: "efectivo",
      notes: "",
      deduct_stock: true,
      items: [{ ...EMPTY_LINE }],
    });
    setDialogOpen(true);
  };

  const addLine = () => {
    setForm({ ...form, items: [...form.items, { ...EMPTY_LINE }] });
  };

  const updateLine = (index, field, value) => {
    const items = [...form.items];
    items[index] = { ...items[index], [field]: value };
    if (field === "product_id" && value) {
      const product = products.find((p) => p.id === value);
      if (product) {
        items[index].description = product.name;
        items[index].unit_price = String(product.price ?? "");
      }
    }
    setForm({ ...form, items });
  };

  const removeLine = (index) => {
    if (form.items.length <= 1) return;
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const items = form.items
      .filter((l) => l.description.trim())
      .map((l) => ({
        product_id: l.product_id || null,
        description: l.description.trim(),
        quantity: Number(l.quantity) || 1,
        unit_price: Number(l.unit_price) || 0,
      }));
    if (!items.length) return;
    setSaving(true);
    try {
      await createInvoice(veterinarian.id, {
        client_id:
          form.client_id && form.client_id !== GENERAL_PUBLIC_ID
            ? form.client_id
            : null,
        tax_rate: Number(form.tax_rate) || 0,
        payment_method: form.payment_method,
        notes: form.notes || null,
        status: "issued",
        deduct_stock: form.deduct_stock,
        items,
      });
      setDialogOpen(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const markPaid = async (invoice) => {
    try {
      await updateInvoice(veterinarian.id, invoice.id, { status: "paid", payment_method: invoice.payment_method || "efectivo" });
      setDetailOpen(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const openDetail = async (inv) => {
    try {
      const data = await fetchInvoice(veterinarian.id, inv.id);
      setDetail(data.invoice);
      setDetailOpen(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const formatMoney = (n) => `$${Number(n || 0).toFixed(2)}`;

  const handleDownloadPdf = async () => {
    if (!detail) return;
    try {
      await downloadInvoicePdf(detail, { organizationName: organization?.name });
    } catch (err) {
      setError(err.message || "No se pudo generar el PDF");
    }
  };

  return (
    <div className="clinic-page clinic-page-guiaa">
      <div className="clinic-page-header">
        <div>
          <p className="clinic-page-eyebrow">Consultorio</p>
          <h1>Ventas</h1>
          <p>Recibos y cobros clínicos (sin CFDI), vinculados al inventario.</p>
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus size={16} className="mr-1" /> Nueva Venta
        </Button>
      </div>

      <div className="clinic-toolbar">
        <div className="clinic-search">
          <Search size={16} />
          <Input placeholder="Buscar por folio, dueño o público general..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

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
          icon={Receipt}
          title={search.trim() ? "Sin resultados" : "Sin recibos registrados"}
          description={
            search.trim()
              ? "Prueba con otro folio o nombre de receptor."
              : "Registra la primera venta para generar recibos y descontar stock."
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
        <DialogContent className={clinicDialogClass("max-w-2xl", "max-h-[90vh]", "overflow-y-auto")}>
          <DialogHeader><DialogTitle>Nueva Venta</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="clinic-form">
            <div className="form-group">
              <Label>Receptor</Label>
              <Select value={form.client_id || GENERAL_PUBLIC_ID} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar receptor" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={GENERAL_PUBLIC_ID}>{GENERAL_PUBLIC_LABEL}</SelectItem>
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="clinic-muted">Usa «Público general» para ventas sin dueño registrado.</p>
            </div>
            <div className="form-group">
              <Label>IVA %</Label>
              <Input type="number" step="0.01" value={form.tax_rate} onChange={(e) => setForm({ ...form, tax_rate: e.target.value })} />
            </div>
            <div className="form-group">
              <Label>Método de pago</Label>
              <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="clinic-invoice-lines">
              <div className="clinic-invoice-lines-head">
                <strong>Conceptos</strong>
                <Button type="button" variant="ghost" size="sm" onClick={addLine}>+ Línea</Button>
              </div>
              {form.items.map((line, index) => (
                <div key={index} className="clinic-invoice-line">
                  {products.length > 0 && (
                    <Select value={line.product_id || "__manual__"} onValueChange={(v) => updateLine(index, "product_id", v === "__manual__" ? "" : v)}>
                      <SelectTrigger><SelectValue placeholder="Producto" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__manual__">Manual</SelectItem>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} — stock: {p.stock_qty} {p.unit || "pza"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Input placeholder="Descripción" value={line.description} onChange={(e) => updateLine(index, "description", e.target.value)} />
                  <Input type="number" placeholder="Cant." value={line.quantity} onChange={(e) => updateLine(index, "quantity", e.target.value)} />
                  <Input type="number" placeholder="Precio" value={line.unit_price} onChange={(e) => updateLine(index, "unit_price", e.target.value)} />
                  {form.items.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeLine(index)}>×</Button>
                  )}
                </div>
              ))}
            </div>

            <label className="clinic-checkbox-row">
              <input
                type="checkbox"
                checked={form.deduct_stock}
                onChange={(e) => setForm({ ...form, deduct_stock: e.target.checked })}
              />
              <span>Descontar del inventario al emitir (líneas con producto del catálogo)</span>
            </label>

            <div className="form-group">
              <Label>Notas</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Emitir recibo"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className={clinicDialogClass("max-w-lg")}>
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
                    <li key={item.id}>{item.description} × {item.quantity} — {formatMoney(item.line_total)}</li>
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
