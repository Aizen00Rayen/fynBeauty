import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import Logo from "../Logo";

export default function Footer() {
  return (
    <footer className="bg-fyn-plum text-white mt-24" data-testid="footer">
      <div className="container-fyn py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-1">
            <div className="inline-flex bg-white rounded-pill px-4 py-2">
              <Logo />
            </div>
            <p className="mt-5 text-sm text-white/70 max-w-xs font-body">
              La beauté algérienne, redéfinie. Makeup de luxe, halal et cruelty-free, pensé pour toutes les femmes.
            </p>
          </div>

          <div>
            <h4 className="label-eyebrow text-fyn-gold mb-5">Boutique</h4>
            <ul className="space-y-3 text-sm text-white/75 font-body">
              <li><Link to="/shop/levres" className="hover:text-fyn-pink transition-colors">Lèvres</Link></li>
              <li><Link to="/shop/yeux" className="hover:text-fyn-pink transition-colors">Yeux</Link></li>
              <li><Link to="/shop/teint" className="hover:text-fyn-pink transition-colors">Teint</Link></li>
              <li><Link to="/shop/soins" className="hover:text-fyn-pink transition-colors">Soins</Link></li>
              <li><Link to="/shop/kits-sets" className="hover:text-fyn-pink transition-colors">Kits & Sets</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="label-eyebrow text-fyn-gold mb-5">Aide</h4>
            <ul className="space-y-3 text-sm text-white/75 font-body">
              <li><Link to="/apropos" className="hover:text-fyn-pink transition-colors">À propos</Link></li>
              <li><Link to="/shop" className="hover:text-fyn-pink transition-colors">Livraison & Retours</Link></li>
              <li><Link to="/nouveautes" className="hover:text-fyn-pink transition-colors">Nouveautés & Offres</Link></li>
              <li><Link to="/shop" className="hover:text-fyn-pink transition-colors">Conditions générales</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="label-eyebrow text-fyn-gold mb-5">Contact</h4>
            <ul className="space-y-3 text-sm text-white/75 font-body">
              <li className="flex items-center gap-2"><Mail size={15} /> contact@fynbeauty.store</li>
              <li className="text-white/60">Tlemcen, Algérie</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-14 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-white/50 font-body text-center sm:text-left">
            <p>© {new Date().getFullYear()} Fyn Beauty. Tous droits réservés.</p>
            <p className="mt-1 text-white/35">Créé par <span className="text-white/50">HOUARI A. Rayen</span> &amp; <span className="text-white/50">Spectra Agency Team</span></p>
          </div>
          <div className="flex items-center gap-4 text-xs text-white/50 font-body">
            <span>Paiement à la livraison</span>
            <span className="text-fyn-gold">✦</span>
            <span>Fabriqué en Algérie</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
