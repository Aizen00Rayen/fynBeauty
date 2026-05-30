import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Search, ToggleLeft, ToggleRight, X, Save } from "lucide-react";
import { toast } from "sonner";
import { api, apiError } from "../../services/api";
import { formatPrice } from "../../utils/formatPrice";
import { Skeleton } from "../../components/ui/skeleton";

const EMPTY_FORM = { code: "", name: "", home_price: "600", office_price: "400", is_active: true };

function WilayaModal({ initial, onClose, onSaved }) {
  const isNew = !initial;
  const [form, setForm] = useState(
    initial
      ? { ...initial, home_price: String(initial.home_price), office_price: String(initial.office_price) }
      : { ...EMPTY_FORM }
  );
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const homePrice = parseFloat(form.home_price);
    const officePrice = parseFloat(form.office_price);
    if (!form.name.trim()) return toast.error("Nom requis");
    if (isNaN(homePrice) || homePrice < 0) return toast.error("Prix domicile invalide");
    if (isNaN(officePrice) || officePrice < 0) return toast.error("Prix bureau invalide");

    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        home_price: homePrice,
        office_price: officePrice,
        is_active: form.is_active,
      };
      let data;
      if (isNew) {
        body.code = form.code.trim();
        ({ data } = await api.post("/admin/wilayas", body));
      } else {
        ({ data } = await api.put(`/admin/wilayas/${initial.code}`, body));
      }
      toast.success(isNew ? "Wilaya ajoutée" : "Wilaya mise à jour");
      onSaved(data);
    } catch (err) {
      toast.error(apiError(err.response?.data?.detail) || "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full border border-fyn-border-strong rounded-lg px-3 text-sm text-fyn-text outline-none focus:border-fyn-pink transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-fyn-border">
          <h2 className="font-display text-xl text-fyn-text">
            {isNew ? "Ajouter une wilaya" : `Modifier — ${initial.name}`}
          </h2>
          <button onClick={onClose} className="text-fyn-muted hover:text-fyn-text"><X size={20} /></button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          {isNew && (
            <div>
              <label className="label-eyebrow text-fyn-muted block mb-1.5">Code (ex: 01)</label>
              <input
                required value={form.code} onChange={set("code")} maxLength={3}
                placeholder="01" className={inputCls} style={{ height: 40 }}
              />
            </div>
          )}
          <div>
            <label className="label-eyebrow text-fyn-muted block mb-1.5">Nom de la wilaya</label>
            <input required value={form.name} onChange={set("name")} className={inputCls} style={{ height: 40 }} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-eyebrow text-fyn-muted block mb-1.5">Domicile (DZD)</label>
              <input
                type="number" min="0" step="50" required
                value={form.home_price} onChange={set("home_price")}
                className={inputCls} style={{ height: 40 }}
              />
            </div>
            <div>
              <label className="label-eyebrow text-fyn-muted block mb-1.5">Bureau / Stop Desk (DZD)</label>
              <input
                type="number" min="0" step="50" required
                value={form.office_price} onChange={set("office_price")}
                className={inputCls} style={{ height: 40 }}
              />
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input type="checkbox" checked={form.is_active} onChange={set("is_active")} className="accent-fyn-pink w-4 h-4" />
            <span className="text-sm text-fyn-text">Wilaya active (visible au checkout)</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-fyn-ghost flex-1 justify-center">Annuler</button>
            <button type="submit" disabled={saving} className="btn-fyn-primary flex-1 justify-center">
              <Save size={15} /> {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirm({ wilaya, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);

  const confirm = async () => {
    setDeleting(true);
    try {
      await api.delete(`/admin/wilayas/${wilaya.code}`);
      toast.success(`${wilaya.name} supprimée`);
      onDeleted(wilaya.code);
    } catch (err) {
      toast.error(apiError(err.response?.data?.detail) || "Erreur");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h2 className="font-display text-xl text-fyn-text mb-2">Supprimer la wilaya ?</h2>
        <p className="text-fyn-muted text-sm mb-6">
          <strong>{wilaya.code} — {wilaya.name}</strong> sera définitivement supprimée. Cette action est irréversible.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-fyn-ghost flex-1 justify-center">Annuler</button>
          <button
            onClick={confirm} disabled={deleting}
            className="flex-1 flex items-center justify-center gap-2 rounded-pill font-body text-sm font-medium transition-colors"
            style={{ background: "#C62828", color: "#fff", height: 44, padding: "0 24px" }}
          >
            <Trash2 size={15} /> {deleting ? "Suppression..." : "Supprimer"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminLivraison() {
  const [wilayas, setWilayas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // null | { type: "add" } | { type: "edit", wilaya } | { type: "delete", wilaya }

  const load = useCallback(() => {
    setLoading(true);
    api.get("/admin/wilayas")
      .then((r) => setWilayas(r.data))
      .catch(() => toast.error("Impossible de charger les wilayas"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSaved = (updated) => {
    setWilayas((prev) => {
      const exists = prev.find((w) => w.code === updated.code);
      return exists
        ? prev.map((w) => (w.code === updated.code ? updated : w))
        : [...prev, updated].sort((a, b) => a.code.localeCompare(b.code));
    });
    setModal(null);
  };

  const handleDeleted = (code) => {
    setWilayas((prev) => prev.filter((w) => w.code !== code));
    setModal(null);
  };

  const filtered = wilayas.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.code.includes(search)
  );

  return (
    <div>
      {/* Modals */}
      {modal?.type === "add" && (
        <WilayaModal onClose={() => setModal(null)} onSaved={handleSaved} />
      )}
      {modal?.type === "edit" && (
        <WilayaModal initial={modal.wilaya} onClose={() => setModal(null)} onSaved={handleSaved} />
      )}
      {modal?.type === "delete" && (
        <DeleteConfirm wilaya={modal.wilaya} onClose={() => setModal(null)} onDeleted={handleDeleted} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <p className="label-eyebrow text-fyn-gold mb-1">Configuration</p>
          <h1 className="font-display text-fyn-text" style={{ fontSize: "2.5rem" }}>Livraison par wilaya</h1>
          <p className="text-fyn-muted text-sm mt-1">
            Prix de livraison à domicile et au bureau pour chaque wilaya. Livraison gratuite automatique dès {formatPrice(8000)}.
          </p>
        </div>
        <button
          onClick={() => setModal({ type: "add" })}
          className="btn-fyn-primary shrink-0"
        >
          <Plus size={18} /> Ajouter une wilaya
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-fyn-border p-4 mb-5 flex items-center gap-3">
        <Search size={18} className="text-fyn-muted shrink-0" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par numéro ou nom..."
          className="flex-1 outline-none text-sm text-fyn-text font-body"
        />
        <span className="text-xs text-fyn-muted shrink-0">{filtered.length} / {wilayas.length}</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-fyn-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-fyn-muted label-eyebrow border-b border-fyn-border bg-fyn-bg">
                <th className="px-5 py-3 w-12">#</th>
                <th className="px-5 py-3">Wilaya</th>
                <th className="px-5 py-3 text-right">Domicile</th>
                <th className="px-5 py-3 text-right">Bureau / Stop Desk</th>
                <th className="px-5 py-3 text-center">Statut</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-fyn-border/60">
                      <td className="px-5 py-3" colSpan={6}><Skeleton className="h-5 w-full" /></td>
                    </tr>
                  ))
                : filtered.map((w) => (
                    <tr key={w.code} className={`border-b border-fyn-border/60 hover:bg-fyn-bg/50 ${!w.is_active ? "opacity-50" : ""}`}>
                      <td className="px-5 py-3 text-fyn-muted font-mono text-xs">{w.code}</td>
                      <td className="px-5 py-3 font-body text-fyn-text font-medium">{w.name}</td>
                      <td className="px-5 py-3 text-right text-fyn-text">{formatPrice(w.home_price)}</td>
                      <td className="px-5 py-3 text-right text-fyn-text">{formatPrice(w.office_price)}</td>
                      <td className="px-5 py-3 text-center">
                        {w.is_active
                          ? <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "#E8F5E9", color: "#2E7D32" }}><ToggleRight size={13} /> Active</span>
                          : <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-fyn-bg text-fyn-muted"><ToggleLeft size={13} /> Inactive</span>
                        }
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setModal({ type: "edit", wilaya: w })}
                            className="grid place-items-center rounded-lg bg-fyn-bg hover:bg-fyn-border text-fyn-muted hover:text-fyn-text transition-colors"
                            style={{ width: 32, height: 32 }} title="Modifier"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setModal({ type: "delete", wilaya: w })}
                            className="grid place-items-center rounded-lg hover:bg-red-50 text-fyn-muted hover:text-red-600 transition-colors"
                            style={{ width: 32, height: 32 }} title="Supprimer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length === 0 && (
          <p className="text-center text-fyn-muted py-12 text-sm">Aucune wilaya trouvée</p>
        )}
      </div>
    </div>
  );
}
