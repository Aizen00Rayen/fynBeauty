import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";
import { ShoppingCart, DollarSign, Users, Package, TrendingUp } from "lucide-react";
import { api, mediaUrl } from "../../services/api";
import { formatPrice } from "../../utils/formatPrice";
import { StatusBadge, ORDER_STATUS } from "../../utils/orderStatus";
import { Skeleton } from "../../components/ui/skeleton";

const PIE_COLORS = ["#E8196A", "#C9A07A", "#5C2040", "#2E7D32", "#1565C0", "#E65100"];

function KpiCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="bg-white rounded-2xl border border-fyn-border p-6" data-testid={`kpi-${label.toLowerCase().replace(/\s/g, "-")}`}>
      <div className="flex items-center justify-between">
        <div className="grid place-items-center rounded-xl" style={{ width: 48, height: 48, background: accent + "1a", color: accent }}><Icon size={22} /></div>
      </div>
      <p className="font-display text-fyn-text mt-4" style={{ fontSize: 32, lineHeight: 1 }}>{value}</p>
      <p className="text-sm text-fyn-muted mt-1">{label}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/admin/stats").then((r) => setStats(r.data)).catch(() => {});
  }, []);

  if (!stats) {
    return <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>;
  }

  const pieData = Object.entries(stats.ordersByStatus).filter(([, v]) => v > 0).map(([k, v]) => ({ name: ORDER_STATUS[k]?.label || k, value: v, key: k }));

  return (
    <div>
      <div className="mb-8">
        <p className="label-eyebrow text-fyn-gold mb-1">Vue d'ensemble</p>
        <h1 className="font-display text-fyn-text" style={{ fontSize: "2.5rem" }}>Tableau de bord</h1>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <KpiCard icon={ShoppingCart} label="Commandes" value={stats.totalOrders} accent="#E8196A" />
        <KpiCard icon={DollarSign} label="Chiffre d'affaires" value={formatPrice(stats.totalRevenue)} accent="#2E7D32" />
        <KpiCard icon={Users} label="Clients" value={stats.totalUsers} accent="#C9A07A" />
        <KpiCard icon={Package} label="Produits actifs" value={stats.totalProducts} accent="#5C2040" />
      </div>

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-5 mb-8">
        <div className="bg-white rounded-2xl border border-fyn-border p-6">
          <div className="flex items-center gap-2 mb-5"><TrendingUp size={18} className="text-fyn-pink" /><h2 className="font-display text-xl text-fyn-text">Chiffre d'affaires (14 jours)</h2></div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={stats.revenueSeries} margin={{ left: -10, right: 10, top: 10 }}>
              <defs><linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#E8196A" stopOpacity={0.3} /><stop offset="100%" stopColor="#E8196A" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDE8E3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6E6E73" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6E6E73" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => formatPrice(v)} contentStyle={{ borderRadius: 12, border: "1px solid #EDE8E3", fontFamily: "DM Sans" }} />
              <Area type="monotone" dataKey="revenue" stroke="#E8196A" strokeWidth={2.5} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-fyn-border p-6">
          <h2 className="font-display text-xl text-fyn-text mb-5">Commandes par statut</h2>
          {pieData.length === 0 ? (
            <p className="text-fyn-muted text-sm text-center py-16">Aucune commande</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {pieData.map((entry, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #EDE8E3", fontFamily: "DM Sans" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {pieData.map((d, i) => <span key={d.key} className="flex items-center gap-1.5 text-xs text-fyn-muted"><span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />{d.name} ({d.value})</span>)}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-5">
        <div className="bg-white rounded-2xl border border-fyn-border p-6">
          <h2 className="font-display text-xl text-fyn-text mb-5">Commandes récentes</h2>
          {stats.recentOrders.length === 0 ? <p className="text-fyn-muted text-sm">Aucune commande</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-fyn-muted label-eyebrow border-b border-fyn-border"><th className="pb-3">Commande</th><th className="pb-3">Client</th><th className="pb-3">Total</th><th className="pb-3">Statut</th></tr></thead>
                <tbody>
                  {stats.recentOrders.map((o) => (
                    <tr key={o.id} className="border-b border-fyn-border/60 hover:bg-fyn-bg cursor-pointer" onClick={() => navigate("/admin/orders")}>
                      <td className="py-3 font-medium text-fyn-text">#{o.order_number}</td>
                      <td className="py-3 text-fyn-muted">{o.customer_name}</td>
                      <td className="py-3 text-fyn-pink font-medium">{formatPrice(o.total)}</td>
                      <td className="py-3"><StatusBadge status={o.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-fyn-border p-6">
          <h2 className="font-display text-xl text-fyn-text mb-5">Top produits</h2>
          <div className="space-y-4">
            {stats.topProducts.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="font-display text-fyn-gold text-lg w-5">{i + 1}</span>
                <div className="rounded-lg overflow-hidden bg-fyn-gold-light" style={{ width: 44, height: 50 }}><img src={mediaUrl(p.image)} alt={p.name} className="w-full h-full object-cover" /></div>
                <div className="flex-1 min-w-0"><p className="text-sm text-fyn-text truncate">{p.name}</p><p className="text-xs text-fyn-muted">{p.sold_count} vendus</p></div>
                <span className="text-sm font-medium text-fyn-text">{formatPrice(p.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
