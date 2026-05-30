import { useState } from "react";
import { Check, X, Tag } from "lucide-react";
import { toast } from "sonner";
import { api, apiError } from "../../services/api";
import { useCart } from "../../context/CartContext";

export default function CouponInput() {
  const { subtotal, coupon, applyCoupon, removeCoupon } = useCart();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const apply = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post("/coupons/validate", { code: code.trim(), orderAmount: subtotal });
      applyCoupon({
        code: data.code,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minOrder: subtotal >= 0 ? 0 : 0,
      });
      toast.success(`Code appliqué ! ${data.discountType === "percentage" ? `-${data.discountValue}%` : `-${data.discountValue} DZD`}`);
      setCode("");
    } catch (err) {
      toast.error(apiError(err.response?.data?.detail) || "Code invalide ou expiré");
    } finally {
      setLoading(false);
    }
  };

  if (coupon) {
    return (
      <div className="flex items-center justify-between rounded-xl p-3" style={{ background: "#EAF5EB" }} data-testid="coupon-applied">
        <span className="flex items-center gap-2 text-sm font-medium" style={{ color: "#2E7D32" }}>
          <Check size={16} /> Code « {coupon.code} » appliqué
        </span>
        <button onClick={() => { removeCoupon(); toast("Code retiré"); }} aria-label="Retirer le code" className="text-fyn-muted hover:text-fyn-pink"><X size={16} /></button>
      </div>
    );
  }

  return (
    <div>
      <label className="label-eyebrow text-fyn-muted flex items-center gap-1.5 mb-2"><Tag size={13} /> Code promo</label>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), apply())}
          placeholder="FYNE20"
          className="flex-1 bg-white border-[1.5px] border-fyn-border-strong rounded-md px-4 outline-none focus:border-fyn-pink transition-colors uppercase"
          style={{ height: 48 }}
          data-testid="coupon-input"
        />
        <button onClick={apply} disabled={loading} className="btn-fyn-secondary" style={{ height: 48, padding: "0 20px" }} data-testid="coupon-apply">
          {loading ? "..." : "Appliquer"}
        </button>
      </div>
    </div>
  );
}
