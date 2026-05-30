import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Truck, Sparkles, Leaf, ShieldCheck, Home as HomeIcon, Building2, Banknote } from "lucide-react";
import { toast } from "sonner";
import { api, mediaUrl } from "../services/api";
import ProductCard from "../components/product/ProductCard";
import Reveal from "../components/Reveal";

import heroImg1 from "../assets/hero.jpeg";
import heroImg2 from "../assets/hero2.jpeg";
import heroImg3 from "../assets/hero3.jpeg";

const HERO_IMAGES = [heroImg1, heroImg2, heroImg3];
// Picked once per page load — changes on every refresh.
const HERO_IMG = HERO_IMAGES[Math.floor(Math.random() * HERO_IMAGES.length)];

const STORY_IMG = "https://images.unsplash.com/photo-1596205521983-9c372fb3d4f1?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200";

const BADGES = ["Cruelty Free", "Made in Algeria", "100% Halal", "Vegan"];

function Sparkle({ className, delay }) {
  return (
    <svg className={className} style={{ animationDelay: `${delay}s` }} width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10L12 0Z" fill="#E8196A" opacity="0.7" />
    </svg>
  );
}

export default function Home() {
  const [bestsellers, setBestsellers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [email, setEmail] = useState("");

  useEffect(() => {
    api.get("/products/bestsellers").then((r) => setBestsellers(r.data)).catch(() => {});
    api.get("/products?sort=newest&limit=8").then((r) => setNewArrivals(r.data.products)).catch(() => {});
    api.get("/categories").then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  const heroTitle = [
    { text: "La beauté", italic: true, weight: 300 },
    { text: "algérienne,", italic: false, weight: 400 },
    { text: "redéfinie.", italic: true, weight: 300 },
  ];

  return (
    <div id="main">
      {/* HERO */}
      <section className="relative overflow-hidden" style={{ minHeight: "100vh", paddingTop: 72 }}>
        <div className="hero-radial" />
        <Sparkle className="absolute animate-sparkle" delay={0} style={{ top: "22%", left: "12%" }} />
        <Sparkle className="absolute animate-sparkle" delay={0.6} style={{ top: "60%", left: "8%" }} />
        <Sparkle className="absolute animate-sparkle" delay={1.1} style={{ top: "30%", right: "44%" }} />

        <div className="container-fyn relative grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center" style={{ minHeight: "calc(100vh - 72px)" }}>
          <div className="py-12">
            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              className="label-eyebrow text-fyn-plum mb-6 flex items-center gap-2"
            >
              <Sparkles size={14} className="text-fyn-pink" /> Nouveauté 2026
            </motion.p>
            <h1 className="font-display text-fyn-text" style={{ fontSize: "clamp(3.5rem, 8vw, 7rem)", lineHeight: 1.02, letterSpacing: "-0.02em" }}>
              {heroTitle.map((line, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 60 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.15 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                  className="block"
                  style={{ fontStyle: line.italic ? "italic" : "normal", fontWeight: line.weight }}
                >
                  {line.text}
                </motion.span>
              ))}
            </h1>
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.6 }}
              className="text-fyn-muted mt-6 max-w-md" style={{ fontSize: 18 }}
            >
              Makeup de luxe, pensé pour vous. Des teintes inspirées du désert, des médinas et de la lumière de Tlemcen.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75, duration: 0.6 }}
              className="flex flex-wrap items-center gap-4 mt-9"
            >
              <Link to="/shop" className="btn-fyn-primary" data-testid="hero-shop-button">
                Découvrir la collection <ArrowRight size={18} />
              </Link>
              <a href="#about" className="btn-fyn-ghost">Notre histoire</a>
            </motion.div>
          </div>

          <div className="relative grid place-items-center pb-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <img src={HERO_IMG} alt="Rouge à lèvres de luxe Fyn Beauty" className="hero-product-img" style={{ maxWidth: 460, width: "100%", filter: "drop-shadow(0 40px 80px rgba(45,10,31,0.25))" }} />
              {BADGES.map((b, i) => {
                const positions = [
                  { top: "8%", left: "-4%" },
                  { top: "30%", right: "-6%" },
                  { bottom: "26%", left: "-8%" },
                  { bottom: "6%", right: "0%" },
                ];
                return (
                  <motion.span
                    key={b}
                    initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.9 + i * 0.15, duration: 0.5 }}
                    className="absolute bg-white rounded-pill label-eyebrow text-fyn-plum shadow-lg flex items-center gap-1.5"
                    style={{ padding: "9px 15px", ...positions[i] }}
                  >
                    <span className="text-fyn-pink">✦</span> {b}
                  </motion.span>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* CATEGORY PILLS */}
      <section className="container-fyn py-6">
        <div className="flex gap-5 overflow-x-auto no-scrollbar pb-2">
          {categories.map((c) => (
            <Link key={c.id} to={`/shop/${c.slug}`} className="shrink-0 text-center group" data-testid={`category-pill-${c.slug}`}>
              <div className="rounded-full overflow-hidden border border-fyn-border group-hover:border-fyn-pink transition-colors" style={{ width: 84, height: 84 }}>
                <img src={mediaUrl(c.image_url)} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <p className="mt-2.5 text-sm font-body text-fyn-text">{c.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* BESTSELLERS */}
      <section className="container-fyn py-16">
        <Reveal className="flex items-end justify-between mb-10">
          <div>
            <p className="label-eyebrow text-fyn-gold mb-2">Les chouchous de nos clientes</p>
            <h2 className="font-display text-fyn-text" style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)", lineHeight: 1.1 }}>Nos Bestsellers</h2>
          </div>
          <Link to="/shop" className="btn-fyn-ghost hidden sm:flex">Voir tout <ArrowRight size={16} /></Link>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {bestsellers.slice(0, 4).map((p, i) => (
            <Reveal key={p.id} delay={i * 80}><ProductCard product={p} /></Reveal>
          ))}
        </div>
      </section>

      {/* BRAND STORY */}
      <section id="about" className="py-20" style={{ background: "#F5EDE3" }}>
        <div className="container-fyn grid lg:grid-cols-2 gap-14 items-center">
          <Reveal className="rounded-[32px] overflow-hidden" style={{ aspectRatio: "4/5" }}>
            <img src={STORY_IMG} alt="Femme algérienne sublimée par Fyn Beauty" className="w-full h-full object-cover" />
          </Reveal>
          <Reveal>
            <p className="label-eyebrow text-fyn-pink mb-3">Notre histoire</p>
            <h2 className="font-display text-fyn-text" style={{ fontSize: "clamp(2.2rem, 4.5vw, 3.25rem)", lineHeight: 1.12 }}>
              Née à Tlemcen,<br />pour toutes les femmes
            </h2>
            <p className="text-fyn-muted mt-5 max-w-lg">
              Fondée en 2026 à Tlemcen, Fyn Beauty célèbre la beauté méditerranéenne avec des formules halal, cruelty-free et fabriquées en Algérie. Des couleurs pensées pour nos carnations, nos rituels et notre élégance.
            </p>
            <div className="grid grid-cols-3 gap-6 mt-10">
              {[{ icon: ShieldCheck, t: "100% Halal" }, { icon: Leaf, t: "Cruelty Free" }, { icon: Sparkles, t: "Fabriqué en Algérie" }].map(({ icon: Icon, t }) => (
                <div key={t}>
                  <div className="grid place-items-center rounded-full bg-white text-fyn-pink mb-3" style={{ width: 52, height: 52 }}><Icon size={22} /></div>
                  <p className="font-display text-lg text-fyn-text leading-tight">{t}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* NEW ARRIVALS */}
      <section className="container-fyn py-16">
        <Reveal className="mb-8">
          <p className="label-eyebrow text-fyn-gold mb-2">Tout juste arrivés</p>
          <h2 className="font-display text-fyn-text" style={{ fontSize: "clamp(2.2rem, 4.5vw, 3rem)" }}>Nouveautés</h2>
        </Reveal>
        <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4" style={{ scrollSnapType: "x mandatory" }}>
          {newArrivals.map((p) => (
            <div key={p.id} className="shrink-0" style={{ width: 280, scrollSnapAlign: "start" }}>
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </section>

      {/* DELIVERY BANNER */}
      <section className="container-fyn">
        <Reveal className="relative overflow-hidden rounded-[32px] bg-fyn-plum text-white px-8 sm:px-16 py-14">
          {/* Background blobs */}
          <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full" style={{ background: "rgba(232,25,106,0.18)" }} />
          <div className="absolute -bottom-16 -left-10 w-56 h-56 rounded-full" style={{ background: "rgba(201,160,122,0.13)" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl" style={{ background: "rgba(232,25,106,0.06)" }} />

          <div className="relative flex flex-col lg:flex-row items-center gap-10">
            {/* Left text */}
            <div className="flex-1 text-center lg:text-left">
              <p className="label-eyebrow text-fyn-gold mb-3">Livraison nationale</p>
              <h2 className="font-display" style={{ fontSize: "clamp(2rem, 4.5vw, 3.2rem)", lineHeight: 1.1 }}>
                Livrée chez vous,<br />
                <span style={{ color: "#E8196A" }}>où que vous soyez.</span>
              </h2>
              <p className="text-white/60 mt-4 max-w-sm" style={{ fontSize: 15 }}>
                Domicile ou bureau Stop Desk — choisissez le mode qui vous convient, dans chaque wilaya d'Algérie.
              </p>
              <Link to="/shop" className="btn-fyn-primary mt-7 inline-flex">Commander maintenant <ArrowRight size={17} /></Link>
            </div>

            {/* Right feature cards */}
            <div className="grid sm:grid-cols-3 lg:grid-cols-1 gap-3 lg:w-64 w-full">
              {[
                { icon: HomeIcon, title: "À domicile", desc: "Reçue directement chez vous, sans vous déplacer" },
                { icon: Building2, title: "Bureau / Stop Desk", desc: "Récupérez votre colis au bureau le plus proche" },
                { icon: Banknote, title: "Paiement à la livraison", desc: "Gratuite dès 8 000 DZD d'achat" },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3 rounded-2xl px-4 py-3.5" style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(8px)" }}>
                  <div className="grid place-items-center rounded-xl shrink-0" style={{ width: 38, height: 38, background: "rgba(232,25,106,0.25)" }}>
                    <Icon size={17} className="text-fyn-pink" />
                  </div>
                  <div>
                    <p className="font-display text-white text-sm leading-tight">{title}</p>
                    <p className="text-white/50 text-xs mt-0.5 leading-snug">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* NEWSLETTER */}
      <section className="container-fyn py-20 text-center">
        <Reveal>
          <p className="label-eyebrow text-fyn-pink mb-3">Communauté Fyn</p>
          <h2 className="font-display text-fyn-text mx-auto" style={{ fontSize: "clamp(2rem, 4vw, 2.75rem)", maxWidth: 600 }}>Rejoignez la communauté Fyn Beauty</h2>
          <form
            onSubmit={(e) => { e.preventDefault(); if (email) { toast.success("Merci ! Vous êtes inscrite 💌"); setEmail(""); } }}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mt-8"
          >
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Votre adresse email"
              className="flex-1 bg-white border border-fyn-border-strong rounded-pill px-6 outline-none focus:border-fyn-pink transition-colors" style={{ height: 52 }}
              data-testid="newsletter-input"
            />
            <button type="submit" className="btn-fyn-primary" style={{ height: 52 }} data-testid="newsletter-submit">S'inscrire</button>
          </form>
          <p className="text-xs text-fyn-muted mt-4">Pas de spam, promis.</p>
        </Reveal>
      </section>
    </div>
  );
}
