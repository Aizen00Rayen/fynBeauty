import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingCart, Users, Ticket, LogOut, Store, Tags, Truck } from "lucide-react";
import Logo from "../Logo";
import { useAuth } from "../../context/AuthContext";

const NAV = [
  { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard, end: true },
  { to: "/admin/products", label: "Produits", icon: Package },
  { to: "/admin/categories", label: "Catégories", icon: Tags },
  { to: "/admin/orders", label: "Commandes", icon: ShoppingCart },
  { to: "/admin/users", label: "Clients", icon: Users },
  { to: "/admin/coupons", label: "Coupons", icon: Ticket },
  { to: "/admin/livraison", label: "Livraison", icon: Truck },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex bg-fyn-bg">
      <aside className="hidden md:flex flex-col w-[248px] bg-fyn-plum text-white fixed inset-y-0 left-0">
        <div className="px-6 py-7">
          <div className="inline-flex bg-white rounded-pill px-3 py-1.5">
            <Logo />
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              data-testid={`admin-nav-${label.toLowerCase().replace(/\s/g, "-")}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl font-body text-sm transition-colors ${
                  isActive ? "bg-fyn-pink text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button onClick={() => navigate("/")} className="flex items-center gap-3 px-4 py-2.5 rounded-xl w-full text-white/70 hover:bg-white/10 hover:text-white text-sm font-body transition-colors">
            <Store size={18} /> Voir la boutique
          </button>
          <button onClick={() => { logout(); navigate("/"); }} className="flex items-center gap-3 px-4 py-2.5 rounded-xl w-full text-white/70 hover:bg-white/10 hover:text-white text-sm font-body transition-colors" data-testid="admin-logout">
            <LogOut size={18} /> Déconnexion
          </button>
          <p className="px-4 pt-3 text-xs text-white/40">{user?.full_name}</p>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-fyn-plum text-white">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="bg-white rounded-pill px-2 py-1"><Logo /></div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => `grid place-items-center rounded-lg ${isActive ? "bg-fyn-pink" : "bg-white/10"}`} style={{ width: 38, height: 38 }} aria-label={label}>
                <Icon size={18} />
              </NavLink>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 md:ml-[248px] pt-16 md:pt-0">
        <div className="p-5 md:p-10 max-w-[1200px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
