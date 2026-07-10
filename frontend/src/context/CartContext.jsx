import { createContext, useContext, useState, useEffect, useCallback } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "fyn_cart";
const COUPON_KEY = "fyn_coupon";

function itemKey(productId, shade) {
  return `${productId}|${shade || ""}`;
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  });
  const [coupon, setCoupon] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(COUPON_KEY)) || null;
    } catch {
      return null;
    }
  });
  const [isOpen, setIsOpen] = useState(false);
  const [bump, setBump] = useState(0);
  // Set by the checkout page once the user picks a wilaya + delivery type
  const [wilayaFee, setWilayaFee] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(COUPON_KEY, JSON.stringify(coupon));
  }, [coupon]);

  const addToCart = useCallback((product, shade = null, quantity = 1) => {
    setItems((prev) => {
      const key = itemKey(product.id, shade);
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) =>
          i.key === key ? { ...i, quantity: Math.min(i.quantity + quantity, i.stock || 99) } : i
        );
      }
      return [
        ...prev,
        {
          key,
          productId: product.id,
          name: product.name,
          slug: product.slug,
          image: product.images?.[0] || "",
          price: product.price,
          shade,
          quantity,
          stock: product.stock,
        },
      ];
    });
    setBump((b) => b + 1);
  }, []);

  const removeFromCart = useCallback((key) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }, []);

  const updateQuantity = useCallback((key, quantity) => {
    setItems((prev) =>
      prev.map((i) => (i.key === key ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock || 99)) } : i))
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setCoupon(null);
    setWilayaFee(null);
  }, []);

  const applyCoupon = useCallback((couponData) => setCoupon(couponData), []);
  const removeCoupon = useCallback(() => setCoupon(null), []);
  const updateWilayaFee = useCallback((fee) => setWilayaFee(fee), []);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  // null = unknown (no wilaya selected yet); 0 = empty cart; >0 = exact fee
  const deliveryFee = subtotal === 0 ? 0 : wilayaFee; // null until checkout picks a wilaya

  let discount = 0;
  if (coupon && subtotal >= (coupon.minOrder || 0)) {
    discount =
      coupon.discountType === "percentage"
        ? Math.round((subtotal * coupon.discountValue) / 100)
        : Math.min(coupon.discountValue, subtotal);
  }
  // If deliveryFee is null, total is also null (can't compute without wilaya)
  const total = deliveryFee === null ? null : Math.max(0, subtotal + deliveryFee - discount);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        coupon,
        applyCoupon,
        removeCoupon,
        updateWilayaFee,
        isOpen,
        openCart,
        closeCart,
        itemCount,
        subtotal,
        deliveryFee,
        discount,
        total,
        bump,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
