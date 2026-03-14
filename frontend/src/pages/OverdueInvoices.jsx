import { useEffect, useState, useCallback } from "react";
import { getOverdueInvoices, payInvoice } from "../api/api";
import Table from "../components/Table";
import Badge from "../components/Badge";
import Toast from "../components/Toast";
import { printReceipt } from "../utils/printReceipt";
import { downloadCSV, downloadPDF, overdueColumns } from "../utils/exportUtils";

const fmt = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN");

export default function OverdueInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [payTarget, setPayTarget] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const load = useCallback(() =>
    getOverdueInvoices().then((r) => setInvoices(r.data)), []);

  useEffect(() => { load(); }, [load]);

  const handlePay = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await payInvoice(payTarget.id, Number(payAmount));
      const paid = Number(payAmount);
      const remaining = payTarget.remaining - paid;
      printReceipt({
        invoiceId: payTarget.externalId,
        customer: payTarget.customer,
        invoiceAmount: payTarget.amount,
        paymentAmount: paid,
        remainingAfter: remaining,
        paymentDate: new Date(),
      });
      setToast({ message: `Payment of ${fmt(paid)} recorded! Receipt opened.`, type: "success" });
      setPayTarget(null);
      setPayAmount("");
      await load();
    } catch (err) {
      setToast({ message: err.response?.data?.error || "Payment failed", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1e293b", margin: 0 }}>Overdue Invoices</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => downloadCSV(`overdue-invoices-${Date.now()}.csv`, overdueColumns, invoices)}
            style={{ background: "#f0fdf4", color: "#15803d", border: "1px solid #86efac", borderRadius: 7, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            ↓ Export Excel
          </button>
          <button
            onClick={() => downloadPDF(
              "Overdue Invoices Report",
              `Generated on ${new Date().toLocaleDateString("en-IN")}`,
              overdueColumns, invoices,
              [["Total Overdue Amount", `Rs. ${invoices.reduce((s, r) => s + r.remaining, 0).toLocaleString("en-IN")}`]]
            )}
            style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 7, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            ↓ Export PDF
          </button>
        </div>
      </div>

      <Table
        columns={[
          { key: "externalId", label: "Invoice ID" },
          { key: "customer", label: "Customer" },
          { key: "amount", label: "Amount", render: (r) => fmt(r.amount) },
          { key: "dueDate", label: "Due Date", render: (r) => fmtDate(r.dueDate) },
          { key: "paid", label: "Paid", render: (r) => fmt(r.paid) },
          { key: "remaining", label: "Remaining", render: (r) => (
            <span style={{ fontWeight: 600, color: "#dc2626" }}>{fmt(r.remaining)}</span>
          )},
          { key: "badge", label: "Status", render: () => <Badge label="Overdue" type="overdue" /> },
          { key: "pay", label: "", render: (r) => (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => { setPayTarget(r); setPayAmount(""); }}
                style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #86efac", borderRadius: 6, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              >
                Pay
              </button>
              {r.paid > 0 && (
                <button
                  onClick={() => printReceipt({
                    invoiceId: r.externalId,
                    customer: r.customer,
                    invoiceAmount: r.amount,
                    paymentAmount: r.paid,
                    remainingAfter: r.remaining,
                    paymentDate: new Date(),
                  })}
                  style={{ background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 6, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                >
                  Receipt
                </button>
              )}
            </div>
          )},
        ]}
        rows={invoices}
        emptyMsg="No overdue invoices."
      />

      {/* Pay Modal */}
      {payTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 28, width: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", margin: 0 }}>Record Payment</h2>
              <button onClick={() => setPayTarget(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>✕</button>
            </div>
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13 }}>
              <div style={{ color: "#64748b" }}>Invoice: <strong style={{ color: "#1e293b" }}>{payTarget.externalId}</strong></div>
              <div style={{ color: "#64748b", marginTop: 3 }}>Customer: <strong style={{ color: "#1e293b" }}>{payTarget.customer}</strong></div>
              <div style={{ color: "#64748b", marginTop: 3 }}>Remaining: <strong style={{ color: "#dc2626" }}>{fmt(payTarget.remaining)}</strong></div>
            </div>
            <form onSubmit={handlePay}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Payment Amount (₹)</label>
              <input
                type="number" min="1" max={payTarget.remaining} required
                placeholder={`Max ${fmt(payTarget.remaining)}`}
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 13, boxSizing: "border-box" }}
              />
              <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                <button type="button" onClick={() => setPayTarget(null)}
                  style={{ flex: 1, padding: "9px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", fontSize: 13, cursor: "pointer", color: "#64748b" }}>
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  style={{ flex: 1, padding: "9px", border: "none", borderRadius: 8, background: "#16a34a", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
                  {loading ? "Processing..." : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
