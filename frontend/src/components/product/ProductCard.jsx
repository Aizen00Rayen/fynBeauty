import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { formatPrice, discountPercent } from "../../utils/formatPrice";
import { mediaUrl } from "../../services/api";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useFavorites } from "../../context/FavoritesContext";

export default function ProductCard({ product }) {
  const { addToCart, openCart } = useCart();
  const { user } = useAuth();
  const fav = useFavorites();
  const [adding, setAdding] = useState(false);

  const discount = discountPercent(product.compare_price, product.price);
  const isFav = fav?.isFavorite(product.id);
  const hasShades = product.shades && product.shades.length > 0;

  const handleQuickAdd = (e) => {
    e.preventDefault();
    if (hasShades) {
      // shades require selection on detail page
      window.location.href = `/product/${product.slug}`;
      return;
    }
    setAdding(true);
    addToCart(product, null, 1);
    toast.success("Produit ajouté au panier");
    openCart();
    setTimeout(() => setAdding(false), 800);
  };

  const handleFav = async (e) => {
    e.preventDefault();
    if (!user) {
      toast("Connectez-vous pour ajouter aux favoris");
      return;
    }
    const added = await fav.toggleFavorite(product.id);
    toast.success(added ? "Ajouté aux favoris" : "Retiré des favoris");
  };

  return (
    <Link to={`/product/${product.slug}`} className="product-card group" data-testid={`product-card-${product.slug}`}>
      <div className="card-image-wrapper" style={{ aspectRatio: "4/5" }}>
        <img
          src={mediaUrl(product.images?.[0])}
          alt={`${product.name} - Fyn Beauty`}
          className="card-image"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {discount && (
            <span className="bg-fyn-pink text-white label-eyebrow rounded-pill" style={{ padding: "5px 11px" }}>-{discount}</span>
          )}
          {product.is_featured && !discount && (
            <span className="bg-fyn-plum text-white label-eyebrow rounded-pill" style={{ padding: "5px 11px" }}>Bestseller</span>
          )}
          {product.stock === 0 && (
            <span className="bg-fyn-text text-white label-eyebrow rounded-pill" style={{ padding: "5px 11px" }}>Épuisé</span>
          )}
        </div>

        <button
          onClick={handleFav}
          aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
          data-testid={`favorite-toggle-${product.slug}`}
          className="absolute top-3 right-3 grid place-items-center rounded-full bg-white/85 backdrop-blur hover:bg-white transition-colors"
          style={{ width: 40, height: 40 }}
        >
          <Heart size={18} className={isFav ? "text-fyn-pink" : "text-fyn-text"} fill={isFav ? "#E8196A" : "none"} />
        </button>

        <div className="quick-add absolute bottom-0 inset-x-0 p-3">
          <button
            onClick={handleQuickAdd}
            disabled={product.stock === 0}
            data-testid={`quick-add-${product.slug}`}
            className="w-full btn-fyn-primary"
            style={{ height: 46 }}
          >
            <ShoppingBag size={16} />
            {product.stock === 0 ? "Épuisé" : adding ? "Ajouté !" : hasShades ? "Choisir" : "Ajouter"}
          </button>
        </div>
      </div>

      <div className="p-5">
        <p className="label-eyebrow text-fyn-gold mb-1.5">{product.category_name}</p>
        <h3 className="font-display text-fyn-text" style={{ fontSize: 21, fontWeight: 500, lineHeight: 1.2 }}>{product.name}</h3>
        <div className="flex items-center gap-2.5 mt-2.5">
          <span className="font-body text-fyn-pink" style={{ fontSize: 18, fontWeight: 600 }}>{formatPrice(product.price)}</span>
          {product.compare_price && (
            <span className="font-body text-fyn-muted line-through" style={{ fontSize: 14 }}>{formatPrice(product.compare_price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
