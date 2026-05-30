import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Tag, ArrowRight } from "lucide-react";
import { api } from "../services/api";
import ProductCard from "../components/product/ProductCard";
import Reveal from "../components/Reveal";
import { Skeleton } from "../components/ui/skeleton";

export default function Nouveautes() {
  const [newArrivals, setNewArrivals] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    Promise.all([
      api.get("/products?sort=newest&limit=8"),
      api.get("/products?on_sale=true&sort=newest&limit=8"),
    ])
      .then(([n, d]) => { setNewArrivals(n.data.products); setDeals(d.data.products); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div id="main" className="pt-28 pb-16">
      {/* Hero band */}
      <section className="container-fyn">
        <Reveal className="relative overflow-hidden rounded-[32px] px-8 sm:px-14 py-14" style={{ background: "linear-gradient(120deg, #2D0A1F 0%, #5C2040 100%)" }}>
          <p className="label-eyebrow text-fyn-gold mb-3 flex items-center gap-2"><Sparkles size={14} /> Fraîchement arrivées</p>
          <h1 className="font-display text-white" style={{ fontSize: "clamp(2.75rem, 6vw, 4.5rem)", lineHeight: 1.05 }}>Nouveautés <span style={{ fontStyle: "italic", fontWeight: 300 }}>&amp; meilleures offres</span></h1>
          <p className="text-white/75 mt-4 max-w-xl text-lg">Les dernières créations Fyn et nos promotions du moment, réunies au même endroit.</p>
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full" style={{ background: "rgba(232,25,106,0.3)" }} />
        </Reveal>
      </section>

      {/* Best deals */}
      <section className="container-fyn pt-16">
        <Reveal className="flex items-end justify-between mb-8">
          <div>
            <p className="label-eyebrow text-fyn-gold mb-2 flex items-center gap-2"><Tag size={14} /> Promotions</p>
            <h2 className="font-display text-fyn-text" style={{ fontSize: "clamp(2rem, 4.5vw, 3rem)" }}>Meilleures offres</h2>
          </div>
          <Link to="/shop" className="btn-fyn-ghost hidden sm:flex">Toute la boutique <ArrowRight size={16} /></Link>
        </Reveal>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="w-full rounded-[24px]" style={{ aspectRatio: "4/5" }} />)}</div>
        ) : deals.length === 0 ? (
          <p className="text-fyn-muted">Aucune offre en cours pour le moment.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {deals.map((p, i) => <Reveal key={p.id} delay={i * 60}><ProductCard product={p} /></Reveal>)}
          </div>
        )}
      </section>

      {/* New arrivals */}
      <section className="container-fyn pt-20">
        <Reveal className="flex items-end justify-between mb-8">
          <div>
            <p className="label-eyebrow text-fyn-gold mb-2 flex items-center gap-2"><Sparkles size={14} /> Tout juste arrivés</p>
            <h2 className="font-display text-fyn-text" style={{ fontSize: "clamp(2rem, 4.5vw, 3rem)" }}>Nouveautés</h2>
          </div>
        </Reveal>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="w-full rounded-[24px]" style={{ aspectRatio: "4/5" }} />)}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {newArrivals.map((p, i) => <Reveal key={p.id} delay={i * 60}><ProductCard product={p} /></Reveal>)}
          </div>
        )}

        <div className="text-center mt-14">
          <Link to="/shop" className="btn-fyn-secondary">Voir toute la collection</Link>
        </div>
      </section>
    </div>
  );
}
