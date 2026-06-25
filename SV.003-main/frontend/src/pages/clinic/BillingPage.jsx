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

const EMPTY_QUICK = {
  client_id: GENERAL_PUBLIC_ID,
  description: "",
  amount: "",
  payment_method: "efectivo",
};

export function BillingPage() {
  const { veterinarian } = useVet();
  const { organization } = useClinic();
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [saving, setSaving] = useState(false);
  const [quickForm, setQuickForm] = useState(EMPTY_QUICK);

  const load = useCallback(async () => {
    if (!veterinarian?.id) return;
    setLoading(true);
    try {
      const [invData, clientsData] = await Promise.all([
        fetchInvoices(veterinarian.id),
        fetchClients(veterinarian.id),
      ]);
      setInvoices(invData.invoices || []);
      setClients(clientsData.clients || []);
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

  const openCreate = () => {
    setQuickForm(EMPTY_QUICK);
    setDialogOpen(true);
  };

  const handleQuickSave = async (e) => {
    e.preventDefault();
    const description = quickForm.description.trim();
    const amount = Number(quickForm.amount);
    if (!description || !amount || amount <= 0) return;
    setSaving(true);
    try {
      await createInvoice(veterinarian.id, {
        client_id:
          quickForm.client_id && quickForm.client_id !== GENERAL_PUBLIC_ID
            ? quickForm.client_id
            : null,
        tax_rate: 0,
        payment_method: quickForm.payment_method,
        notes: null,
        status: "paid",
        deduct_stock: false,
        items: [{ description, quantity: 1, unit_price: amount }],
      });
      notifySuccess("Venta registrada y cobrada.");
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
      await updateInvoice(veterinarian.id, invoice.id, { status: "paid", payment_method: invoice.payment_method || "efectivo" });
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

  return (
    <div className="clinic-page clinic-page-guiaa">
      <div className="clinic-page-header">
        <div>
          <p className="clinic-page-eyebrow">Consultorio</p>
          <h1>Ventas</h1>
          <p>Registra cobros rápidos con concepto, monto y método de pago.</p>
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
              : "Registra la primera venta con concepto, monto y método de pago."
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
        <DialogContent className={clinicDialogClass("max-w-md")}>
          <DialogHeader>
            <DialogTitle>Nueva venta</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleQuickSave} className="clinic-form">
            <div className="form-group">
              <Label>Concepto *</Label>
              <div className="clinic-quick-chips" role="group" aria-label="Conceptos frecuentes">
                {QUICK_SALE_CONCEPTS.map((concept) => (
                  <button
                    key={concept}
                    type="button"
                    className={`clinic-quick-chip${quickForm.description === concept ? " is-active" : ""}`}
                    onClick={() => setQuickForm({ ...quickForm, description: concept })}
                  >
                    {concept}
                  </button>
                ))}
              </div>
              <Input
                className="mt-2"
                placeholder="O escribe otro concepto..."
                value={quickForm.description}
                onChange={(e) => setQuickForm({ ...quickForm, description: e.target.value })}
                required
              />
            </div>

            <div className="clinic-form-grid-2">
              <div className="form-group">
                <Label htmlFor="quick-sale-amount">Monto *</Label>
                <Input
                  id="quick-sale-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={quickForm.amount}
                  onChange={(e) => setQuickForm({ ...quickForm, amount: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <Label>Receptor</Label>
                <Select
                  value={quickForm.client_id || GENERAL_PUBLIC_ID}
                  onValueChange={(v) => setQuickForm({ ...quickForm, client_id: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Receptor" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={GENERAL_PUBLIC_ID}>{GENERAL_PUBLIC_LABEL}</SelectItem>
                    {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="form-group">
              <Label>Método de pago</Label>
              <div className="clinic-quick-chips" role="group" aria-label="Método de pago">
                {PAYMENT_METHODS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={`clinic-quick-chip${quickForm.payment_method === value ? " is-active" : ""}`}
                    onClick={() => setQuickForm({ ...quickForm, payment_method: value })}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <p className="clinic-muted clinic-quick-hint">
              Se registra como pagado al confirmar.
            </p>

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Cobrar y registrar"}</Button>
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
