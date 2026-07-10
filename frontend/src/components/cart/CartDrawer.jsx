import { Link } from "react-router-dom";
import { X, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { formatPrice } from "../../utils/formatPrice";
import { mediaUrl } from "../../services/api";

export default function CartDrawer() {
  const {
    isOpen, closeCart, items, updateQuantity, removeFromCart,
    subtotal, deliveryFee, discount, total, itemCount, coupon,
  } = useCart();

  return (
    <>
      <div
        className="fixed inset-0 z-[70] bg-black/40 transition-opacity"
        style={{ opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? "auto" : "none" }}
        onClick={closeCart}
      />
      <aside
        className="fixed top-0 right-0 z-[80] h-full w-full sm:w-[440px] bg-white flex flex-col"
        style={{ transform: isOpen ? "translateX(0)" : "translateX(100%)", transition: "transform 360ms cubic-bezier(0.16,1,0.3,1)", boxShadow: "-20px 0 60px rgba(0,0,0,0.12)" }}
        data-testid="cart-drawer"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-fyn-border">
          <h2 className="font-display text-2xl text-fyn-text">Mon panier <span className="text-fyn-muted text-base font-body">({itemCount})</span></h2>
          <button onClick={closeCart} aria-label="Fermer" data-testid="cart-close" className="grid place-items-center" style={{ width: 44, height: 44 }}>
            <X size={24} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8 gap-4">
            <div className="grid place-items-center rounded-full bg-fyn-pink-light" style={{ width: 88, height: 88 }}>
              <ShoppingBag size={34} className="text-fyn-pink" />
            </div>
            <p className="font-display text-2xl text-fyn-text">Votre panier est vide</p>
            <p className="text-fyn-muted text-sm">Découvrez nos bestsellers et trouvez vos chouchous.</p>
            <Link to="/shop" onClick={closeCart} className="btn-fyn-primary mt-2">Découvrir la collection</Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              {items.map((item) => (
                <div key={item.key} className="flex gap-4" data-testid={`cart-item-${item.slug}`}>
                  <Link to={`/product/${item.slug}`} onClick={closeCart} className="shrink-0 rounded-xl overflow-hidden bg-fyn-gold-light" style={{ width: 80, height: 96 }}>
                    <img src={mediaUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-lg text-fyn-text leading-tight">{item.name}</h3>
                    {item.shade && <p className="text-xs text-fyn-muted mt-0.5">Teinte : {item.shade}</p>}
                    <p className="text-fyn-pink font-medium mt-1" style={{ fontSize: 15 }}>{formatPrice(item.price)}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-fyn-border-strong rounded-pill">
                        <button onClick={() => updateQuantity(item.key, item.quantity - 1)} className="grid place-items-center" style={{ width: 32, height: 32 }} aria-label="Diminuer"><Minus size={14} /></button>
                        <span className="w-7 text-center text-sm" data-testid={`cart-qty-${item.slug}`}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.key, item.quantity + 1)} className="grid place-items-center" style={{ width: 32, height: 32 }} aria-label="Augmenter"><Plus size={14} /></button>
                      </div>
                      <button onClick={() => removeFromCart(item.key)} className="text-fyn-muted hover:text-fyn-pink transition-colors" aria-label="Supprimer" data-testid={`cart-remove-${item.slug}`}><Trash2 size={17} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-fyn-border px-6 py-5 space-y-3">
              <div className="flex justify-between text-sm font-body text-fyn-muted">
                <span>Sous-total</span><span className="text-fyn-text">{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm font-body" style={{ color: "#2E7D32" }}>
                  <span>Réduction {coupon?.code ? `(${coupon.code})` : ""}</span><span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-body text-fyn-muted">
                <span>Livraison</span>
                <span className="text-fyn-text">
                  {deliveryFee === 0 ? "Gratuite" : deliveryFee === null ? "Selon la wilaya" : formatPrice(deliveryFee)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-fyn-border">
                <span className="font-display text-xl text-fyn-text">Total</span>
                <span className="font-display text-2xl text-fyn-pink" data-testid="cart-total">
                  {total === null ? `${formatPrice(subtotal - discount)} +` : formatPrice(total)}
                </span>
              </div>
              <Link to="/checkout" onClick={closeCart} className="btn-fyn-primary w-full" data-testid="cart-checkout-button">Passer la commande</Link>
              <Link to="/cart" onClick={closeCart} className="btn-fyn-ghost w-full justify-center">Voir le panier</Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
