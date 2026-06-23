import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, PackageMinus, History, AlertTriangle, Package, DollarSign } from "lucide-react";
import "./clinicPageShared.css";
import {
  ClinicTableSkeleton,
  ClinicEmptyState,
  clinicDialogClass,
} from "../../components/clinic/ClinicPageUi";
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
import { notifyError, notifySuccess } from "../../lib/appToast";
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

const UNITS = [
  { value: "pza", label: "Pieza (pza)" },
  { value: "caja", label: "Caja" },
  { value: "frasco", label: "Frasco" },
  { value: "ml", label: "Mililitros (ml)" },
  { value: "L", label: "Litros (L)" },
  { value: "g", label: "Gramos (g)" },
  { value: "kg", label: "Kilogramos (kg)" },
];

const MOVEMENT_LABELS = {
  in: "Entrada",
  out: "Salida",
  adjustment: "Ajuste",
};

function formatMoney(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function InventoryPage() {
  const { veterinarian } = useVet();
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);
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
    if (!veterinarian?.id) return;
    setLoading(true);
    setMigrationHint(false);
    try {
      const [data, summaryData] = await Promise.all([
        fetchProducts(veterinarian.id, search),
        fetchInventorySummary(veterinarian.id).catch(() => null),
      ]);
      setProducts(data.products || []);
      setSummary(summaryData);
      if (!data.products?.length && !search) {
        setMigrationHint(false);
      }
    } catch (err) {
      if (String(err.message).includes("no configurado") || String(err.message).includes("PGRST")) {
        setMigrationHint(true);
        setProducts([]);
      } else {
        notifyError(err.message);
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
        notifySuccess("Producto actualizado.");
      } else {
        await createProduct(veterinarian.id, payload);
        notifySuccess("Producto registrado.");
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
      notifySuccess("Movimiento de stock registrado.");
      setStockOpen(false);
      load();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`¿Eliminar "${product.name}"?`)) return;
    try {
      await deleteProduct(veterinarian.id, product.id);
      notifySuccess("Producto eliminado.");
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

  const unitOptions = form.unit && !UNITS.some((u) => u.value === form.unit)
    ? [...UNITS, { value: form.unit, label: form.unit }]
    : UNITS;

  return (
    <div className="clinic-page clinic-page-guiaa">
      <div className="clinic-page-header">
        <div>
          <p className="clinic-page-eyebrow">Consultorio</p>
          <h1>Inventario</h1>
          <p>Productos, insumos y control de stock vinculado a ventas.</p>
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus size={16} className="mr-1" /> Nuevo producto
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
              <span className="clinic-report-kpi-label">Productos</span>
            </div>
            <div className="clinic-report-kpi-value">{summary.product_count ?? 0}</div>
          </div>
          <div className={`clinic-report-kpi${lowStockCount > 0 ? " clinic-report-kpi-warn" : ""}`}>
            <div className="clinic-report-kpi-head">
              <span className="clinic-report-kpi-icon"><AlertTriangle size={18} /></span>
              <span className="clinic-report-kpi-label">Stock bajo</span>
            </div>
            <div className="clinic-report-kpi-value">{lowStockCount}</div>
            {lowStockCount > 0 && (
              <p className="clinic-report-kpi-hint">Revisa reposición</p>
            )}
          </div>
          <div className="clinic-report-kpi">
            <div className="clinic-report-kpi-head">
              <span className="clinic-report-kpi-icon"><DollarSign size={18} /></span>
              <span className="clinic-report-kpi-label">Valor estimado</span>
            </div>
            <div className="clinic-report-kpi-value">{formatMoney(summary.inventory_value)}</div>
            <p className="clinic-report-kpi-hint">Costo × stock</p>
          </div>
        </div>
      )}

      <div className="clinic-toolbar">
        <div className="clinic-search">
          <Search size={16} />
          <Input
            placeholder="Buscar por nombre, SKU o categoría..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button
          type="button"
          variant={lowStockOnly ? "default" : "secondary"}
          size="sm"
          onClick={() => setLowStockOnly((v) => !v)}
        >
          <AlertTriangle size={14} className="mr-1" />
          {lowStockOnly ? "Ver todos" : "Solo stock bajo"}
        </Button>
      </div>

      {loading ? (
        <ClinicTableSkeleton rows={6} cols={5} />
      ) : displayedProducts.length === 0 ? (
        <ClinicEmptyState
          icon={Package}
          title={lowStockOnly ? "Sin alertas de stock" : "Sin productos registrados"}
          description={
            lowStockOnly
              ? "Todos los productos están por encima del mínimo configurado."
              : "Agrega medicamentos, insumos o servicios para vincularlos a ventas."
          }
          actionLabel={lowStockOnly ? undefined : "Nuevo producto"}
          onAction={lowStockOnly ? undefined : openCreate}
        />
      ) : (
        <div className="clinic-table-wrap">
          <table className="clinic-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>SKU</th>
                <th>Stock</th>
                <th>Mínimo</th>
                <th>Precio</th>
                <th aria-label="Acciones" />
              </tr>
            </thead>
            <tbody>
              {displayedProducts.map((p) => (
                <tr key={p.id} className={isLowStock(p) ? "clinic-row-warning" : ""}>
                  <td>
                    <strong>{p.name}</strong>
                    {p.category && <span className="clinic-muted"> · {p.category}</span>}
                  </td>
                  <td>{p.sku || "—"}</td>
                  <td>
                    {p.stock_qty} {p.unit}
                    {isLowStock(p) && <span className="clinic-badge-warning">Bajo</span>}
                  </td>
                  <td>{p.min_stock}</td>
                  <td>${Number(p.price || 0).toFixed(2)}</td>
                  <td className="clinic-table-actions">
                    <Button type="button" variant="ghost" size="sm" title="Historial" onClick={() => openHistory(p)}>
                      <History size={14} />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" title="Movimiento" onClick={() => openStock(p)}>
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
            <DialogTitle>{editing ? "Editar producto" : "Nuevo producto"}</DialogTitle>
            <p className="clinic-dialog-subtitle">
              {editing ? "Actualiza datos, precios y alertas de stock." : "Registra un insumo o producto para venta y control de inventario."}
            </p>
          </DialogHeader>
          <form onSubmit={handleSave} className="clinic-form clinic-form-product">
            <div className="clinic-form-scroll">
              <div className="form-group">
                <Label htmlFor="product-name">Nombre del producto *</Label>
                <Input
                  id="product-name"
                  autoFocus
                  placeholder="Ej. Amoxicilina 250 mg"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="clinic-form-grid-2">
                <div className="form-group">
                  <Label htmlFor="product-sku">SKU / Código</Label>
                  <Input
                    id="product-sku"
                    placeholder="Opcional"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <Label>Categoría</Label>
                  <Select
                    value={form.category || "__none__"}
                    onValueChange={(v) => setForm({ ...form, category: v === "__none__" ? "" : v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sin categoría</SelectItem>
                      {categoryOptions.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="clinic-form-grid-2">
                <div className="form-group">
                  <Label>Unidad</Label>
                  <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {unitOptions.map((u) => (
                        <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="form-group">
                  <Label htmlFor="product-min-stock">Stock mínimo (alerta)</Label>
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
                  <Label htmlFor="product-stock">Stock inicial</Label>
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

              <div className="clinic-form-section-label">Precios</div>
              <div className="clinic-form-grid-2">
                <div className="form-group">
                  <Label htmlFor="product-price">Precio de venta</Label>
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
                  <Label htmlFor="product-cost">Costo</Label>
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
                <Label htmlFor="product-notes">Notas</Label>
                <Textarea
                  id="product-notes"
                  placeholder="Lote, proveedor, indicaciones..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter className="clinic-dialog-footer">
              <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar producto"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={stockOpen} onOpenChange={setStockOpen}>
        <DialogContent className={clinicDialogClass("max-w-sm")}>
          <DialogHeader className="clinic-dialog-header">
            <DialogTitle>Movimiento de stock</DialogTitle>
            <p className="clinic-dialog-subtitle">{stockProduct?.name}</p>
          </DialogHeader>
          <form onSubmit={handleStock} className="clinic-form">
            <div className="clinic-form-scroll clinic-form-scroll-compact">
            <div className="form-group">
              <Label>Tipo</Label>
              <Select value={stockForm.movement_type} onValueChange={(v) => setStockForm({ ...stockForm, movement_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Entrada</SelectItem>
                  <SelectItem value="out">Salida</SelectItem>
                  <SelectItem value="adjustment">Ajuste (cantidad final)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="form-group">
              <Label>Cantidad</Label>
              <Input type="number" step="0.001" value={stockForm.quantity} onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })} required />
            </div>
            <div className="form-group">
              <Label>Motivo</Label>
              <Input value={stockForm.reason} onChange={(e) => setStockForm({ ...stockForm, reason: e.target.value })} placeholder="Compra, consumo, merma..." />
            </div>
            </div>
            <DialogFooter className="clinic-dialog-footer">
              <Button type="button" variant="secondary" onClick={() => setStockOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? "Registrando..." : "Registrar movimiento"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className={clinicDialogClass("max-w-md")}>
          <DialogHeader className="clinic-dialog-header">
            <DialogTitle>Historial de movimientos</DialogTitle>
            <p className="clinic-dialog-subtitle">
              {historyProduct?.name} — Stock actual: {historyProduct?.stock_qty} {historyProduct?.unit}
            </p>
          </DialogHeader>
          {historyLoading ? (
            <p className="clinic-muted">Cargando...</p>
          ) : movements.length === 0 ? (
            <p className="clinic-muted">Sin movimientos registrados.</p>
          ) : (
            <ul className="clinic-inventory-history">
              {movements.map((m) => (
                <li key={m.id} className={`clinic-inventory-history-item type-${m.movement_type}`}>
                  <div className="clinic-inventory-history-top">
                    <strong>{MOVEMENT_LABELS[m.movement_type] || m.movement_type}</strong>
                    <span>{m.quantity} {historyProduct?.unit || "pza"}</span>
                  </div>
                  {m.reason && <p className="clinic-muted">{m.reason}</p>}
                  <time className="clinic-muted">
                    {m.created_at ? new Date(m.created_at).toLocaleString("es-MX") : ""}
                  </time>
                </li>
              ))}
            </ul>
          )}
          <DialogFooter className="clinic-dialog-footer">
            {historyProduct && (
              <Button type="button" onClick={() => { setHistoryOpen(false); openStock(historyProduct); }}>
                <PackageMinus size={14} className="mr-1" /> Nuevo movimiento
              </Button>
            )}
            <Button type="button" variant="secondary" onClick={() => setHistoryOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
