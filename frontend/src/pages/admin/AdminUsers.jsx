import { useEffect, useState } from "react";
import { Search, Trash2, Shield, User as UserIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { api } from "../../services/api";
import { formatPrice } from "../../utils/formatPrice";
import { StatusBadge } from "../../utils/orderStatus";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "../../components/ui/dialog";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "../../components/ui/alert-dialog";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const load = () => {
    const params = {};
    if (search) params.search = search;
    api.get("/admin/users", { params }).then((r) => setUsers(r.data));
  };
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); /* eslint-disable-next-line */ }, [search]);

  const openDetail = async (u) => {
    const { data } = await api.get(`/admin/users/${u.id}`);
    setSelected(data);
  };

  const toggleRole = async (u) => {
    const role = u.role === "admin" ? "customer" : "admin";
    try { await api.put(`/admin/users/${u.id}/role`, { role }); toast.success("Rôle mis à jour"); load(); } catch { toast.error("Erreur"); }
  };

  const confirmDelete = async () => {
    try { await api.delete(`/admin/users/${deleteId}`); toast.success("Utilisateur supprimé"); load(); } catch (e) { toast.error(e.response?.data?.detail || "Erreur"); }
    setDeleteId(null);
  };

  const initials = (n) => (n || "U").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div>
      <div className="mb-8"><p className="label-eyebrow text-fyn-gold mb-1">Communauté</p><h1 className="font-display text-fyn-text" style={{ fontSize: "2.5rem" }}>Clients <span className="text-fyn-muted text-2xl">({users.length})</span></h1></div>

      <div className="flex items-center gap-2 bg-white border border-fyn-border-strong rounded-pill px-4 mb-6 max-w-md" style={{ height: 44 }}>
        <Search size={16} className="text-fyn-muted" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un client" className="flex-1 bg-transparent outline-none text-sm" data-testid="user-search" />
      </div>

      <div className="bg-white rounded-2xl border border-fyn-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-fyn-muted label-eyebrow border-b border-fyn-border bg-fyn-bg"><th className="p-4">Client</th><th className="p-4">Téléphone</th><th className="p-4">Wilaya</th><th className="p-4">Rôle</th><th className="p-4">Commandes</th><th className="p-4">Inscrit le</th><th className="p-4">Actions</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-fyn-border/60 hover:bg-fyn-bg cursor-pointer" data-testid={`admin-user-${u.email}`}>
                  <td className="p-4" onClick={() => openDetail(u)}><div className="flex items-center gap-3"><div className="grid place-items-center rounded-full bg-fyn-pink text-white font-display" style={{ width: 38, height: 38, fontSize: 14 }}>{initials(u.full_name)}</div><div><p className="font-medium text-fyn-text">{u.full_name}</p><p className="text-xs text-fyn-muted">{u.email}</p></div></div></td>
                  <td className="p-4 text-fyn-muted">{u.phone || "—"}</td>
                  <td className="p-4 text-fyn-muted">{u.wilaya || "—"}</td>
                  <td className="p-4">{u.role === "admin" ? <span className="text-xs rounded-pill px-2.5 py-1 flex items-center gap-1 w-fit" style={{ background: "#F0E7FB", color: "#6A1B9A" }}><Shield size={11} /> Admin</span> : <span className="text-xs rounded-pill px-2.5 py-1" style={{ background: "#F5EDE3", color: "#6E6E73" }}>Client</span>}</td>
                  <td className="p-4 text-fyn-text">{u.order_count}</td>
                  <td className="p-4 text-fyn-muted text-xs">{u.created_at ? format(new Date(u.created_at), "d MMM yyyy", { locale: fr }) : ""}</td>
                  <td className="p-4"><div className="flex gap-2"><button onClick={() => toggleRole(u)} title="Changer rôle" className="grid place-items-center rounded-lg hover:bg-fyn-pink-light hover:text-fyn-pink" style={{ width: 36, height: 36 }} data-testid={`toggle-role-${u.email}`}><Shield size={15} /></button><button onClick={() => setDeleteId(u.id)} className="grid place-items-center rounded-lg hover:bg-fyn-pink-light hover:text-fyn-pink" style={{ width: 36, height: 36 }}><Trash2 size={15} /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <p className="text-center text-fyn-muted py-12">Aucun client</p>}
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader><DialogTitle className="font-display text-2xl flex items-center gap-3"><div className="grid place-items-center rounded-full bg-fyn-pink text-white font-display" style={{ width: 44, height: 44, fontSize: 16 }}>{initials(selected.full_name)}</div>{selected.full_name}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-fyn-bg rounded-xl p-3"><p className="label-eyebrow text-fyn-muted mb-1">Email</p>{selected.email}</div>
                  <div className="bg-fyn-bg rounded-xl p-3"><p className="label-eyebrow text-fyn-muted mb-1">Téléphone</p>{selected.phone || "—"}</div>
                  <div className="bg-fyn-bg rounded-xl p-3"><p className="label-eyebrow text-fyn-muted mb-1">Wilaya</p>{selected.wilaya || "—"}</div>
                  <div className="bg-fyn-bg rounded-xl p-3"><p className="label-eyebrow text-fyn-muted mb-1">Rôle</p>{selected.role}</div>
                </div>
                <div>
                  <p className="label-eyebrow text-fyn-muted mb-3 flex items-center gap-1.5"><UserIcon size={13} /> Historique des commandes ({selected.orders?.length || 0})</p>
                  <div className="space-y-2">
                    {(selected.orders || []).map((o) => (
                      <div key={o.id} className="flex items-center justify-between bg-white border border-fyn-border rounded-xl p-3 text-sm">
                        <span className="font-medium">#{o.order_number}</span>
                        <StatusBadge status={o.status} />
                        <span className="text-fyn-pink font-medium">{formatPrice(o.total)}</span>
                      </div>
                    ))}
                    {(!selected.orders || selected.orders.length === 0) && <p className="text-sm text-fyn-muted">Aucune commande</p>}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle className="font-display text-2xl">Supprimer cet utilisateur ?</AlertDialogTitle><AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="bg-fyn-pink hover:bg-fyn-pink-dark">Supprimer</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
