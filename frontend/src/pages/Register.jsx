import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Logo from "../components/Logo";
import { useAuth } from "../context/AuthContext";
import { apiError } from "../services/api";

const SIDE_IMG = "https://images.unsplash.com/photo-1596205521983-9c372fb3d4f1?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      toast.success("Compte créé avec succès 🌸");
      navigate("/", { replace: true });
    } catch (err) {
      setError(apiError(err.response?.data?.detail) || "Inscription impossible");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex items-center justify-center p-6 sm:p-12 bg-fyn-bg order-2 lg:order-1">
        <div className="w-full max-w-md">
          <Logo />
          <h1 className="font-display text-fyn-text mt-10" style={{ fontSize: "2.75rem", lineHeight: 1.1 }}>Rejoignez Fyn Beauty</h1>
          <p className="text-fyn-muted mt-2">Créez votre compte en quelques secondes.</p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            {error && <div className="text-sm rounded-xl p-3" style={{ background: "#FDECEC", color: "#C62828" }} data-testid="register-error">⚠ {error}</div>}
            <div>
              <label className="label-eyebrow text-fyn-muted block mb-2" htmlFor="name">Nom complet</label>
              <input id="name" required value={form.full_name} onChange={set("full_name")} className="w-full bg-white border-[1.5px] border-fyn-border-strong rounded-md px-4 outline-none focus:border-fyn-pink focus:border-2 transition-colors" style={{ height: 52 }} data-testid="register-name" />
            </div>
            <div>
              <label className="label-eyebrow text-fyn-muted block mb-2" htmlFor="email">Email</label>
              <input id="email" type="email" required value={form.email} onChange={set("email")} className="w-full bg-white border-[1.5px] border-fyn-border-strong rounded-md px-4 outline-none focus:border-fyn-pink focus:border-2 transition-colors" style={{ height: 52 }} data-testid="register-email" />
            </div>
            <div>
              <label className="label-eyebrow text-fyn-muted block mb-2" htmlFor="phone">Téléphone</label>
              <input id="phone" value={form.phone} onChange={set("phone")} placeholder="0X XX XX XX XX" className="w-full bg-white border-[1.5px] border-fyn-border-strong rounded-md px-4 outline-none focus:border-fyn-pink focus:border-2 transition-colors" style={{ height: 52 }} data-testid="register-phone" />
            </div>
            <div>
              <label className="label-eyebrow text-fyn-muted block mb-2" htmlFor="password">Mot de passe</label>
              <input id="password" type="password" required minLength={6} value={form.password} onChange={set("password")} className="w-full bg-white border-[1.5px] border-fyn-border-strong rounded-md px-4 outline-none focus:border-fyn-pink focus:border-2 transition-colors" style={{ height: 52 }} data-testid="register-password" />
            </div>
            <button type="submit" disabled={loading} className="btn-fyn-primary w-full" data-testid="register-submit">{loading ? "Création..." : "Créer mon compte"}</button>
          </form>

          <p className="text-sm text-fyn-muted mt-6 text-center">
            Déjà un compte ? <Link to="/login" className="text-fyn-pink font-medium hover:underline">Se connecter</Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:block relative order-1 lg:order-2">
        <img src={SIDE_IMG} alt="Fyn Beauty" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-fyn-plum/40" />
      </div>
    </div>
  );
}
