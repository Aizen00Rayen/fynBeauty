import { useEffect, useState, useRef } from "react";
import { Plus, Pencil, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { api, mediaUrl, apiError } from "../../services/api";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "../../components/ui/dialog";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "../../components/ui/alert-dialog";

const inputCls = "w-full bg-white border-[1.5px] border-fyn-border-strong rounded-md px-3 outline-none focus:border-fyn-pink transition-colors";
const empty = { name: "", description: "", image_url: "", sort_order: 0 };

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const fileRef = useRef();

  const load = () => api.get("/admin/categories").then((r) => setCategories(r.data));
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm({ ...empty, sort_order: categories.length + 1 }); setOpen(true); };
  const openEdit = (c) => { setEditing(c); setForm({ name: c.name, description: c.description || "", image_url: c.image_url || "", sort_order: c.sort_order || 0 }); setOpen(true); };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/admin/upload", fd);
      setForm((f) => ({ ...f, image_url: data.url }));
      toast.success("Image ajoutée");
    } catch (err) {
      toast.error(apiError(err.response?.data?.detail) || "Échec de l'upload");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async () => {
    if (!form.name) { toast.error("Le nom est requis"); return; }
    setSaving(true);
    const payload = { name: form.name, description: form.description, image_url: form.image_url || null, sort_order: parseInt(form.sort_order || 0) };
    try {
      if (editing) await api.put(`/admin/categories/${editing.id}`, payload);
      else await api.post("/admin/categories", payload);
      toast.success(editing ? "Catégorie mise à jour" : "Catégorie créée");
      setOpen(false); load();
    } catch (err) { toast.error(apiError(err.response?.data?.detail) || "Erreur"); } finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    try { await api.delete(`/admin/categories/${deleteId}`); toast.success("Catégorie supprimée"); load(); }
    catch (err) { toast.error(apiError(err.response?.data?.detail) || "Erreur"); }
    setDeleteId(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div><p className="label-eyebrow text-fyn-gold mb-1">Organisation</p><h1 className="font-display text-fyn-text" style={{ fontSize: "2.5rem" }}>Catégories <span className="text-fyn-muted text-2xl">({categories.length})</span></h1></div>
        <button onClick={openNew} className="btn-fyn-primary" data-testid="add-category-button"><Plus size={18} /> Ajouter</button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl border border-fyn-border overflow-hidden" data-testid={`admin-category-${c.slug}`}>
            <div className="bg-fyn-gold-light" style={{ aspectRatio: "16/9" }}>
              {c.image_url ? <img src={mediaUrl(c.image_url)} alt={c.name} className="w-full h-full object-cover" /> : <div className="w-full h-full grid place-items-center text-fyn-muted">Pas d'image</div>}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-xl text-fyn-text">{c.name}</h3>
                  <p className="text-xs text-fyn-muted mt-0.5">{c.product_count} produit{c.product_count > 1 ? "s" : ""} · ordre {c.sort_order}</p>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => openEdit(c)} className="grid place-items-center rounded-lg hover:bg-fyn-pink-light hover:text-fyn-pink transition-colors" style={{ width: 36, height: 36 }} data-testid={`edit-category-${c.slug}`}><Pencil size={15} /></button>
                  <button onClick={() => setDeleteId(c.id)} className="grid place-items-center rounded-lg hover:bg-fyn-pink-light hover:text-fyn-pink transition-colors" style={{ width: 36, height: 36 }} data-testid={`delete-category-${c.slug}`}><Trash2 size={15} /></button>
                </div>
              </div>
              {c.description && <p className="text-sm text-fyn-muted mt-2 line-clamp-2">{c.description}</p>}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-display text-2xl">{editing ? "Modifier la catégorie" : "Nouvelle catégorie"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="label-eyebrow text-fyn-muted block mb-1.5">Nom</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} style={{ height: 46 }} data-testid="category-form-name" /></div>
            <div><label className="label-eyebrow text-fyn-muted block mb-1.5">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className={`${inputCls} py-2`} /></div>
            <div><label className="label-eyebrow text-fyn-muted block mb-1.5">Ordre d'affichage</label><input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} className={inputCls} style={{ height: 46 }} /></div>
            <div>
              <label className="label-eyebrow text-fyn-muted block mb-1.5">Image</label>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" data-testid="category-image-input" />
              {form.image_url ? (
                <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
                  <img src={mediaUrl(form.image_url)} alt="aperçu" className="w-full h-full object-cover" />
                  <button onClick={() => setForm({ ...form, image_url: "" })} className="absolute top-2 right-2 grid place-items-center rounded-full bg-black/60 text-white" style={{ width: 28, height: 28 }}><X size={15} /></button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()} disabled={uploading} className="w-full border-2 border-dashed border-fyn-border-strong rounded-xl py-8 grid place-items-center text-fyn-muted hover:border-fyn-pink hover:text-fyn-pink transition-colors">
                  <Upload size={24} /><span className="mt-2 text-sm">{uploading ? "Upload..." : "Ajouter une image"}</span>
                </button>
              )}
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setOpen(false)} className="btn-fyn-ghost">Annuler</button>
            <button onClick={save} disabled={saving} className="btn-fyn-primary" data-testid="category-form-save">{saving ? "..." : "Enregistrer"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle className="font-display text-2xl">Supprimer cette catégorie ?</AlertDialogTitle><AlertDialogDescription>La suppression n'est possible que si aucun produit n'y est rattaché.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="bg-fyn-pink hover:bg-fyn-pink-dark">Supprimer</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
