import { Link } from "react-router-dom";
import { Sparkles, ShieldCheck, Leaf, MapPin, Heart } from "lucide-react";
import Reveal from "../components/Reveal";

const HERO = "https://images.unsplash.com/photo-1596205521983-9c372fb3d4f1?crop=entropy&cs=srgb&fm=jpg&q=85&w=1400";
const SIDE = "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200";

const VALUES = [
  { icon: ShieldCheck, t: "100% Halal", d: "Des formules certifiées, respectueuses de nos valeurs." },
  { icon: Leaf, t: "Cruelty Free", d: "Jamais testé sur les animaux, toujours sur l'amour." },
  { icon: Sparkles, t: "Fabriqué en Algérie", d: "Une fierté locale, de Tlemcen à toute l'Algérie." },
];

export default function About() {
  return (
    <div id="main">
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ paddingTop: 120 }}>
        <div className="hero-radial" />
        <div className="container-fyn relative pb-12">
          <Reveal>
            <p className="label-eyebrow text-fyn-pink mb-4 flex items-center gap-2"><MapPin size={14} /> Tlemcen, Algérie · Depuis 2026</p>
            <h1 className="font-display text-fyn-text" style={{ fontSize: "clamp(2.75rem, 7vw, 5.5rem)", lineHeight: 1.05, letterSpacing: "-0.02em" }}>
              <span style={{ fontStyle: "italic", fontWeight: 300 }}>Notre</span> histoire,<br />
              née à <span style={{ fontStyle: "italic", fontWeight: 300 }}>Tlemcen.</span>
            </h1>
            <p className="text-fyn-muted mt-6 max-w-2xl text-lg">
              Fyn Beauty est une jeune maison de cosmétiques fondée en 2026 au cœur de Tlemcen, berceau de l'élégance et du raffinement algériens. Notre mission : redéfinir la beauté méditerranéenne avec des produits de luxe pensés pour toutes les femmes.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Story split */}
      <section className="container-fyn py-16">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          <Reveal className="rounded-[32px] overflow-hidden" style={{ aspectRatio: "4/5" }}>
            <img src={HERO} alt="L'esprit Fyn Beauty" className="w-full h-full object-cover" />
          </Reveal>
          <Reveal>
            <p className="label-eyebrow text-fyn-gold mb-3">Nos origines</p>
            <h2 className="font-display text-fyn-text" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.12 }}>De la médina de Tlemcen au monde</h2>
            <div className="space-y-4 mt-5 text-fyn-muted">
              <p>Inspirée par la richesse de l'artisanat tlemcénien — ses broderies, ses parfums, ses couleurs — Fyn Beauty est née d'une conviction simple : les femmes algériennes méritent un maquillage de luxe conçu pour leurs carnations et leur culture.</p>
              <p>Chaque teinte raconte une histoire : les couchers de soleil sur le Sahara, le rouge des médinas, l'or des bijoux kabyles. Nous formulons localement, en Algérie, avec des ingrédients halal et une démarche cruelty-free.</p>
              <p>En 2026, nous lançons notre première collection. Ce n'est que le début d'un voyage que nous avons hâte de partager avec vous.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Values */}
      <section className="py-20" style={{ background: "#F5EDE3" }}>
        <div className="container-fyn">
          <Reveal className="text-center mb-12">
            <p className="label-eyebrow text-fyn-pink mb-3">Nos engagements</p>
            <h2 className="font-display text-fyn-text" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>Ce qui nous tient à cœur</h2>
          </Reveal>
          <div className="grid sm:grid-cols-3 gap-8">
            {VALUES.map(({ icon: Icon, t, d }, i) => (
              <Reveal key={t} delay={i * 80} className="text-center">
                <div className="grid place-items-center rounded-full bg-white text-fyn-pink mx-auto mb-4" style={{ width: 64, height: 64 }}><Icon size={26} /></div>
                <h3 className="font-display text-2xl text-fyn-text">{t}</h3>
                <p className="text-fyn-muted mt-2 text-sm max-w-xs mx-auto">{d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Image + numbers */}
      <section className="container-fyn py-16">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          <Reveal>
            <p className="label-eyebrow text-fyn-gold mb-3">La promesse Fyn</p>
            <h2 className="font-display text-fyn-text" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.12 }}>Le luxe, accessible et livré chez vous</h2>
            <p className="text-fyn-muted mt-5">Nous livrons dans les 58 wilayas d'Algérie avec paiement à la livraison. Pas de carte bancaire requise : commandez en toute confiance et payez à réception.</p>
            <div className="grid grid-cols-3 gap-6 mt-10">
              {[{ n: "58", l: "Wilayas livrées" }, { n: "2026", l: "Année de création" }, { n: "100%", l: "Halal & Cruelty Free" }].map((s) => (
                <div key={s.l}>
                  <p className="font-display text-fyn-pink" style={{ fontSize: 40, lineHeight: 1 }}>{s.n}</p>
                  <p className="text-sm text-fyn-muted mt-1">{s.l}</p>
                </div>
              ))}
            </div>
            <Link to="/shop" className="btn-fyn-primary mt-9">Découvrir la collection</Link>
          </Reveal>
          <Reveal className="rounded-[32px] overflow-hidden" style={{ aspectRatio: "4/5" }}>
            <img src={SIDE} alt="Cosmétiques Fyn Beauty" className="w-full h-full object-cover" />
          </Reveal>
        </div>
      </section>

      {/* CTA banner */}
      <section className="container-fyn pb-16">
        <Reveal className="relative overflow-hidden rounded-[32px] bg-fyn-plum text-white px-8 sm:px-16 py-16 text-center">
          <Heart className="mx-auto text-fyn-gold mb-5" size={34} />
          <h2 className="font-display" style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)", lineHeight: 1.1 }}>Rejoignez l'aventure Fyn Beauty</h2>
          <p className="text-white/75 mt-4 text-lg">contact@fynbeauty.store · Tlemcen, Algérie</p>
          <Link to="/nouveautes" className="btn-fyn-primary mt-8">Voir les nouveautés</Link>
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full" style={{ background: "rgba(232,25,106,0.25)" }} />
          <div className="absolute -bottom-16 -left-10 w-48 h-48 rounded-full" style={{ background: "rgba(201,160,122,0.18)" }} />
        </Reveal>
      </section>
    </div>
  );
}
