import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Phone, Package } from "lucide-react";
import { api, mediaUrl } from "../services/api";
import { formatPrice } from "../utils/formatPrice";
import { useAuth } from "../context/AuthContext";

export default function OrderConfirmation() {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    api.get(`/orders/${id}`).then((r) => setOrder(r.data)).catch(() => {});
  }, [id]);

  return (
    <div className="container-fyn pt-32 pb-20 max-w-2xl mx-auto text-center" id="main">
      <svg width="96" height="96" viewBox="0 0 120 120" className="mx-auto">
        <circle className="check-circle" cx="60" cy="60" r="52" fill="none" stroke="#E8196A" strokeWidth="4" />
        <path className="check-mark" d="M38 62 L54 78 L84 44" fill="none" stroke="#E8196A" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      <h1 className="font-display text-fyn-text mt-8" style={{ fontSize: "clamp(2.25rem, 5vw, 3.25rem)" }}>Commande confirmée !</h1>
      {order && <p className="font-body text-fyn-pink text-lg mt-2 font-medium" data-testid="order-number">#{order.order_number}</p>}
      <p className="text-fyn-muted mt-4 max-w-md mx-auto flex items-center justify-center gap-2">
        <Phone size={16} /> Vous recevrez un appel de notre équipe pour confirmer la livraison.
      </p>

      {order && (
        <div className="bg-white rounded-2xl border border-fyn-border p-6 mt-10 text-left">
          <div className="flex items-center gap-2 mb-5"><Package size={18} className="text-fyn-gold" /><h2 className="font-display text-xl text-fyn-text">Récapitulatif</h2></div>
          <div className="space-y-3">
            {order.items.map((it, i) => (
              <div key={i} className="flex gap-3 items-center">
                <div className="shrink-0 rounded-lg overflow-hidden bg-fyn-gold-light" style={{ width: 48, height: 56 }}>
                  <img src={mediaUrl(it.product_image)} alt={it.product_name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1"><p className="text-sm text-fyn-text">{it.product_name}</p><p className="text-xs text-fyn-muted">x{it.quantity}{it.shade ? ` · ${it.shade}` : ""}</p></div>
                <span className="text-sm font-medium">{formatPrice(it.total_price)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-fyn-border mt-5 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-fyn-muted"><span>Sous-total</span><span>{formatPrice(order.subtotal)}</span></div>
            {order.discount_amount > 0 && <div className="flex justify-between" style={{ color: "#2E7D32" }}><span>Réduction</span><span>-{formatPrice(order.discount_amount)}</span></div>}
            <div className="flex justify-between text-fyn-muted"><span>Livraison</span><span>{order.delivery_fee === 0 ? "Gratuite" : formatPrice(order.delivery_fee)}</span></div>
            <div className="flex justify-between items-center pt-2 border-t border-fyn-border"><span className="font-display text-lg">Total</span><span className="font-display text-xl text-fyn-pink">{formatPrice(order.total)}</span></div>
          </div>
          <div className="mt-5 text-sm text-fyn-muted">
            <p><strong className="text-fyn-text">Livraison :</strong> {order.address}, {order.commune ? `${order.commune}, ` : ""}{order.wilaya}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center mt-10">
        <Link to="/shop" className="btn-fyn-primary">Continuer vos achats</Link>
        {user && <Link to="/orders" className="btn-fyn-secondary">Voir mes commandes</Link>}
      </div>
    </div>
  );
}
