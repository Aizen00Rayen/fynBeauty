import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils/formatPrice";
import { mediaUrl } from "../services/api";
import CouponInput from "../components/checkout/CouponInput";

export default function Cart() {
  const { items, updateQuantity, removeFromCart, subtotal, deliveryFee, discount, total, coupon } = useCart();

  if (items.length === 0) {
    return (
      <div className="container-fyn pt-32 pb-24 text-center" id="main">
        <div className="grid place-items-center rounded-full bg-fyn-pink-light mx-auto" style={{ width: 110, height: 110 }}>
          <ShoppingBag size={42} className="text-fyn-pink" />
        </div>
        <h1 className="font-display text-fyn-text mt-8" style={{ fontSize: "2.5rem" }}>Votre panier est vide</h1>
        <p className="text-fyn-muted mt-2">Parcourez la collection et ajoutez vos favoris.</p>
        <Link to="/shop" className="btn-fyn-primary mt-8">Découvrir la collection</Link>
      </div>
    );
  }

  return (
    <div className="container-fyn pt-28 pb-16" id="main">
      <h1 className="font-display text-fyn-text mb-10" style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)" }}>Mon panier</h1>
      <div className="grid lg:grid-cols-[1fr_400px] gap-12">
        <div className="space-y-6">
          {items.map((item) => (
            <div key={item.key} className="flex gap-5 bg-white rounded-2xl p-4 border border-fyn-border" data-testid={`cart-page-item-${item.slug}`}>
              <Link to={`/product/${item.slug}`} className="shrink-0 rounded-xl overflow-hidden bg-fyn-gold-light" style={{ width: 110, height: 130 }}>
                <img src={mediaUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/product/${item.slug}`}><h3 className="font-display text-xl text-fyn-text leading-tight">{item.name}</h3></Link>
                {item.shade && <p className="text-sm text-fyn-muted mt-1">Teinte : {item.shade}</p>}
                <p className="text-fyn-pink font-semibold mt-2">{formatPrice(item.price)}</p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border border-fyn-border-strong rounded-pill">
                    <button onClick={() => updateQuantity(item.key, item.quantity - 1)} className="grid place-items-center" style={{ width: 36, height: 36 }} aria-label="Diminuer"><Minus size={15} /></button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.key, item.quantity + 1)} className="grid place-items-center" style={{ width: 36, height: 36 }} aria-label="Augmenter"><Plus size={15} /></button>
                  </div>
                  <button onClick={() => removeFromCart(item.key)} className="text-fyn-muted hover:text-fyn-pink transition-colors flex items-center gap-1.5 text-sm" aria-label="Supprimer"><Trash2 size={16} /> Retirer</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:sticky lg:top-28 h-fit bg-white rounded-2xl border border-fyn-border p-6">
          <h2 className="font-display text-2xl text-fyn-text mb-5">Récapitulatif</h2>
          <CouponInput />
          <div className="space-y-3 mt-5 text-sm font-body">
            <div className="flex justify-between text-fyn-muted"><span>Sous-total</span><span className="text-fyn-text">{formatPrice(subtotal)}</span></div>
            {discount > 0 && <div className="flex justify-between" style={{ color: "#2E7D32" }}><span>Réduction {coupon?.code ? `(${coupon.code})` : ""}</span><span>-{formatPrice(discount)}</span></div>}
            <div className="flex justify-between text-fyn-muted">
              <span>Livraison</span>
              <span className="text-fyn-text">
                {deliveryFee === 0 ? "Gratuite" : deliveryFee === null ? "Selon la wilaya" : formatPrice(deliveryFee)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-fyn-border">
              <span className="font-display text-xl text-fyn-text">Total</span>
              <span className="font-display text-2xl text-fyn-pink">
                {total === null ? `${formatPrice(subtotal - discount)} +` : formatPrice(total)}
              </span>
            </div>
          </div>
          <Link to="/checkout" className="btn-fyn-primary w-full mt-6" data-testid="cart-page-checkout">Passer la commande <ArrowRight size={17} /></Link>
          <Link to="/shop" className="btn-fyn-ghost w-full justify-center mt-3">Continuer mes achats</Link>
        </div>
      </div>
    </div>
  );
}
