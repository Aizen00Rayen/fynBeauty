import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import Logo from "../components/Logo";
import { useAuth } from "../context/AuthContext";
import { apiError } from "../services/api";

const SIDE_IMG = "https://images.unsplash.com/photo-1592574083647-6d7c37d81535?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Bienvenue, ${user.full_name.split(" ")[0]} !`);
      const dest = user.role === "admin" ? "/admin" : location.state?.from || "/";
      navigate(dest, { replace: true });
    } catch (err) {
      setError(apiError(err.response?.data?.detail) || "Connexion impossible");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:block relative">
        <img src={SIDE_IMG} alt="Fyn Beauty" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-fyn-plum/40" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <p className="font-display italic" style={{ fontSize: 40, lineHeight: 1.1 }}>« La beauté algérienne, redéfinie. »</p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12 bg-fyn-bg">
        <div className="w-full max-w-md">
          <Logo />
          <h1 className="font-display text-fyn-text mt-10" style={{ fontSize: "2.75rem", lineHeight: 1.1 }}>Bon retour</h1>
          <p className="text-fyn-muted mt-2">Connectez-vous à votre compte Fyn Beauty.</p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            {error && <div className="text-sm rounded-xl p-3" style={{ background: "#FDECEC", color: "#C62828" }} data-testid="login-error">⚠ {error}</div>}
            <div>
              <label className="label-eyebrow text-fyn-muted block mb-2" htmlFor="email">Email</label>
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white border-[1.5px] border-fyn-border-strong rounded-md px-4 outline-none focus:border-fyn-pink focus:border-2 transition-colors" style={{ height: 52 }} data-testid="login-email" />
            </div>
            <div>
              <label className="label-eyebrow text-fyn-muted block mb-2" htmlFor="password">Mot de passe</label>
              <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white border-[1.5px] border-fyn-border-strong rounded-md px-4 outline-none focus:border-fyn-pink focus:border-2 transition-colors" style={{ height: 52 }} data-testid="login-password" />
            </div>
            <button type="submit" disabled={loading} className="btn-fyn-primary w-full" data-testid="login-submit">{loading ? "Connexion..." : "Se connecter"}</button>
          </form>

          <p className="text-sm text-fyn-muted mt-6 text-center">
            Pas encore de compte ? <Link to="/register" className="text-fyn-pink font-medium hover:underline">Créer un compte</Link>
          </p>
          <Link to="/" className="block text-center text-sm text-fyn-muted mt-4 hover:text-fyn-pink">← Retour à la boutique</Link>
        </div>
      </div>
    </div>
  );
}
