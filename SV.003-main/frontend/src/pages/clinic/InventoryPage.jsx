import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, PackageMinus, History, AlertTriangle, Package, DollarSign } from "lucide-react";
import "./clinicPageShared.css";
import "./inventoryPage.css";
import "./helpCenterPage.css";
import { ConfirmActionDialog } from "../../components/clinic/ConfirmActionDialog";
import { useConfirmAction } from "../../hooks/useConfirmAction";
import {
  ClinicTableSkeleton,
  ClinicEmptyState,
  clinicDialogClass,
} from "../../components/clinic/ClinicPageUi";
import { ModuleHelpTip } from "../../components/clinic/ModuleHelpTip";
import { useVet } from "../../context/VetContext";
import {
  fetchProducts,
  fetchInventorySummary,
  fetchProductMovements,
  createProduct,
  updateProduct,
  deleteProduct,
  registerStockMovement,
} from "../../lib/clinicApi";
import { clinicCacheKey, loadClinicData, readClinicDataCache } from "../../lib/clinicDataCache";
import { notifyError, notifySuccess } from "../../lib/appToast";
import { useTranslation } from "react-i18next";
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

const EMPTY_FORM = {
  name: "",
  sku: "",
  category: "",
  unit: "pza",
  price: "",
  cost: "",
  stock_qty: "",
  min_stock: "",
  notes: "",
};

const CATEGORIES = [
  "Medicamento",
  "Vacuna",
  "Insumo",
  "Alimento",
  "Higiene",
  "Equipamiento",
  "Otro",
];

const UNITS = ["pza", "caja", "frasco", "ml", "L", "g", "kg"];

function formatMoney(value, locale = "es-MX") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function InventoryPage() {
  const { t, i18n } = useTranslation("clinic");
  const locale = (i18n.language || "en").startsWith("es") ? "es-MX" : "en-US";
  const categoryLabel = (value) => t(`inventory.categories.${value}`, { defaultValue: value });
  const unitLabel = (value) => t(`inventory.units.${value}`, { defaultValue: value });
  const movementLabel = (type) => t(`inventory.movements.${type}`, { defaultValue: type });
  const { veterinarian } = useVet();
  const { confirm, dialogProps } = useConfirmAction();
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [migrationHint, setMigrationHint] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyProduct, setHistoryProduct] = useState(null);
  const [movements, setMovements] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [stockProduct, setStockProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [stockForm, setStockForm] = useState({ movement_type: "in", quantity: "", reason: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!veterinarian?.id) {
      setLoading(false);
      return;
    }
    const productsKey = clinicCacheKey(veterinarian.id, "inventory-products", search || "all");
    const summaryKey = clinicCacheKey(veterinarian.id, "inventory-summary");
    const cachedProducts = readClinicDataCache(productsKey);
    const cachedSummary = readClinicDataCache(summaryKey);
    if (!cachedProducts) setLoading(true);
    setMigrationHint(false);
    if (cachedProducts) setProducts(cachedProducts.products || []);
    if (cachedSummary) setSummary(cachedSummary);
    try {
      const [data, summaryData] = await Promise.all([
        loadClinicData(productsKey, () => fetchProducts(veterinarian.id, search), { ttlMs: 90_000 }),
        loadClinicData(summaryKey, () => fetchInventorySummary(veterinarian.id).catch(() => null), {
          ttlMs: 60_000,
        }),
      ]);
      setProducts(data.products || []);
      setSummary(summaryData);
    } catch (err) {
      if (!cachedProducts) {
        if (String(err.message).includes("no configurado") || String(err.message).includes("PGRST")) {
          setMigrationHint(true);
          setProducts([]);
        } else {
          notifyError(err.message);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [veterinarian?.id, search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm({
      name: product.name || "",
      sku: product.sku || "",
      category: product.category || "",
      unit: product.unit || "pza",
      price: product.price ?? "",
      cost: product.cost ?? "",
      stock_qty: product.stock_qty ?? "",
      min_stock: product.min_stock ?? "",
      notes: product.notes || "",
    });
    setDialogOpen(true);
  };

  const openStock = (product) => {
    setStockProduct(product);
    setStockForm({ movement_type: "in", quantity: "", reason: "" });
    setStockOpen(true);
  };

  const openHistory = async (product) => {
    setHistoryProduct(product);
    setHistoryOpen(true);
    setHistoryLoading(true);
    setMovements([]);
    try {
      const data = await fetchProductMovements(veterinarian.id, product.id);
      setMovements(data.movements || []);
      if (data.product) setHistoryProduct(data.product);
    } catch (err) {
      notifyError(err.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = {
      ...form,
      price: Number(form.price) || 0,
      cost: Number(form.cost) || 0,
      stock_qty: Number(form.stock_qty) || 0,
      min_stock: Number(form.min_stock) || 0,
    };
    try {
      if (editing) {
        await updateProduct(veterinarian.id, editing.id, payload);
        notifySuccess(t("inventory.productUpdated"));
      } else {
        await createProduct(veterinarian.id, payload);
        notifySuccess(t("inventory.productCreated"));
      }
      setDialogOpen(false);
      load();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStock = async (e) => {
    e.preventDefault();
    if (!stockProduct || !stockForm.quantity) return;
    setSaving(true);
    try {
      await registerStockMovement(veterinarian.id, stockProduct.id, {
        movement_type: stockForm.movement_type,
        quantity: Number(stockForm.quantity),
        reason: stockForm.reason || null,
      });
      notifySuccess(t("inventory.stockMoved"));
      setStockOpen(false);
      load();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    const ok = await confirm({
      title: t("inventory.deleteTitle"),
      description: t("inventory.deleteDesc", { name: product.name }),
      confirmLabel: t("inventory.deleteConfirm"),
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteProduct(veterinarian.id, product.id);
      notifySuccess(t("inventory.productDeleted"));
      load();
    } catch (err) {
      notifyError(err.message);
    }
  };

  const isLowStock = (p) =>
    p.is_active !== false && Number(p.stock_qty || 0) <= Number(p.min_stock || 0);

  const displayedProducts = useMemo(() => {
    if (!lowStockOnly) return products;
    return products.filter(isLowStock);
  }, [products, lowStockOnly]);

  const lowStockCount = summary?.low_stock_count ?? products.filter(isLowStock).length;

  const categoryOptions = form.category && !CATEGORIES.includes(form.category)
    ? [...CATEGORIES, form.category]
    : CATEGORIES;

  const unitOptions = form.unit && !UNITS.includes(form.unit)
    ? [...UNITS, form.unit]
    : UNITS;

  return (
    <div className="clinic-page clinic-page-guiaa clinic-inventory-page">
      <div className="clinic-page-header">
        <div>
          <p className="clinic-page-eyebrow">{t("shell.eyebrow")}</p>
          <div className="clinic-page-title-row">
            <h1>{t("inventory.title")}</h1>
            <ModuleHelpTip topicId="inventory" />
          </div>
          <p>{t("inventory.lead")}</p>
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus size={16} className="mr-1" /> {t("inventory.newProduct")}
        </Button>
      </div>

      {migrationHint && (
        <div className="info-message">
          Aplica la migración <code>20260617_inventory_billing.sql</code> en Supabase para activar inventario.
        </div>
      )}

      {summary && (
        <div className="clinic-report-kpi-grid clinic-inventory-kpis">
          <div className="clinic-report-kpi">
            <div className="clinic-report-kpi-head">
              <span className="clinic-report-kpi-icon"><Package size={18} /></span>
              <span className="clinic-report-kpi-label">{t("inventory.kpiProducts")}</span>
            </div>
            <div className="clinic-report-kpi-value">{summary.product_count ?? 0}</div>
          </div>
          <div className={`clinic-report-kpi${lowStockCount > 0 ? " clinic-report-kpi-warn" : ""}`}>
            <div className="clinic-report-kpi-head">
              <span className="clinic-report-kpi-icon"><AlertTriangle size={18} /></span>
              <span className="clinic-report-kpi-label">{t("inventory.kpiLowStock")}</span>
            </div>
            <div className="clinic-report-kpi-value">{lowStockCount}</div>
            {lowStockCount > 0 && (
              <p className="clinic-report-kpi-hint">{t("inventory.kpiLowHint")}</p>
            )}
          </div>
          <div className="clinic-report-kpi">
            <div className="clinic-report-kpi-head">
              <span className="clinic-report-kpi-icon"><DollarSign size={18} /></span>
              <span className="clinic-report-kpi-label">{t("inventory.kpiValue")}</span>
            </div>
            <div className="clinic-report-kpi-value">{formatMoney(summary.inventory_value, locale)}</div>
            <p className="clinic-report-kpi-hint">{t("inventory.kpiValueHint")}</p>
          </div>
        </div>
      )}

      <div className="clinic-toolbar">
        <div className="clinic-search">
          <Search size={16} />
          <Input
            placeholder={t("inventory.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button
          type="button"
          variant={lowStockOnly ? "default" : "secondary"}
          size="sm"
          className={lowStockOnly ? "clinic-inventory-filter clinic-inventory-filter--active" : "clinic-inventory-filter"}
          onClick={() => setLowStockOnly((v) => !v)}
        >
          <AlertTriangle size={14} className="mr-1" />
          {lowStockOnly ? t("inventory.filterAll") : t("inventory.filterLow")}
        </Button>
      </div>

      {loading ? (
        <ClinicTableSkeleton rows={6} cols={5} />
      ) : displayedProducts.length === 0 ? (
        <ClinicEmptyState
          icon={Package}
          title={lowStockOnly ? t("inventory.emptyLowTitle") : t("inventory.emptyTitle")}
          description={
            lowStockOnly ? t("inventory.emptyLowDesc") : t("inventory.emptyDesc")
          }
          actionLabel={lowStockOnly ? undefined : t("inventory.newProduct")}
          onAction={lowStockOnly ? undefined : openCreate}
        />
      ) : (
        <div className="clinic-table-wrap">
          <table className="clinic-table">
            <thead>
              <tr>
                <th>{t("inventory.colProduct")}</th>
                <th>{t("inventory.colSku")}</th>
                <th>{t("inventory.colStock")}</th>
                <th>{t("inventory.colMin")}</th>
                <th>{t("inventory.colPrice")}</th>
                <th aria-label={t("inventory.actionsAria")} />
              </tr>
            </thead>
            <tbody>
              {displayedProducts.map((p) => (
                <tr key={p.id} className={isLowStock(p) ? "clinic-row-warning" : ""}>
                  <td>
                    <strong>{p.name}</strong>
                    {p.category && <span className="clinic-inventory-category"> · {categoryLabel(p.category)}</span>}
                  </td>
                  <td>{p.sku || t("common.emDash")}</td>
                  <td>
                    {p.stock_qty} {p.unit}
                    {isLowStock(p) && <span className="clinic-badge-warning">{t("inventory.lowBadge")}</span>}
                  </td>
                  <td>{p.min_stock}</td>
                  <td>${Number(p.price || 0).toFixed(2)}</td>
                  <td className="clinic-table-actions">
                    <Button type="button" variant="ghost" size="sm" title={t("inventory.titleHistory")} onClick={() => openHistory(p)}>
                      <History size={14} />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" title={t("inventory.titleMovement")} onClick={() => openStock(p)}>
                      <PackageMinus size={14} />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(p)}>
                      <Pencil size={14} />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleDelete(p)}>
                      <Trash2 size={14} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clinicDialogClass("max-w-lg")}>
          <DialogHeader className="clinic-dialog-header">
            <DialogTitle>{editing ? t("inventory.editProduct") : t("inventory.newProduct")}</DialogTitle>
            <p className="clinic-dialog-subtitle">
              {editing ? t("inventory.editLead") : t("inventory.createLead")}
            </p>
          </DialogHeader>
          <form onSubmit={handleSave} className="clinic-form clinic-form-product">
            <div className="clinic-form-scroll">
              <div className="form-group">
                <Label htmlFor="product-name">{t("inventory.productName")}</Label>
                <Input
                  id="product-name"
                  autoFocus
                  placeholder={t("inventory.productNamePlaceholder")}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="clinic-form-grid-2">
                <div className="form-group">
                  <Label htmlFor="product-sku">{t("inventory.sku")}</Label>
                  <Input
                    id="product-sku"
                    placeholder={t("common.optional")}
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <Label>{t("inventory.category")}</Label>
                  <Select
                    value={form.category || "__none__"}
                    onValueChange={(v) => setForm({ ...form, category: v === "__none__" ? "" : v })}
                  >
                    <SelectTrigger><SelectValue placeholder={t("common.select")} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">{t("inventory.noCategory")}</SelectItem>
                      {categoryOptions.map((c) => (
                        <SelectItem key={c} value={c}>{categoryLabel(c)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="clinic-form-grid-2">
                <div className="form-group">
                  <Label>{t("inventory.unit")}</Label>
                  <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {unitOptions.map((u) => (
                        <SelectItem key={u} value={u}>{unitLabel(u)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="form-group">
                  <Label htmlFor="product-min-stock">{t("inventory.minStock")}</Label>
                  <Input
                    id="product-min-stock"
                    type="number"
                    min="0"
                    step="0.001"
                    placeholder="0"
                    value={form.min_stock}
                    onChange={(e) => setForm({ ...form, min_stock: e.target.value })}
                  />
                </div>
              </div>

              {!editing && (
                <div className="form-group">
                  <Label htmlFor="product-stock">{t("inventory.initialStock")}</Label>
                  <Input
                    id="product-stock"
                    type="number"
                    min="0"
                    step="0.001"
                    placeholder="0"
                    value={form.stock_qty}
                    onChange={(e) => setForm({ ...form, stock_qty: e.target.value })}
                  />
                </div>
              )}

              <div className="clinic-form-section-label">{t("inventory.pricesSection")}</div>
              <div className="clinic-form-grid-2">
                <div className="form-group">
                  <Label htmlFor="product-price">{t("inventory.salePrice")}</Label>
                  <Input
                    id="product-price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <Label htmlFor="product-cost">{t("inventory.cost")}</Label>
                  <Input
                    id="product-cost"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.cost}
                    onChange={(e) => setForm({ ...form, cost: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <Label htmlFor="product-notes">{t("clients.notes")}</Label>
                <Textarea
                  id="product-notes"
                  placeholder={t("inventory.notesPlaceholder")}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter className="clinic-dialog-footer">
              <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>{t("common.cancel")}</Button>
              <Button type="submit" disabled={saving}>{saving ? t("common.saving") : t("inventory.saveProduct")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={stockOpen} onOpenChange={setStockOpen}>
        <DialogContent className={clinicDialogClass("max-w-sm")}>
          <DialogHeader className="clinic-dialog-header">
            <DialogTitle>{t("inventory.stockMovementTitle")}</DialogTitle>
            <p className="clinic-dialog-subtitle">{stockProduct?.name}</p>
          </DialogHeader>
          <form onSubmit={handleStock} className="clinic-form">
            <div className="clinic-form-scroll clinic-form-scroll-compact">
            <div className="form-group">
              <Label>{t("inventory.movementType")}</Label>
              <Select value={stockForm.movement_type} onValueChange={(v) => setStockForm({ ...stockForm, movement_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">{movementLabel("in")}</SelectItem>
                  <SelectItem value="out">{movementLabel("out")}</SelectItem>
                  <SelectItem value="adjustment">{t("inventory.movementAdjustment")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="form-group">
              <Label>{t("inventory.quantity")}</Label>
              <Input type="number" step="0.001" value={stockForm.quantity} onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })} required />
            </div>
            <div className="form-group">
              <Label>{t("inventory.reason")}</Label>
              <Input value={stockForm.reason} onChange={(e) => setStockForm({ ...stockForm, reason: e.target.value })} placeholder={t("inventory.reasonPlaceholder")} />
            </div>
            </div>
            <DialogFooter className="clinic-dialog-footer">
              <Button type="button" variant="secondary" onClick={() => setStockOpen(false)}>{t("common.cancel")}</Button>
              <Button type="submit" disabled={saving}>{saving ? t("inventory.registering") : t("inventory.registerMovement")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className={clinicDialogClass("max-w-md")}>
          <DialogHeader className="clinic-dialog-header">
            <DialogTitle>{t("inventory.historyTitle")}</DialogTitle>
            <p className="clinic-dialog-subtitle">
              {t("inventory.historySubtitle", {
                name: historyProduct?.name,
                qty: historyProduct?.stock_qty,
                unit: historyProduct?.unit,
              })}
            </p>
          </DialogHeader>
          {historyLoading ? (
            <p className="clinic-muted">{t("common.loading")}</p>
          ) : movements.length === 0 ? (
            <p className="clinic-muted">{t("inventory.noMovements")}</p>
          ) : (
            <ul className="clinic-inventory-history">
              {movements.map((m) => (
                <li key={m.id} className={`clinic-inventory-history-item type-${m.movement_type}`}>
                  <div className="clinic-inventory-history-top">
                    <strong>{movementLabel(m.movement_type)}</strong>
                    <span>{m.quantity} {historyProduct?.unit || "pza"}</span>
                  </div>
                  {m.reason && <p className="clinic-muted">{m.reason}</p>}
                  <time className="clinic-muted">
                    {m.created_at ? new Date(m.created_at).toLocaleString(locale) : ""}
                  </time>
                </li>
              ))}
            </ul>
          )}
          <DialogFooter className="clinic-dialog-footer">
            {historyProduct && (
              <Button type="button" onClick={() => { setHistoryOpen(false); openStock(historyProduct); }}>
                <PackageMinus size={14} className="mr-1" /> {t("inventory.newMovement")}
              </Button>
            )}
            <Button type="button" variant="secondary" onClick={() => setHistoryOpen(false)}>{t("common.close")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmActionDialog {...dialogProps} />
    </div>
  );
}
