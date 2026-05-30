import { useEffect, useState, useRef } from "react";
import { Plus, Pencil, Trash2, Upload, X, Star } from "lucide-react";
import { toast } from "sonner";
import { api, mediaUrl, apiError } from "../../services/api";
import { formatPrice } from "../../utils/formatPrice";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "../../components/ui/dialog";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "../../components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { Switch } from "../../components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../components/ui/select";

const inputCls = "w-full bg-white border-[1.5px] border-fyn-border-strong rounded-md px-3 outline-none focus:border-fyn-pink transition-colors";
const empty = { name: "", description: "", price: "", compare_price: "", category_slug: "", stock: "", sku: "", tags: "", is_active: true, is_featured: false, images: [], shades: [] };

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const fileRef = useRef();

  const load = () => api.get("/admin/products").then((r) => setProducts(r.data));
  useEffect(() => { load(); api.get("/categories").then((r) => setCategories(r.data)); }, []);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name, description: p.description || "", price: p.price, compare_price: p.compare_price || "",
      category_slug: p.category_slug || "", stock: p.stock, sku: p.sku || "", tags: (p.tags || []).join(", "),
      is_active: p.is_active, is_featured: p.is_featured, images: p.images || [], shades: p.shades || [],
    });
    setOpen(true);
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files.slice(0, 5)) {
        const fd = new FormData();
        fd.append("file", file);
        const { data } = await api.post("/admin/upload", fd);
        setForm((f) => ({ ...f, images: [...f.images, data.url] }));
      }
      toast.success("Image(s) ajoutée(s)");
    } catch (err) {
      toast.error(apiError(err.response?.data?.detail) || "Échec de l'upload");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async () => {
    if (!form.name || !form.price) { toast.error("Nom et prix requis"); return; }
    setSaving(true);
    const payload = {
      name: form.name, description: form.description, price: parseFloat(form.price),
      compare_price: form.compare_price ? parseFloat(form.compare_price) : null,
      category_slug: form.category_slug || null, stock: parseInt(form.stock || 0),
      sku: form.sku || null, tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      is_active: form.is_active, is_featured: form.is_featured, images: form.images,
      shades: form.shades.map((s) => ({ name: s.name, hex: s.hex, stock: parseInt(s.stock || 0) })),
    };
    try {
      if (editing) await api.put(`/admin/products/${editing.id}`, payload);
      else await api.post("/admin/products", payload);
      toast.success(editing ? "Produit mis à jour" : "Produit créé");
      setOpen(false);
      load();
    } catch (err) {
      toast.error(apiError(err.response?.data?.detail) || "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try { await api.delete(`/admin/products/${deleteId}`); toast.success("Produit supprimé"); load(); } catch { toast.error("Erreur"); }
    setDeleteId(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div><p className="label-eyebrow text-fyn-gold mb-1">Catalogue</p><h1 className="font-display text-fyn-text" style={{ fontSize: "2.5rem" }}>Produits <span className="text-fyn-muted text-2xl">({products.length})</span></h1></div>
        <button onClick={openNew} className="btn-fyn-primary" data-testid="add-product-button"><Plus size={18} /> Ajouter</button>
      </div>

      <div className="bg-white rounded-2xl border border-fyn-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-fyn-muted label-eyebrow border-b border-fyn-border bg-fyn-bg"><th className="p-4">Produit</th><th className="p-4">Catégorie</th><th className="p-4">Prix</th><th className="p-4">Stock</th><th className="p-4">Statut</th><th className="p-4">Actions</th></tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-fyn-border/60 hover:bg-fyn-bg" data-testid={`admin-product-${p.slug}`}>
                  <td className="p-4"><div className="flex items-center gap-3"><div className="rounded-lg overflow-hidden bg-fyn-gold-light" style={{ width: 44, height: 50 }}><img src={mediaUrl(p.images?.[0])} alt={p.name} className="w-full h-full object-cover" /></div><span className="font-medium text-fyn-text">{p.name}</span></div></td>
                  <td className="p-4 text-fyn-muted">{p.category_name || "—"}</td>
                  <td className="p-4 text-fyn-pink font-medium">{formatPrice(p.price)}</td>
                  <td className="p-4 text-fyn-text">{p.stock}</td>
                  <td className="p-4">{p.is_active ? <span className="text-xs rounded-pill px-2.5 py-1" style={{ background: "#EAF5EB", color: "#2E7D32" }}>Actif</span> : <span className="text-xs rounded-pill px-2.5 py-1" style={{ background: "#FDECEC", color: "#C62828" }}>Inactif</span>}</td>
                  <td className="p-4"><div className="flex gap-2"><button onClick={() => openEdit(p)} className="grid place-items-center rounded-lg hover:bg-fyn-pink-light hover:text-fyn-pink transition-colors" style={{ width: 36, height: 36 }} data-testid={`edit-product-${p.slug}`}><Pencil size={16} /></button><button onClick={() => setDeleteId(p.id)} className="grid place-items-center rounded-lg hover:bg-fyn-pink-light hover:text-fyn-pink transition-colors" style={{ width: 36, height: 36 }}><Trash2 size={16} /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display text-2xl">{editing ? "Modifier le produit" : "Nouveau produit"}</DialogTitle></DialogHeader>
          <Tabs defaultValue="general">
            <TabsList className="grid grid-cols-3 w-full"><TabsTrigger value="general">Général</TabsTrigger><TabsTrigger value="images">Images</TabsTrigger><TabsTrigger value="shades">Teintes</TabsTrigger></TabsList>

            <TabsContent value="general" className="space-y-4 pt-4">
              <div><label className="label-eyebrow text-fyn-muted block mb-1.5">Nom du produit</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} style={{ height: 46 }} data-testid="product-form-name" /></div>
              <div><label className="label-eyebrow text-fyn-muted block mb-1.5">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={`${inputCls} py-2`} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label-eyebrow text-fyn-muted block mb-1.5">Prix (DZD)</label><input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputCls} style={{ height: 46 }} data-testid="product-form-price" /></div>
                <div><label className="label-eyebrow text-fyn-muted block mb-1.5">Prix comparatif</label><input type="number" value={form.compare_price} onChange={(e) => setForm({ ...form, compare_price: e.target.value })} className={inputCls} style={{ height: 46 }} /></div>
                <div>
                  <label className="label-eyebrow text-fyn-muted block mb-1.5">Catégorie</label>
                  <Select value={form.category_slug} onValueChange={(v) => setForm({ ...form, category_slug: v })}>
                    <SelectTrigger className="border-[1.5px] border-fyn-border-strong rounded-md" style={{ height: 46 }}><SelectValue placeholder="Choisir" /></SelectTrigger>
                    <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><label className="label-eyebrow text-fyn-muted block mb-1.5">Stock</label><input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className={inputCls} style={{ height: 46 }} data-testid="product-form-stock" /></div>
                <div><label className="label-eyebrow text-fyn-muted block mb-1.5">SKU</label><input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className={inputCls} style={{ height: 46 }} /></div>
                <div><label className="label-eyebrow text-fyn-muted block mb-1.5">Tags (séparés par ,)</label><input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className={inputCls} style={{ height: 46 }} /></div>
              </div>
              <div className="flex gap-8 pt-2">
                <label className="flex items-center gap-2.5"><Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} /><span className="text-sm">En vedette</span></label>
                <label className="flex items-center gap-2.5"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /><span className="text-sm">Actif</span></label>
              </div>
            </TabsContent>

            <TabsContent value="images" className="pt-4">
              <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" data-testid="product-image-input" />
              <button onClick={() => fileRef.current?.click()} disabled={uploading} className="w-full border-2 border-dashed border-fyn-border-strong rounded-xl py-10 grid place-items-center text-fyn-muted hover:border-fyn-pink hover:text-fyn-pink transition-colors">
                <Upload size={28} /><span className="mt-2 text-sm">{uploading ? "Upload en cours..." : "Cliquez pour ajouter des images (max 5)"}</span>
              </button>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                {form.images.map((img, i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden group" style={{ aspectRatio: "1" }}>
                    <img src={mediaUrl(img)} alt={`img-${i}`} className="w-full h-full object-cover" />
                    {i === 0 && <span className="absolute top-1 left-1 bg-fyn-pink text-white rounded-pill flex items-center gap-1 px-2 py-0.5" style={{ fontSize: 9 }}><Star size={9} fill="#fff" /> Principale</span>}
                    <button onClick={() => setForm({ ...form, images: form.images.filter((_, idx) => idx !== i) })} className="absolute top-1 right-1 grid place-items-center rounded-full bg-black/60 text-white" style={{ width: 24, height: 24 }}><X size={14} /></button>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="shades" className="pt-4 space-y-3">
              {form.shades.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="color" value={s.hex} onChange={(e) => { const sh = [...form.shades]; sh[i] = { ...sh[i], hex: e.target.value }; setForm({ ...form, shades: sh }); }} className="rounded-md border border-fyn-border" style={{ width: 46, height: 46 }} />
                  <input placeholder="Nom" value={s.name} onChange={(e) => { const sh = [...form.shades]; sh[i] = { ...sh[i], name: e.target.value }; setForm({ ...form, shades: sh }); }} className={inputCls} style={{ height: 46 }} />
                  <input type="number" placeholder="Stock" value={s.stock} onChange={(e) => { const sh = [...form.shades]; sh[i] = { ...sh[i], stock: e.target.value }; setForm({ ...form, shades: sh }); }} className={inputCls} style={{ height: 46, width: 90 }} />
                  <button onClick={() => setForm({ ...form, shades: form.shades.filter((_, idx) => idx !== i) })} className="grid place-items-center text-fyn-muted hover:text-fyn-pink" style={{ width: 40, height: 40 }}><Trash2 size={16} /></button>
                </div>
              ))}
              <button onClick={() => setForm({ ...form, shades: [...form.shades, { name: "", hex: "#E8196A", stock: 0 }] })} className="btn-fyn-ghost"><Plus size={16} /> Ajouter une teinte</button>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <button onClick={() => setOpen(false)} className="btn-fyn-ghost">Annuler</button>
            <button onClick={save} disabled={saving} className="btn-fyn-primary" data-testid="product-form-save">{saving ? "..." : "Enregistrer"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle className="font-display text-2xl">Supprimer ce produit ?</AlertDialogTitle><AlertDialogDescription>Cette action est définitive : le produit sera supprimé du catalogue. Les commandes passées ne sont pas affectées.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="bg-fyn-pink hover:bg-fyn-pink-dark">Supprimer</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
