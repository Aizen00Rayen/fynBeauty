import { Link } from "react-router-dom";

export default function Logo({ light = false, className = "" }) {
  const color = light ? "#FFFFFF" : "#1C1C1E";
  return (
    <Link to="/" className={`inline-flex items-end leading-none ${className}`} data-testid="logo-link" aria-label="Fyn Beauty - Accueil">
      <span className="font-display" style={{ fontSize: "30px", fontWeight: 600, color, letterSpacing: "-0.01em", position: "relative", paddingBottom: "2px" }}>
        <span style={{ position: "relative" }}>
          F
          <span
            aria-hidden
            style={{
              position: "absolute",
              left: "1px",
              bottom: "-3px",
              width: "16px",
              height: "4px",
              background: "#E8196A",
              borderRadius: "2px",
            }}
          />
        </span>
        yn
      </span>
      <span
        className="font-body"
        style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.32em", color: light ? "#E0CFD9" : "#6E6E73", marginLeft: "6px", marginBottom: "5px", fontWeight: 500 }}
      >
        Beauty
      </span>
    </Link>
  );
}
