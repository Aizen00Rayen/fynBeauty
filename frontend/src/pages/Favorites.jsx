import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { api } from "../services/api";
import ProductCard from "../components/product/ProductCard";
import { useFavorites } from "../context/FavoritesContext";
import { Skeleton } from "../components/ui/skeleton";

export default function Favorites() {
  const { ids } = useFavorites();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get("/users/favorites").then((r) => setProducts(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [ids.length]);

  return (
    <div className="container-fyn pt-28 pb-16" id="main">
      <p className="label-eyebrow text-fyn-gold mb-2">Votre sélection</p>
      <h1 className="font-display text-fyn-text mb-10" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}>Mes favoris</h1>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="w-full rounded-[24px]" style={{ aspectRatio: "4/5" }} />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-24">
          <div className="grid place-items-center rounded-full bg-fyn-pink-light mx-auto" style={{ width: 110, height: 110 }}>
            <Heart size={42} className="text-fyn-pink" />
          </div>
          <h2 className="font-display text-3xl text-fyn-text mt-8">Vous n'avez pas encore de favoris</h2>
          <p className="text-fyn-muted mt-2">Cliquez sur le cœur d'un produit pour le retrouver ici.</p>
          <Link to="/shop" className="btn-fyn-primary mt-8">Découvrir la collection</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
