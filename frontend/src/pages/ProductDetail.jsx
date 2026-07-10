import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingBag, Minus, Plus, Truck, Check, Star } from "lucide-react";
import { toast } from "sonner";
import { api, mediaUrl } from "../services/api";
import { formatPrice, discountPercent } from "../utils/formatPrice";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import ProductCard from "../components/product/ProductCard";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion";
import { Skeleton } from "../components/ui/skeleton";

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart, openCart } = useCart();
  const { user } = useAuth();
  const fav = useFavorites();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [shade, setShade] = useState(null);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    setLoading(true);
    window.scrollTo(0, 0);
    api.get(`/products/${slug}`)
      .then((r) => {
        setProduct(r.data);
        setActiveImg(0);
        setShade(r.data.shades?.length ? r.data.shades[0].name : null);
        setQty(1);
      })
      .catch(() => navigate("/shop"))
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  if (loading || !product) {
    return (
      <div className="container-fyn pt-28 pb-16 grid lg:grid-cols-2 gap-12" id="main">
        <Skeleton className="w-full rounded-[24px]" style={{ aspectRatio: "1" }} />
        <div className="space-y-4"><Skeleton className="h-6 w-1/3" /><Skeleton className="h-10 w-2/3" /><Skeleton className="h-6 w-1/4" /><Skeleton className="h-32 w-full" /></div>
      </div>
    );
  }

  const discount = discountPercent(product.compare_price, product.price);
  const isFav = fav?.isFavorite(product.id);
  const stockLabel = product.stock === 0 ? { t: "Rupture de stock", c: "#C62828", dot: "✕" } : product.stock <= 10 ? { t: "Stock limité", c: "#E65100", dot: "⚠" } : { t: "En stock", c: "#2E7D32", dot: "●" };

  const handleAdd = () => {
    addToCart(product, shade, qty);
    toast.success("Produit ajouté au panier");
    openCart();
  };

  const handleFav = async () => {
    if (!user) { toast("Connectez-vous pour ajouter aux favoris"); return; }
    const added = await fav.toggleFavorite(product.id);
    toast.success(added ? "Ajouté aux favoris" : "Retiré des favoris");
  };

  return (
    <div className="container-fyn pt-28 pb-16" id="main">
      <div className="flex items-center gap-2 text-sm text-fyn-muted mb-8 font-body">
        <Link to="/shop" className="hover:text-fyn-pink">Boutique</Link>
        <span>/</span>
        <Link to={`/shop/${product.category_slug}`} className="hover:text-fyn-pink">{product.category_name}</Link>
        <span>/</span>
        <span className="text-fyn-text">{product.name}</span>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Gallery */}
        <div>
          <div className="relative rounded-[28px] overflow-hidden bg-fyn-gold-light group" style={{ aspectRatio: "1" }}>
            <img src={mediaUrl(product.images[activeImg])} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" data-testid="product-main-image" />
            {discount && <span className="absolute top-4 left-4 bg-fyn-pink text-white label-eyebrow rounded-pill" style={{ padding: "6px 13px" }}>-{discount}</span>}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-3 mt-4">
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)} className={`rounded-xl overflow-hidden border-2 transition-colors ${i === activeImg ? "border-fyn-pink" : "border-transparent"}`} style={{ width: 80, height: 80 }}>
                  <img src={mediaUrl(img)} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="label-eyebrow text-fyn-gold mb-2">{product.category_name}</p>
          <h1 className="font-display text-fyn-text" style={{ fontSize: "clamp(2rem, 4vw, 2.75rem)", lineHeight: 1.1 }}>{product.name}</h1>

          <div className="flex items-center gap-2 mt-3">
            <div className="flex text-fyn-gold">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={15} fill="#C9A07A" stroke="none" />)}</div>
            <span className="text-sm text-fyn-muted">({Math.floor(product.sold_count / 3) + 12} avis)</span>
          </div>

          <div className="flex items-center gap-3 mt-5">
            <span className="font-body text-fyn-pink" style={{ fontSize: 28, fontWeight: 600 }} data-testid="product-price">{formatPrice(product.price)}</span>
            {product.compare_price && <span className="font-body text-fyn-muted line-through text-lg">{formatPrice(product.compare_price)}</span>}
            {discount && <span className="text-sm font-medium" style={{ color: "#2E7D32" }}>Économisez {discount}</span>}
          </div>

          <p className="flex items-center gap-2 mt-4 text-sm font-body" style={{ color: stockLabel.c }} data-testid="stock-indicator">
            <span>{stockLabel.dot}</span> {stockLabel.t}
          </p>

          {product.shades?.length > 0 && (
            <div className="mt-7">
              <p className="label-eyebrow text-fyn-text mb-3">Teinte : <span className="text-fyn-muted normal-case tracking-normal">{shade}</span></p>
              <div className="flex flex-wrap gap-3" data-testid="shade-selector">
                {product.shades.map((s) => (
                  <button
                    key={s.name}
                    onClick={() => setShade(s.name)}
                    title={s.name}
                    aria-label={s.name}
                    className="flex flex-col items-center gap-1.5 transition-transform hover:scale-105"
                    style={{ width: 76 }}
                    data-testid={`shade-${s.name.replace(/\s/g, "-").toLowerCase()}`}
                  >
                    <span
                      className="relative rounded-xl overflow-hidden block"
                      style={{ width: 68, height: 68, border: shade === s.name ? "2px solid #1C1C1E" : "2px solid #EDE8E3", outline: shade === s.name ? "2px solid #fff" : "none", outlineOffset: "-4px" }}
                    >
                      {s.image ? (
                        <img src={mediaUrl(s.image)} alt={s.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="w-full h-full block" style={{ background: s.hex || "#EDE8E3" }} />
                      )}
                      {shade === s.name && (
                        <span className="absolute inset-0 grid place-items-center bg-black/10">
                          <Check size={20} color="#fff" style={{ mixBlendMode: "difference" }} />
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-center text-fyn-muted leading-tight line-clamp-2">{s.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 mt-7">
            <div className="flex items-center border border-fyn-border-strong rounded-pill">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid place-items-center" style={{ width: 46, height: 50 }} aria-label="Diminuer"><Minus size={16} /></button>
              <span className="w-10 text-center font-medium" data-testid="qty-value">{qty}</span>
              <button onClick={() => setQty((q) => Math.min(product.stock, q + 1))} className="grid place-items-center" style={{ width: 46, height: 50 }} aria-label="Augmenter"><Plus size={16} /></button>
            </div>
            <span className="text-sm text-fyn-muted">{product.stock} disponibles</span>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={handleAdd} disabled={product.stock === 0} className="btn-fyn-primary flex-1" style={{ height: 56 }} data-testid="add-to-cart-button">
              <ShoppingBag size={18} /> {product.stock === 0 ? "Épuisé" : "Ajouter au panier"}
            </button>
            <button onClick={handleFav} className="btn-fyn-secondary" style={{ width: 56, height: 56, padding: 0 }} aria-label="Favoris" data-testid="detail-favorite-button">
              <Heart size={20} fill={isFav ? "#E8196A" : "none"} />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-5 text-sm text-fyn-muted bg-fyn-gold-light rounded-xl p-4">
            <Truck size={18} className="text-fyn-gold" /> Livraison 500 DZD · Gratuite dès 8 000 DZD · Paiement à la livraison
          </div>

          <Accordion type="single" collapsible className="mt-8" defaultValue="desc">
            <AccordionItem value="desc">
              <AccordionTrigger className="font-display text-lg">Description</AccordionTrigger>
              <AccordionContent className="text-fyn-muted font-body">{product.description}</AccordionContent>
            </AccordionItem>
            <AccordionItem value="ingredients">
              <AccordionTrigger className="font-display text-lg">Ingrédients</AccordionTrigger>
              <AccordionContent className="text-fyn-muted font-body">Formule halal et cruelty-free enrichie à l'huile d'argan d'Algérie. Sans parabènes ni substances controversées.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="usage">
              <AccordionTrigger className="font-display text-lg">Comment l'utiliser</AccordionTrigger>
              <AccordionContent className="text-fyn-muted font-body">Appliquez sur une peau propre et hydratée. Superposez les couches pour une intensité ajustable.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="delivery">
              <AccordionTrigger className="font-display text-lg">Livraison & Retours</AccordionTrigger>
              <AccordionContent className="text-fyn-muted font-body">Livraison dans les 58 wilayas sous 2 à 5 jours. Paiement à la livraison. Retours sous 7 jours.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {product.related?.length > 0 && (
        <div className="mt-24">
          <h2 className="font-display text-fyn-text mb-8" style={{ fontSize: "clamp(2rem, 4vw, 2.75rem)" }}>Vous aimerez aussi</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {product.related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
