export default function StatCard({ title, value, sub, accent = false, danger = false }) {
  const borderColor = danger ? "#ef4444" : accent ? "#ea580c" : "#e2e8f0";
  const valueColor = danger ? "#ef4444" : accent ? "#ea580c" : "#1e293b";

  return (
    <div style={{
      background: "#fff",
      border: `1px solid ${borderColor}`,
      borderTop: `3px solid ${borderColor}`,
      borderRadius: 8,
      padding: "16px 18px",
    }}>
      <div style={{ fontSize: 11, color: "#64748b", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: valueColor, lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>{sub}</div>}
    </div>
  );
}
