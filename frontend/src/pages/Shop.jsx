import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X } from "lucide-react";
import { api } from "../services/api";
import ProductCard from "../components/product/ProductCard";
import { Slider } from "../components/ui/slider";
import { Checkbox } from "../components/ui/checkbox";
import { Switch } from "../components/ui/switch";
import { Skeleton } from "../components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import { formatPrice } from "../utils/formatPrice";

const SORTS = [
  { value: "newest", label: "Nouveautés" },
  { value: "popular", label: "Plus populaire" },
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
];

export default function Shop() {
  const { category: routeCategory } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") || "";

  const [categories, setCategories] = useState([]);
  const [selectedCats, setSelectedCats] = useState(routeCategory ? [routeCategory] : []);
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [inStock, setInStock] = useState(false);
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [mobileFilters, setMobileFilters] = useState(false);

  useEffect(() => {
    api.get("/categories").then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setSelectedCats(routeCategory ? [routeCategory] : []);
    setPage(1);
  }, [routeCategory]);

  const fetchProducts = useCallback(async (reset = true) => {
    setLoading(true);
    const params = { sort, page: reset ? 1 : page, limit: 12 };
    if (selectedCats.length === 1) params.category = selectedCats[0];
    if (search) params.search = search;
    if (inStock) params.in_stock = true;
    if (priceRange[0] > 0) params.min_price = priceRange[0];
    if (priceRange[1] < 50000) params.max_price = priceRange[1];
    try {
      const { data } = await api.get("/products", { params });
      setTotal(data.total);
      if (reset) setProducts(data.products);
      else setProducts((prev) => [...prev, ...data.products]);
    } finally {
      setLoading(false);
    }
  }, [sort, selectedCats, search, inStock, priceRange, page]);

  useEffect(() => {
    setPage(1);
    fetchProducts(true);
    // eslint-disable-next-line
  }, [sort, selectedCats, search, inStock, priceRange]);

  useEffect(() => {
    if (page > 1) fetchProducts(false);
    // eslint-disable-next-line
  }, [page]);

  const toggleCat = (slug) => {
    setSelectedCats((prev) => (prev.includes(slug) ? prev.filter((c) => c !== slug) : [slug]));
  };

  const clearFilters = () => {
    setSelectedCats([]);
    setPriceRange([0, 50000]);
    setInStock(false);
    if (search) setSearchParams({});
  };

  const activeChips = [];
  selectedCats.forEach((c) => {
    const cat = categories.find((x) => x.slug === c);
    if (cat) activeChips.push({ label: cat.name, onRemove: () => toggleCat(c) });
  });
  if (inStock) activeChips.push({ label: "En stock", onRemove: () => setInStock(false) });
  if (search) activeChips.push({ label: `« ${search} »`, onRemove: () => setSearchParams({}) });

  const FiltersPanel = () => (
    <div className="space-y-8">
      <div>
        <h3 className="label-eyebrow text-fyn-text mb-4">Catégories</h3>
        <div className="space-y-3">
          {categories.map((c) => (
            <label key={c.id} className="flex items-center gap-3 cursor-pointer" data-testid={`filter-cat-${c.slug}`}>
              <Checkbox checked={selectedCats.includes(c.slug)} onCheckedChange={() => toggleCat(c.slug)} />
              <span className="font-body text-sm text-fyn-text flex-1">{c.name}</span>
              <span className="text-xs text-fyn-muted">{c.product_count}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="label-eyebrow text-fyn-text mb-4">Prix</h3>
        <Slider value={priceRange} onValueChange={setPriceRange} min={0} max={50000} step={500} className="mb-3" data-testid="price-slider" />
        <div className="flex justify-between text-sm text-fyn-muted font-body">
          <span>{formatPrice(priceRange[0])}</span>
          <span>{formatPrice(priceRange[1])}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="font-body text-sm text-fyn-text">En stock uniquement</span>
        <Switch checked={inStock} onCheckedChange={setInStock} data-testid="filter-instock" />
      </div>

      <button onClick={clearFilters} className="btn-fyn-ghost">Réinitialiser les filtres</button>
    </div>
  );

  return (
    <div className="container-fyn pt-28 pb-16" id="main">
      <div className="mb-8">
        <p className="label-eyebrow text-fyn-gold mb-2">Boutique</p>
        <h1 className="font-display text-fyn-text" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}>
          {selectedCats.length === 1 ? categories.find((c) => c.slug === selectedCats[0])?.name || "Collection" : "Toute la collection"}
        </h1>
      </div>

      <div className="grid lg:grid-cols-[250px_1fr] gap-10">
        <aside className="hidden lg:block">
          <FiltersPanel />
        </aside>

        <div>
          <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
            <p className="font-body text-sm text-fyn-muted" data-testid="results-count">{total} produit{total > 1 ? "s" : ""} trouvé{total > 1 ? "s" : ""}</p>
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileFilters(true)} className="lg:hidden btn-fyn-secondary" style={{ height: 44, padding: "0 18px" }}>
                <SlidersHorizontal size={16} /> Filtres
              </button>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-[190px] rounded-pill border-fyn-border-strong" style={{ height: 44 }} data-testid="sort-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORTS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {activeChips.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {activeChips.map((chip, i) => (
                <button key={i} onClick={chip.onRemove} className="flex items-center gap-1.5 bg-fyn-pink-light text-fyn-pink-dark rounded-pill text-xs font-body" style={{ padding: "6px 12px" }}>
                  {chip.label} <X size={13} />
                </button>
              ))}
            </div>
          )}

          {loading && products.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}><Skeleton className="w-full rounded-[24px]" style={{ aspectRatio: "4/5" }} /><Skeleton className="h-4 w-1/2 mt-4" /><Skeleton className="h-5 w-1/3 mt-2" /></div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-24">
              <p className="font-display text-3xl text-fyn-text">Aucun produit trouvé</p>
              <p className="text-fyn-muted mt-2">Essayez d'ajuster vos filtres.</p>
              <button onClick={clearFilters} className="btn-fyn-primary mt-6">Réinitialiser</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
              {products.length < total && (
                <div className="text-center mt-12">
                  <button onClick={() => setPage((p) => p + 1)} className="btn-fyn-secondary" data-testid="load-more">Charger plus</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile filters bottom sheet */}
      {mobileFilters && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFilters(false)} />
          <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-[28px] p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl">Filtres</h2>
              <button onClick={() => setMobileFilters(false)} aria-label="Fermer" className="grid place-items-center" style={{ width: 44, height: 44 }}><X size={24} /></button>
            </div>
            <FiltersPanel />
            <button onClick={() => setMobileFilters(false)} className="btn-fyn-primary w-full mt-8">Voir les résultats ({total})</button>
          </div>
        </div>
      )}
    </div>
  );
}
