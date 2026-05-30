import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { User, Package, Heart, LogOut } from "lucide-react";
import { api, apiError } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { WILAYAS } from "../utils/wilayas";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";

const inputCls = "w-full bg-white border-[1.5px] border-fyn-border-strong rounded-md px-4 outline-none focus:border-fyn-pink focus:border-2 transition-colors";

export default function Profile() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    full_name: user?.full_name || "", phone: user?.phone || "", wilaya: user?.wilaya || "", address: user?.address || "",
  });
  const [pwd, setPwd] = useState({ old_password: "", new_password: "", confirm: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  const initials = (user?.full_name || "U").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.put("/auth/me", profile);
      await refreshUser();
      toast.success("Profil mis à jour");
    } catch (err) {
      toast.error(apiError(err.response?.data?.detail));
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pwd.new_password !== pwd.confirm) { toast.error("Les mots de passe ne correspondent pas"); return; }
    setSavingPwd(true);
    try {
      await api.put("/auth/change-password", { old_password: pwd.old_password, new_password: pwd.new_password });
      toast.success("Mot de passe modifié");
      setPwd({ old_password: "", new_password: "", confirm: "" });
    } catch (err) {
      toast.error(apiError(err.response?.data?.detail));
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div className="container-fyn pt-28 pb-16" id="main">
      <div className="flex items-center gap-4 mb-10">
        <div className="grid place-items-center rounded-full bg-fyn-pink text-white font-display" style={{ width: 72, height: 72, fontSize: 28 }}>{initials}</div>
        <div>
          <h1 className="font-display text-fyn-text" style={{ fontSize: "2.25rem", lineHeight: 1 }}>{user?.full_name}</h1>
          <p className="text-fyn-muted">{user?.email}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[220px_1fr] gap-10">
        <aside className="space-y-1 h-fit">
          {[{ icon: User, t: "Mon profil", active: true }, { icon: Package, t: "Mes commandes", to: "/orders" }, { icon: Heart, t: "Mes favoris", to: "/favorites" }].map((it) => (
            <button key={it.t} onClick={() => it.to && navigate(it.to)} className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-body text-sm transition-colors ${it.active ? "bg-fyn-pink-light text-fyn-pink-dark" : "text-fyn-text hover:bg-fyn-gold-light"}`}>
              <it.icon size={18} /> {it.t}
            </button>
          ))}
          <button onClick={() => { logout(); navigate("/"); }} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl font-body text-sm text-fyn-muted hover:bg-fyn-gold-light transition-colors"><LogOut size={18} /> Déconnexion</button>
        </aside>

        <div className="space-y-10 max-w-xl">
          <form onSubmit={saveProfile} className="bg-white rounded-2xl border border-fyn-border p-6">
            <h2 className="font-display text-2xl text-fyn-text mb-5">Mon profil</h2>
            <div className="space-y-4">
              <div><label className="label-eyebrow text-fyn-muted block mb-2">Nom complet</label><input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} className={inputCls} style={{ height: 52 }} data-testid="profile-name" /></div>
              <div><label className="label-eyebrow text-fyn-muted block mb-2">Téléphone</label><input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className={inputCls} style={{ height: 52 }} data-testid="profile-phone" /></div>
              <div>
                <label className="label-eyebrow text-fyn-muted block mb-2">Wilaya</label>
                <Select value={profile.wilaya} onValueChange={(v) => setProfile({ ...profile, wilaya: v })}>
                  <SelectTrigger className="border-[1.5px] border-fyn-border-strong rounded-md" style={{ height: 52 }}><SelectValue placeholder="Sélectionnez" /></SelectTrigger>
                  <SelectContent className="max-h-72">{WILAYAS.map((w) => <SelectItem key={w.code} value={w.name}>{w.code} — {w.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="label-eyebrow text-fyn-muted block mb-2">Adresse par défaut</label><textarea value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} rows={2} className={`${inputCls} py-3`} data-testid="profile-address" /></div>
            </div>
            <button type="submit" disabled={savingProfile} className="btn-fyn-primary mt-6" data-testid="profile-save">{savingProfile ? "Enregistrement..." : "Enregistrer"}</button>
          </form>

          <form onSubmit={changePassword} className="bg-white rounded-2xl border border-fyn-border p-6">
            <h2 className="font-display text-2xl text-fyn-text mb-5">Changer le mot de passe</h2>
            <div className="space-y-4">
              <div><label className="label-eyebrow text-fyn-muted block mb-2">Ancien mot de passe</label><input type="password" value={pwd.old_password} onChange={(e) => setPwd({ ...pwd, old_password: e.target.value })} className={inputCls} style={{ height: 52 }} data-testid="old-password" /></div>
              <div><label className="label-eyebrow text-fyn-muted block mb-2">Nouveau mot de passe</label><input type="password" value={pwd.new_password} onChange={(e) => setPwd({ ...pwd, new_password: e.target.value })} className={inputCls} style={{ height: 52 }} data-testid="new-password" /></div>
              <div><label className="label-eyebrow text-fyn-muted block mb-2">Confirmer</label><input type="password" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} className={inputCls} style={{ height: 52 }} data-testid="confirm-password" /></div>
            </div>
            <button type="submit" disabled={savingPwd} className="btn-fyn-secondary mt-6" data-testid="password-save">{savingPwd ? "..." : "Mettre à jour"}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
