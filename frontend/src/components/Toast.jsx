import { useEffect } from "react";

const icons = {
  success: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" /><polyline points="9 12 11 14 15 10" />
    </svg>
  ),
  error: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  info: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
};

const styles = {
  success: { bg: "#f0fdf4", border: "#86efac", color: "#15803d", icon: "#16a34a" },
  error:   { bg: "#fef2f2", border: "#fca5a5", color: "#b91c1c", icon: "#dc2626" },
  info:    { bg: "#eff6ff", border: "#93c5fd", color: "#1d4ed8", icon: "#2563eb" },
};

export default function Toast({ message, type = "success", onClose }) {
  const s = styles[type] || styles.info;

  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div style={{
      position: "fixed", top: 20, right: 20, zIndex: 9999,
      display: "flex", alignItems: "flex-start", gap: 10,
      background: s.bg, border: `1px solid ${s.border}`,
      borderLeft: `4px solid ${s.icon}`,
      borderRadius: 10, padding: "12px 16px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
      minWidth: 280, maxWidth: 380,
      animation: "slideIn 0.25s ease",
    }}>
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}`}</style>
      <span style={{ color: s.icon, flexShrink: 0, marginTop: 1 }}>{icons[type]}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: s.color }}>{
          type === "success" ? "Success" : type === "error" ? "Error" : "Info"
        }</div>
        <div style={{ fontSize: 12, color: s.color, opacity: 0.85, marginTop: 2 }}>{message}</div>
      </div>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: s.color, opacity: 0.6, fontSize: 16, lineHeight: 1, padding: 0 }}>✕</button>
    </div>
  );
}
