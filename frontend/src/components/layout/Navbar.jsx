import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, Heart, ShoppingBag, User, Menu, X } from "lucide-react";
import Logo from "../Logo";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useFavorites } from "../../context/FavoritesContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "../ui/dropdown-menu";

const LINKS = [
  { label: "Accueil", to: "/" },
  { label: "Collection", to: "/shop" },
  { label: "Nouveautés", to: "/nouveautes" },
  { label: "À propos", to: "/apropos" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [q, setQ] = useState("");
  const { user, logout, isAdmin } = useAuth();
  const { itemCount, openCart, bump } = useCart();
  const fav = useFavorites();
  const navigate = useNavigate();
  const location = useLocation();
  const [bumped, setBumped] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (bump > 0) {
      setBumped(true);
      const t = setTimeout(() => setBumped(false), 350);
      return () => clearTimeout(t);
    }
  }, [bump]);

  const isHome = location.pathname === "/";
  const solid = scrolled || !isHome || searchOpen;

  const submitSearch = (e) => {
    e.preventDefault();
    if (q.trim()) {
      navigate(`/shop?search=${encodeURIComponent(q.trim())}`);
      setSearchOpen(false);
      setQ("");
    }
  };

  return (
    <>
      <a href="#main" className="skip-link">Aller au contenu</a>
      <header
        data-testid="navbar"
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          transition: "background 300ms ease, box-shadow 300ms ease, border-color 300ms ease",
          background: solid ? "rgba(255,255,255,0.92)" : "transparent",
          backdropFilter: solid ? "blur(16px)" : "none",
          boxShadow: solid ? "0 1px 24px rgba(0,0,0,0.06)" : "none",
          borderBottom: solid ? "1px solid #EDE8E3" : "1px solid transparent",
        }}
      >
        <nav className="container-fyn flex items-center justify-between" style={{ height: 72 }}>
          <Logo />

          <div className="hidden lg:flex items-center gap-9">
            {LINKS.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                className="nav-link font-body text-fyn-text hover:text-fyn-pink transition-colors"
                style={{ fontSize: 15, fontWeight: 500 }}
                data-testid={`nav-${l.label.toLowerCase()}`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setSearchOpen((s) => !s)}
              className="grid place-items-center rounded-md hover:text-fyn-pink transition-colors"
              style={{ width: 44, height: 44 }}
              aria-label="Rechercher"
              data-testid="search-toggle"
            >
              <Search size={20} />
            </button>

            {user && (
              <Link
                to="/favorites"
                className="relative grid place-items-center rounded-md hover:text-fyn-pink transition-colors"
                style={{ width: 44, height: 44 }}
                aria-label="Favoris"
                data-testid="nav-favorites"
              >
                <Heart size={20} />
                {fav.count > 0 && (
                  <span className="absolute top-1 right-1 grid place-items-center rounded-full bg-fyn-pink text-white" style={{ fontSize: 10, width: 16, height: 16 }}>
                    {fav.count}
                  </span>
                )}
              </Link>
            )}

            <button
              onClick={openCart}
              className="relative grid place-items-center rounded-md hover:text-fyn-pink transition-colors"
              style={{ width: 44, height: 44 }}
              aria-label="Panier"
              data-testid="nav-cart"
            >
              <ShoppingBag size={20} />
              {itemCount > 0 && (
                <span
                  className="absolute top-1 right-1 grid place-items-center rounded-full bg-fyn-pink text-white font-medium"
                  style={{ fontSize: 10, width: 18, height: 18, transition: "transform 300ms cubic-bezier(0.16,1,0.3,1)", transform: bumped ? "scale(1.4)" : "scale(1)" }}
                  data-testid="cart-count-badge"
                >
                  {itemCount}
                </span>
              )}
            </button>

            <div className="hidden sm:block">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="grid place-items-center rounded-md hover:text-fyn-pink transition-colors" style={{ width: 44, height: 44 }} aria-label="Mon compte" data-testid="user-menu-trigger">
                      <User size={20} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-body">
                      <span className="block text-fyn-text">{user.full_name}</span>
                      <span className="block text-xs text-fyn-muted font-normal">{user.email}</span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {isAdmin && (
                      <DropdownMenuItem onClick={() => navigate("/admin")} data-testid="menu-admin">Tableau de bord</DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => navigate("/profile")} data-testid="menu-profile">Mon compte</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/orders")} data-testid="menu-orders">Mes commandes</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/favorites")}>Mes favoris</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-fyn-pink" data-testid="menu-logout">Déconnexion</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/login" className="grid place-items-center rounded-md hover:text-fyn-pink transition-colors" style={{ width: 44, height: 44 }} aria-label="Se connecter" data-testid="nav-login">
                  <User size={20} />
                </Link>
              )}
            </div>

            <button className="lg:hidden grid place-items-center rounded-md" style={{ width: 44, height: 44 }} onClick={() => setMobileOpen(true)} aria-label="Menu" data-testid="mobile-menu-trigger">
              <Menu size={22} />
            </button>
          </div>
        </nav>

        {searchOpen && (
          <div className="border-t border-fyn-border bg-white/95 backdrop-blur-md">
            <form onSubmit={submitSearch} className="container-fyn py-4 flex items-center gap-3">
              <Search size={20} className="text-fyn-muted" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher un produit..."
                className="flex-1 bg-transparent outline-none font-body text-fyn-text"
                style={{ fontSize: 16 }}
                data-testid="search-input"
              />
              <button type="submit" className="btn-fyn-primary" style={{ height: 40 }} data-testid="search-submit">Chercher</button>
            </form>
          </div>
        )}
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-[82%] max-w-sm bg-white p-6 flex flex-col" style={{ animation: "none" }}>
            <div className="flex items-center justify-between mb-10">
              <Logo />
              <button onClick={() => setMobileOpen(false)} aria-label="Fermer" data-testid="mobile-menu-close" className="grid place-items-center" style={{ width: 44, height: 44 }}>
                <X size={24} />
              </button>
            </div>
            <div className="flex flex-col gap-5">
              {LINKS.map((l) => (
                <Link key={l.label} to={l.to} onClick={() => setMobileOpen(false)} className="font-display text-2xl text-fyn-text">{l.label}</Link>
              ))}
            </div>
            <div className="mt-auto flex flex-col gap-3">
              {user ? (
                <>
                  {isAdmin && <Link to="/admin" onClick={() => setMobileOpen(false)} className="btn-fyn-secondary">Tableau de bord</Link>}
                  <Link to="/profile" onClick={() => setMobileOpen(false)} className="btn-fyn-secondary">Mon compte</Link>
                  <button onClick={() => { logout(); setMobileOpen(false); }} className="btn-fyn-primary">Déconnexion</button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-fyn-secondary">Se connecter</Link>
                  <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-fyn-primary">Créer un compte</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
