export const ORDER_STATUS = {
  pending: { label: "En attente", bg: "#FFF4E0", color: "#E65100" },
  confirmed: { label: "Confirmée", bg: "#E3F0FB", color: "#1565C0" },
  preparing: { label: "En préparation", bg: "#F0E7FB", color: "#6A1B9A" },
  shipped: { label: "Expédiée", bg: "#E0F7FA", color: "#00838F" },
  delivered: { label: "Livrée", bg: "#EAF5EB", color: "#2E7D32" },
  cancelled: { label: "Annulée", bg: "#FDECEC", color: "#C62828" },
};

export const STATUS_FLOW = ["pending", "confirmed", "preparing", "shipped", "delivered"];

export function StatusBadge({ status, testId }) {
  const s = ORDER_STATUS[status] || ORDER_STATUS.pending;
  return (
    <span
      className="inline-flex items-center rounded-pill label-eyebrow"
      style={{ background: s.bg, color: s.color, padding: "5px 12px" }}
      data-testid={testId}
    >
      {s.label}
    </span>
  );
}
