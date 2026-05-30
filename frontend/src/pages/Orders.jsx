import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { api, mediaUrl } from "../services/api";
import { formatPrice } from "../utils/formatPrice";
import { StatusBadge } from "../utils/orderStatus";
import { Skeleton } from "../components/ui/skeleton";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/orders/my").then((r) => setOrders(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="container-fyn pt-28 pb-16" id="main">
      <p className="label-eyebrow text-fyn-gold mb-2">Historique</p>
      <h1 className="font-display text-fyn-text mb-10" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}>Mes commandes</h1>

      {loading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-24">
          <div className="grid place-items-center rounded-full bg-fyn-pink-light mx-auto" style={{ width: 110, height: 110 }}><Package size={42} className="text-fyn-pink" /></div>
          <h2 className="font-display text-3xl text-fyn-text mt-8">Aucune commande pour le moment</h2>
          <Link to="/shop" className="btn-fyn-primary mt-8">Découvrir la collection</Link>
        </div>
      ) : (
        <div className="space-y-5 max-w-3xl">
          {orders.map((o) => (
            <div key={o.id} className="bg-white rounded-2xl border border-fyn-border p-5" data-testid={`order-${o.order_number}`}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="font-display text-xl text-fyn-text">#{o.order_number}</p>
                  <p className="text-xs text-fyn-muted">{o.created_at ? format(new Date(o.created_at), "d MMMM yyyy", { locale: fr }) : ""}</p>
                </div>
                <StatusBadge status={o.status} />
              </div>
              <div className="flex items-center gap-2 mt-4">
                {o.items.slice(0, 4).map((it, i) => (
                  <div key={i} className="rounded-lg overflow-hidden bg-fyn-gold-light border border-fyn-border" style={{ width: 48, height: 56 }}>
                    <img src={mediaUrl(it.product_image)} alt={it.product_name} className="w-full h-full object-cover" />
                  </div>
                ))}
                {o.items.length > 4 && <span className="text-sm text-fyn-muted">+{o.items.length - 4}</span>}
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-fyn-border">
                <span className="text-sm text-fyn-muted">{o.items.length} article{o.items.length > 1 ? "s" : ""} · {o.wilaya}</span>
                <span className="font-display text-xl text-fyn-pink">{formatPrice(o.total)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
