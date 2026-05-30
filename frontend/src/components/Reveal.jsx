import { useScrollReveal } from "../hooks/useScrollReveal";

export default function Reveal({ children, className = "", style = {}, delay = 0, as: Tag = "div" }) {
  const ref = useScrollReveal();
  return (
    <Tag ref={ref} className={className} style={{ ...style, transitionDelay: delay ? `${delay}ms` : undefined }}>
      {children}
    </Tag>
  );
}
