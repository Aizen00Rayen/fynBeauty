import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Banknote, Check, Home, Building2 } from "lucide-react";
import { toast } from "sonner";
import { api, apiError, mediaUrl } from "../services/api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { formatPrice } from "../utils/formatPrice";
import CouponInput from "../components/checkout/CouponInput";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";

const inputCls = "w-full bg-white border-[1.5px] border-fyn-border-strong rounded-md px-4 outline-none focus:border-fyn-pink focus:border-2 transition-colors";

export default function Checkout() {
  const navigate = useNavigate();
  const { items, subtotal, discount, coupon, clearCart, updateWilayaFee } = useCart();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [wilayas, setWilayas] = useState([]);
  const [deliveryType, setDeliveryType] = useState("home");
  const [deliveryFee, setDeliveryFee] = useState(null);

  const [form, setForm] = useState({
    first_name: "", last_name: "", phone: "", email: "",
    wilaya: "", commune: "", address: "", delivery_notes: "",
  });

  // Pre-fill from logged-in user
  useEffect(() => {
    if (user) {
      const parts = (user.full_name || "").split(" ");
      setForm((f) => ({
        ...f,
        first_name: parts[0] || "",
        last_name: parts.slice(1).join(" ") || "",
        phone: user.phone || "",
        email: user.email || "",
        wilaya: user.wilaya || "",
        address: user.address || "",
      }));
    }
  }, [user]);

  // Load wilaya prices once
  useEffect(() => {
    api.get("/wilayas").then((r) => setWilayas(r.data)).catch(() => {});
  }, []);

  // Redirect to cart if empty
  useEffect(() => {
    if (items.length === 0) navigate("/cart");
  }, [items.length, navigate]);

  // Recompute fee whenever wilaya or delivery type changes
  useEffect(() => {
    if (!form.wilaya) {
      setDeliveryFee(null);
      updateWilayaFee(null);
      return;
    }
    const found = wilayas.find((w) => w.name === form.wilaya);
    const fee = found
      ? (deliveryType === "office" ? found.office_price : found.home_price)
      : null;
    setDeliveryFee(fee);
    updateWilayaFee(fee);
  }, [form.wilaya, deliveryType, wilayas, updateWilayaFee]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const total = deliveryFee === null
    ? null
    : Math.max(0, subtotal + deliveryFee - discount);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.wilaya) { toast.error("Veuillez sélectionner une wilaya"); return; }
    if (deliveryFee === null) { toast.error("Prix de livraison introuvable pour cette wilaya"); return; }
    setSubmitting(true);
    try {
      const payload = {
        items: items.map((i) => ({ product_id: i.productId, shade: i.shade, quantity: i.quantity })),
        customer: {
          full_name: `${form.first_name} ${form.last_name}`.trim(),
          phone: form.phone,
          email: form.email || null,
        },
        delivery: {
          wilaya: form.wilaya,
          commune: form.commune || null,
          address: form.address,
          delivery_notes: form.delivery_notes || null,
          delivery_type: deliveryType,
        },
        coupon_code: coupon?.code || null,
      };
      const { data } = await api.post("/orders", payload);
      clearCart();
      toast.success("Commande confirmée 🎉");
      navigate(`/order/${data.id}/confirmation`);
    } catch (err) {
      toast.error(apiError(err.response?.data?.detail) || "Erreur lors de la commande");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-fyn pt-28 pb-16" id="main">
      <h1 className="font-display text-fyn-text mb-10" style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)" }}>Finaliser la commande</h1>
      <form onSubmit={submit} className="grid lg:grid-cols-[1fr_400px] gap-12">
        <div className="space-y-10">
          {/* Customer info */}
          <section>
            <h2 className="font-display text-2xl text-fyn-text mb-5">Vos informations</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="label-eyebrow text-fyn-muted block mb-2">Prénom</label><input required value={form.first_name} onChange={set("first_name")} className={inputCls} style={{ height: 52 }} data-testid="checkout-firstname" /></div>
              <div><label className="label-eyebrow text-fyn-muted block mb-2">Nom</label><input required value={form.last_name} onChange={set("last_name")} className={inputCls} style={{ height: 52 }} data-testid="checkout-lastname" /></div>
              <div><label className="label-eyebrow text-fyn-muted block mb-2">Téléphone</label><input required value={form.phone} onChange={set("phone")} placeholder="0X XX XX XX XX" className={inputCls} style={{ height: 52 }} data-testid="checkout-phone" /></div>
              <div><label className="label-eyebrow text-fyn-muted block mb-2">Email (optionnel)</label><input type="email" value={form.email} onChange={set("email")} className={inputCls} style={{ height: 52 }} data-testid="checkout-email" /></div>
            </div>
          </section>

          {/* Delivery */}
          <section>
            <h2 className="font-display text-2xl text-fyn-text mb-5">Adresse de livraison</h2>
            <div className="space-y-4">

              {/* Wilaya */}
              <div>
                <label className="label-eyebrow text-fyn-muted block mb-2">Wilaya</label>
                <Select value={form.wilaya} onValueChange={(v) => setForm({ ...form, wilaya: v })}>
                  <SelectTrigger className="border-[1.5px] border-fyn-border-strong rounded-md" style={{ height: 52 }} data-testid="checkout-wilaya">
                    <SelectValue placeholder="Sélectionnez votre wilaya" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {wilayas.map((w) => (
                      <SelectItem key={w.code} value={w.name}>{w.code} — {w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Delivery type — only show after wilaya selected */}
              {form.wilaya && (
                <div>
                  <label className="label-eyebrow text-fyn-muted block mb-3">Mode de livraison</label>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      {
                        value: "home",
                        icon: Home,
                        label: "À domicile",
                        desc: form.wilaya && wilayas.find((w) => w.name === form.wilaya)
                          ? formatPrice(wilayas.find((w) => w.name === form.wilaya).home_price)
                          : "—",
                      },
                      {
                        value: "office",
                        icon: Building2,
                        label: "Bureau / Stop Desk",
                        desc: form.wilaya && wilayas.find((w) => w.name === form.wilaya)
                          ? formatPrice(wilayas.find((w) => w.name === form.wilaya).office_price)
                          : "—",
                      },
                    ].map(({ value, icon: Icon, label, desc }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setDeliveryType(value)}
                        className={`flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-colors ${
                          deliveryType === value
                            ? "border-fyn-pink bg-fyn-pink-light/40"
                            : "border-fyn-border hover:border-fyn-pink/50"
                        }`}
                      >
                        <div className={`grid place-items-center rounded-full ${deliveryType === value ? "bg-fyn-pink text-white" : "bg-fyn-bg text-fyn-muted"}`} style={{ width: 42, height: 42 }}>
                          <Icon size={18} />
                        </div>
                        <div className="flex-1">
                          <p className="font-display text-fyn-text text-base">{label}</p>
                          <p className="text-sm text-fyn-muted">{desc}</p>
                        </div>
                        {deliveryType === value && (
                          <div className="grid place-items-center rounded-full bg-fyn-pink text-white shrink-0" style={{ width: 22, height: 22 }}>
                            <Check size={13} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div><label className="label-eyebrow text-fyn-muted block mb-2">Commune (optionnel)</label><input value={form.commune} onChange={set("commune")} className={inputCls} style={{ height: 52 }} data-testid="checkout-commune" /></div>
              <div><label className="label-eyebrow text-fyn-muted block mb-2">Adresse complète</label><textarea required value={form.address} onChange={set("address")} rows={3} className={`${inputCls} py-3`} data-testid="checkout-address" /></div>
              <div><label className="label-eyebrow text-fyn-muted block mb-2">Notes pour le livreur (optionnel)</label><textarea value={form.delivery_notes} onChange={set("delivery_notes")} rows={2} className={`${inputCls} py-3`} data-testid="checkout-notes" /></div>
            </div>
          </section>

          {/* Payment */}
          <section>
            <h2 className="font-display text-2xl text-fyn-text mb-5">Mode de paiement</h2>
            <div className="border-2 border-fyn-pink rounded-2xl p-5 flex items-center gap-4 bg-fyn-pink-light/40">
              <div className="grid place-items-center rounded-full bg-white text-fyn-pink" style={{ width: 48, height: 48 }}><Banknote size={22} /></div>
              <div className="flex-1">
                <p className="font-display text-lg text-fyn-text">Paiement à la livraison</p>
                <p className="text-sm text-fyn-muted">Payez en espèces lors de la réception de votre colis.</p>
              </div>
              <div className="grid place-items-center rounded-full bg-fyn-pink text-white" style={{ width: 24, height: 24 }}><Check size={14} /></div>
            </div>
          </section>
        </div>

        {/* Order summary */}
        <div className="lg:sticky lg:top-28 h-fit bg-white rounded-2xl border border-fyn-border p-6">
          <h2 className="font-display text-2xl text-fyn-text mb-5">Votre commande</h2>
          <div className="space-y-4 max-h-64 overflow-y-auto mb-5">
            {items.map((item) => (
              <div key={item.key} className="flex gap-3 items-center">
                <div className="relative shrink-0 rounded-lg overflow-hidden bg-fyn-gold-light" style={{ width: 56, height: 64 }}>
                  <img src={mediaUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                  <span className="absolute -top-1 -right-1 grid place-items-center rounded-full bg-fyn-pink text-white" style={{ width: 18, height: 18, fontSize: 10 }}>{item.quantity}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm text-fyn-text leading-tight truncate">{item.name}</p>
                  {item.shade && <p className="text-xs text-fyn-muted">{item.shade}</p>}
                </div>
                <span className="text-sm font-medium text-fyn-text">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <CouponInput />

          <div className="space-y-3 mt-5 text-sm font-body">
            <div className="flex justify-between text-fyn-muted"><span>Sous-total</span><span className="text-fyn-text">{formatPrice(subtotal)}</span></div>
            {discount > 0 && <div className="flex justify-between" style={{ color: "#2E7D32" }}><span>Réduction</span><span>-{formatPrice(discount)}</span></div>}
            <div className="flex justify-between text-fyn-muted">
              <span>Livraison</span>
              <span className={deliveryFee === 0 ? "" : "text-fyn-text"} style={deliveryFee === 0 ? { color: "#2E7D32" } : {}}>
                {deliveryFee === null
                  ? <span className="italic">Sélectionnez une wilaya</span>
                  : deliveryFee === 0
                    ? "GRATUITE"
                    : formatPrice(deliveryFee)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-fyn-border">
              <span className="font-display text-xl text-fyn-text">Total</span>
              <span className="font-display text-2xl text-fyn-pink" data-testid="checkout-total">
                {total === null ? "—" : formatPrice(total)}
              </span>
            </div>
          </div>

          <button type="submit" disabled={submitting || deliveryFee === null} className="btn-fyn-primary w-full mt-6 disabled:opacity-50 disabled:cursor-not-allowed" data-testid="checkout-submit-button">
            {submitting ? "Traitement..." : "Confirmer la commande"}
          </button>
          <p className="text-xs text-fyn-muted text-center mt-3">En confirmant, vous acceptez nos conditions générales.</p>
        </div>
      </form>
    </div>
  );
}
