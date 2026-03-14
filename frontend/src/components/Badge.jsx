export default function Badge({ label, type = "default" }) {
  const map = {
    overdue:  { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
    paid:     { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
    pending:  { bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
    default:  { bg: "#f8fafc", color: "#64748b", border: "#e2e8f0" },
  };
  const s = map[type] || map.default;
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 600,
      background: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
    }}>
      {label}
    </span>
  );
}
