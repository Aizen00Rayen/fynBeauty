import { useEffect, useState } from "react";
import { Search, Eye } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { api, mediaUrl } from "../../services/api";
import { formatPrice } from "../../utils/formatPrice";
import { StatusBadge, STATUS_FLOW, ORDER_STATUS } from "../../utils/orderStatus";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "../../components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../components/ui/select";

const STATUSES = ["pending", "confirmed", "preparing", "shipped", "delivered", "cancelled"];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [notes, setNotes] = useState("");

  const load = () => {
    const params = {};
    if (search) params.search = search;
    if (statusFilter !== "all") params.status = statusFilter;
    api.get("/admin/orders", { params }).then((r) => setOrders(r.data));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [statusFilter]);
  useEffect(() => { const t = setTimeout(load, 350); return () => clearTimeout(t); /* eslint-disable-next-line */ }, [search]);

  const openDetail = (o) => { setSelected(o); setNewStatus(o.status); setNotes(o.notes || ""); };

  const updateStatus = async () => {
    try {
      await api.put(`/admin/orders/${selected.id}/status`, { status: newStatus });
      toast.success("Statut mis à jour");
      load();
      setSelected({ ...selected, status: newStatus });
    } catch { toast.error("Erreur"); }
  };
  const saveNotes = async () => {
    try { await api.put(`/admin/orders/${selected.id}/notes`, { notes }); toast.success("Note enregistrée"); } catch { toast.error("Erreur"); }
  };

  const exportCsv = () => {
    const rows = [["Commande", "Client", "Téléphone", "Wilaya", "Total", "Statut", "Date"]];
    orders.forEach((o) => rows.push([o.order_number, o.customer_name, o.customer_phone, o.wilaya, o.total, ORDER_STATUS[o.status]?.label, o.created_at?.slice(0, 10)]));
    const csv = rows.map((r) => r.map((c) => `"${c ?? ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "commandes-fyn.csv"; a.click();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div><p className="label-eyebrow text-fyn-gold mb-1">Gestion</p><h1 className="font-display text-fyn-text" style={{ fontSize: "2.5rem" }}>Commandes <span className="text-fyn-muted text-2xl">({orders.length})</span></h1></div>
        <button onClick={exportCsv} className="btn-fyn-secondary" style={{ height: 44 }}>Exporter CSV</button>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-fyn-border-strong rounded-pill px-4 flex-1 min-w-[220px]" style={{ height: 44 }}>
          <Search size={16} className="text-fyn-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher (n°, client, téléphone)" className="flex-1 bg-transparent outline-none text-sm" data-testid="order-search" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] rounded-pill border-fyn-border-strong" style={{ height: 44 }} data-testid="order-status-filter"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{ORDER_STATUS[s].label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-2xl border border-fyn-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-fyn-muted label-eyebrow border-b border-fyn-border bg-fyn-bg"><th className="p-4">Commande</th><th className="p-4">Client</th><th className="p-4">Wilaya</th><th className="p-4">Total</th><th className="p-4">Statut</th><th className="p-4">Date</th><th className="p-4"></th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-fyn-border/60 hover:bg-fyn-bg" data-testid={`admin-order-${o.order_number}`}>
                  <td className="p-4 font-medium text-fyn-text">#{o.order_number}</td>
                  <td className="p-4 text-fyn-muted">{o.customer_name}<br /><span className="text-xs">{o.customer_phone}</span></td>
                  <td className="p-4 text-fyn-muted">{o.wilaya}</td>
                  <td className="p-4 text-fyn-pink font-medium">{formatPrice(o.total)}</td>
                  <td className="p-4"><StatusBadge status={o.status} /></td>
                  <td className="p-4 text-fyn-muted text-xs">{o.created_at ? format(new Date(o.created_at), "d MMM yyyy", { locale: fr }) : ""}</td>
                  <td className="p-4"><button onClick={() => openDetail(o)} className="grid place-items-center rounded-lg hover:bg-fyn-pink-light hover:text-fyn-pink transition-colors" style={{ width: 36, height: 36 }} data-testid={`view-order-${o.order_number}`}><Eye size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && <p className="text-center text-fyn-muted py-12">Aucune commande</p>}
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader><DialogTitle className="font-display text-2xl">Commande #{selected.order_number}</DialogTitle></DialogHeader>
              <div className="space-y-5">
                {/* Status stepper */}
                <div className="flex items-center justify-between bg-fyn-bg rounded-xl p-4">
                  {STATUS_FLOW.map((s, i) => {
                    const reached = STATUS_FLOW.indexOf(selected.status) >= i;
                    return (
                      <div key={s} className="flex flex-col items-center flex-1">
                        <div className="rounded-full grid place-items-center" style={{ width: 26, height: 26, background: reached ? "#E8196A" : "#EDE8E3", color: "#fff", fontSize: 12 }}>{i + 1}</div>
                        <span className="text-[10px] mt-1.5 text-center" style={{ color: reached ? "#1C1C1E" : "#6E6E73" }}>{ORDER_STATUS[s].label}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div className="bg-white border border-fyn-border rounded-xl p-4"><p className="label-eyebrow text-fyn-muted mb-2">Client</p><p className="text-fyn-text">{selected.customer_name}</p><p className="text-fyn-muted">{selected.customer_phone}</p>{selected.customer_email && <p className="text-fyn-muted">{selected.customer_email}</p>}</div>
                  <div className="bg-white border border-fyn-border rounded-xl p-4"><p className="label-eyebrow text-fyn-muted mb-2">Livraison</p><p className="text-fyn-text">{selected.wilaya}{selected.commune ? `, ${selected.commune}` : ""}</p><p className="text-fyn-muted">{selected.address}</p>{selected.delivery_notes && <p className="text-fyn-muted italic">"{selected.delivery_notes}"</p>}</div>
                </div>

                <div className="bg-white border border-fyn-border rounded-xl p-4">
                  <p className="label-eyebrow text-fyn-muted mb-3">Articles</p>
                  <div className="space-y-3">
                    {selected.items.map((it, i) => (
                      <div key={i} className="flex gap-3 items-center">
                        <div className="rounded-lg overflow-hidden bg-fyn-gold-light" style={{ width: 40, height: 46 }}><img src={mediaUrl(it.product_image)} alt={it.product_name} className="w-full h-full object-cover" /></div>
                        <div className="flex-1"><p className="text-sm text-fyn-text">{it.product_name}</p><p className="text-xs text-fyn-muted">x{it.quantity}{it.shade ? ` · ${it.shade}` : ""}</p></div>
                        <span className="text-sm font-medium">{formatPrice(it.total_price)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-fyn-border mt-3 pt-3 space-y-1.5 text-sm">
                    <div className="flex justify-between text-fyn-muted"><span>Sous-total</span><span>{formatPrice(selected.subtotal)}</span></div>
                    {selected.discount_amount > 0 && <div className="flex justify-between" style={{ color: "#2E7D32" }}><span>Réduction {selected.coupon_code ? `(${selected.coupon_code})` : ""}</span><span>-{formatPrice(selected.discount_amount)}</span></div>}
                    <div className="flex justify-between text-fyn-muted"><span>Livraison</span><span>{selected.delivery_fee === 0 ? "Gratuite" : formatPrice(selected.delivery_fee)}</span></div>
                    <div className="flex justify-between font-display text-lg text-fyn-text pt-1"><span>Total</span><span className="text-fyn-pink">{formatPrice(selected.total)}</span></div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 items-end">
                  <div>
                    <label className="label-eyebrow text-fyn-muted block mb-2">Mettre à jour le statut</label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger className="border-[1.5px] border-fyn-border-strong rounded-md" style={{ height: 46 }} data-testid="status-update-select"><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{ORDER_STATUS[s].label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <button onClick={updateStatus} className="btn-fyn-primary" data-testid="status-update-button">Mettre à jour</button>
                </div>

                <div>
                  <label className="label-eyebrow text-fyn-muted block mb-2">Note interne</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full bg-white border-[1.5px] border-fyn-border-strong rounded-md px-3 py-2 outline-none focus:border-fyn-pink" />
                  <button onClick={saveNotes} className="btn-fyn-ghost mt-2">Enregistrer la note</button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
