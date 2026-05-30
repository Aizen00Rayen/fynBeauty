import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, apiError } from "../../services/api";
import { formatPrice } from "../../utils/formatPrice";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "../../components/ui/dialog";
import { Switch } from "../../components/ui/switch";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";

const inputCls = "w-full bg-white border-[1.5px] border-fyn-border-strong rounded-md px-3 outline-none focus:border-fyn-pink transition-colors";
const empty = { code: "", description: "", discount_type: "percentage", discount_value: "", min_order_amount: "", max_uses: "", is_active: true, expires_at: "" };

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = () => api.get("/admin/coupons").then((r) => setCoupons(r.data));
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (c) => {
    setEditing(c);
    setForm({ code: c.code, description: c.description || "", discount_type: c.discount_type, discount_value: c.discount_value, min_order_amount: c.min_order_amount || "", max_uses: c.max_uses ?? "", is_active: c.is_active, expires_at: c.expires_at ? c.expires_at.slice(0, 10) : "" });
    setOpen(true);
  };

  const save = async () => {
    if (!form.code || !form.discount_value) { toast.error("Code et valeur requis"); return; }
    setSaving(true);
    const payload = {
      code: form.code, description: form.description, discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value), min_order_amount: parseFloat(form.min_order_amount || 0),
      max_uses: form.max_uses ? parseInt(form.max_uses) : null, is_active: form.is_active,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
    };
    try {
      if (editing) await api.put(`/admin/coupons/${editing.id}`, payload);
      else await api.post("/admin/coupons", payload);
      toast.success(editing ? "Coupon mis à jour" : "Coupon créé");
      setOpen(false); load();
    } catch (err) { toast.error(apiError(err.response?.data?.detail) || "Erreur"); } finally { setSaving(false); }
  };

  const toggle = async (c) => { try { await api.patch(`/admin/coupons/${c.id}/toggle`); load(); } catch { toast.error("Erreur"); } };
  const del = async (id) => { try { await api.delete(`/admin/coupons/${id}`); toast.success("Coupon supprimé"); load(); } catch { toast.error("Erreur"); } };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div><p className="label-eyebrow text-fyn-gold mb-1">Promotions</p><h1 className="font-display text-fyn-text" style={{ fontSize: "2.5rem" }}>Coupons <span className="text-fyn-muted text-2xl">({coupons.length})</span></h1></div>
        <button onClick={openNew} className="btn-fyn-primary" data-testid="add-coupon-button"><Plus size={18} /> Ajouter</button>
      </div>

      <div className="bg-white rounded-2xl border border-fyn-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-fyn-muted label-eyebrow border-b border-fyn-border bg-fyn-bg"><th className="p-4">Code</th><th className="p-4">Type</th><th className="p-4">Valeur</th><th className="p-4">Min.</th><th className="p-4">Utilisations</th><th className="p-4">Actif</th><th className="p-4">Actions</th></tr></thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-b border-fyn-border/60 hover:bg-fyn-bg" data-testid={`admin-coupon-${c.code}`}>
                  <td className="p-4"><span className="font-mono font-medium text-fyn-text bg-fyn-pink-light px-2.5 py-1 rounded-md">{c.code}</span><p className="text-xs text-fyn-muted mt-1">{c.description}</p></td>
                  <td className="p-4 text-fyn-muted">{c.discount_type === "percentage" ? "Pourcentage" : "Montant fixe"}</td>
                  <td className="p-4 text-fyn-pink font-medium">{c.discount_type === "percentage" ? `${c.discount_value}%` : formatPrice(c.discount_value)}</td>
                  <td className="p-4 text-fyn-muted">{c.min_order_amount ? formatPrice(c.min_order_amount) : "—"}</td>
                  <td className="p-4 text-fyn-muted">{c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ""}</td>
                  <td className="p-4"><Switch checked={c.is_active} onCheckedChange={() => toggle(c)} data-testid={`toggle-coupon-${c.code}`} /></td>
                  <td className="p-4"><div className="flex gap-2"><button onClick={() => openEdit(c)} className="grid place-items-center rounded-lg hover:bg-fyn-pink-light hover:text-fyn-pink" style={{ width: 36, height: 36 }}><Pencil size={15} /></button><button onClick={() => del(c.id)} className="grid place-items-center rounded-lg hover:bg-fyn-pink-light hover:text-fyn-pink" style={{ width: 36, height: 36 }}><Trash2 size={15} /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
          {coupons.length === 0 && <p className="text-center text-fyn-muted py-12">Aucun coupon</p>}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-display text-2xl">{editing ? "Modifier le coupon" : "Nouveau coupon"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="label-eyebrow text-fyn-muted block mb-1.5">Code</label><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className={`${inputCls} uppercase font-mono`} style={{ height: 46 }} data-testid="coupon-form-code" /></div>
            <div><label className="label-eyebrow text-fyn-muted block mb-1.5">Description</label><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} style={{ height: 46 }} /></div>
            <div>
              <label className="label-eyebrow text-fyn-muted block mb-2">Type de réduction</label>
              <RadioGroup value={form.discount_type} onValueChange={(v) => setForm({ ...form, discount_type: v })} className="flex gap-6">
                <label className="flex items-center gap-2"><RadioGroupItem value="percentage" /> Pourcentage (%)</label>
                <label className="flex items-center gap-2"><RadioGroupItem value="fixed" /> Montant fixe (DZD)</label>
              </RadioGroup>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label-eyebrow text-fyn-muted block mb-1.5">Valeur</label><input type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} className={inputCls} style={{ height: 46 }} data-testid="coupon-form-value" /></div>
              <div><label className="label-eyebrow text-fyn-muted block mb-1.5">Commande min. (DZD)</label><input type="number" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })} className={inputCls} style={{ height: 46 }} /></div>
              <div><label className="label-eyebrow text-fyn-muted block mb-1.5">Utilisations max.</label><input type="number" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} placeholder="Illimité" className={inputCls} style={{ height: 46 }} /></div>
              <div><label className="label-eyebrow text-fyn-muted block mb-1.5">Expiration</label><input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className={inputCls} style={{ height: 46 }} /></div>
            </div>
            <label className="flex items-center gap-2.5"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /><span className="text-sm">Actif</span></label>
          </div>
          <DialogFooter>
            <button onClick={() => setOpen(false)} className="btn-fyn-ghost">Annuler</button>
            <button onClick={save} disabled={saving} className="btn-fyn-primary" data-testid="coupon-form-save">{saving ? "..." : "Enregistrer"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
