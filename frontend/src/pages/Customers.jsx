import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCustomers } from "../api/api";
import { downloadCSV, downloadPDF, customerColumns } from "../utils/exportUtils";

const fmt = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    getCustomers().then((r) => setCustomers(r.data));
  }, []);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1e293b", margin: 0 }}>Parties / Customers</h1>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: "3px 0 0" }}>{customers.length} total parties</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={() => downloadCSV(`customers-${Date.now()}.csv`, customerColumns, customers)}
            style={{ background: "#f0fdf4", color: "#15803d", border: "1px solid #86efac", borderRadius: 7, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            ↓ Export Excel
          </button>
          <button
            onClick={() => downloadPDF(
              "Customers Report",
              `Generated on ${new Date().toLocaleDateString("en-IN")}`,
              customerColumns, customers,
              [
                ["Total Invoiced", `Rs. ${customers.reduce((s, c) => s + c.totalInvoiced, 0).toLocaleString("en-IN")}`],
                ["Total Collected", `Rs. ${customers.reduce((s, c) => s + c.totalPaid, 0).toLocaleString("en-IN")}`],
                ["Total Outstanding", `Rs. ${customers.reduce((s, c) => s + c.outstandingBalance, 0).toLocaleString("en-IN")}`],
              ]
            )}
            style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #93c5fd", borderRadius: 7, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            ↓ Export PDF
          </button>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: "7px 14px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 13, color: "#1e293b", outline: "none", width: 220 }}
          />
        </div>
      </div>

      {/* Summary Bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Invoiced", value: fmt(customers.reduce((s, c) => s + c.totalInvoiced, 0)), color: "#6366f1" },
          { label: "Total Collected", value: fmt(customers.reduce((s, c) => s + c.totalPaid, 0)), color: "#16a34a" },
          { label: "Total Outstanding", value: fmt(customers.reduce((s, c) => s + c.outstandingBalance, 0)), color: "#dc2626" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 10, padding: "14px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", borderLeft: `4px solid ${s.color}` }}>
            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Customer Cards */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", color: "#94a3b8", padding: 40, fontSize: 14 }}>No customers found.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {filtered.map((c) => {
            const pct = c.totalInvoiced > 0 ? Math.round((c.totalPaid / c.totalInvoiced) * 100) : 0;
            return (
              <div
                key={c.id}
                style={{
                  background: "#fff", borderRadius: 12, padding: "18px 20px",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                  border: "1px solid #f1f5f9",
                  transition: "box-shadow 0.2s",
                  cursor: "pointer",
                }}
                onClick={() => navigate(`/customers/${c.id}`)}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)"}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.07)"}
              >
                {/* Card Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 9, background: "#ea580c",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontWeight: 700, fontSize: 15, flexShrink: 0,
                  }}>
                    {c.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.email}</div>
                  </div>
                  {c.outstandingBalance > 0 ? (
                    <span style={{ fontSize: 10, background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 4, padding: "2px 7px", fontWeight: 600, flexShrink: 0 }}>
                      Due
                    </span>
                  ) : (
                    <span style={{ fontSize: 10, background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: 4, padding: "2px 7px", fontWeight: 600, flexShrink: 0 }}>
                      Clear
                    </span>
                  )}
                </div>

                {/* Amounts */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                  {[
                    { label: "Invoiced", value: fmt(c.totalInvoiced), color: "#475569" },
                    { label: "Paid", value: fmt(c.totalPaid), color: "#16a34a" },
                    { label: "Outstanding", value: fmt(c.outstandingBalance), color: c.outstandingBalance > 0 ? "#dc2626" : "#16a34a" },
                  ].map((s) => (
                    <div key={s.label} style={{ background: "#f8fafc", borderRadius: 7, padding: "7px 8px", textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 500 }}>{s.label}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: s.color, marginTop: 2 }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                {/* Collection Progress */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>
                    <span>Collection Progress</span>
                    <span style={{ fontWeight: 600, color: pct >= 100 ? "#16a34a" : "#475569" }}>{pct}%</span>
                  </div>
                  <div style={{ height: 5, background: "#f1f5f9", borderRadius: 4 }}>
                    <div style={{
                      height: "100%", width: `${pct}%`,
                      background: pct >= 100 ? "#16a34a" : pct >= 50 ? "#ea580c" : "#dc2626",
                      borderRadius: 4, transition: "width 0.5s",
                    }} />
                  </div>
                </div>

                <div style={{ marginTop: 12, fontSize: 12, color: "#6366f1", fontWeight: 500, textAlign: "right" }}>
                  View Details →
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
