import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCustomerSummary, payInvoice } from "../api/api";
import Table from "../components/Table";
import Badge from "../components/Badge";
import Toast from "../components/Toast";
import { printReceipt } from "../utils/printReceipt";

const fmt = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN");

function PayModal({ invoice, onClose, onSuccess }) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await payInvoice(invoice.id, Number(amount));
      printReceipt({
        invoiceId: invoice.externalId,
        customer: invoice.customerName,
        invoiceAmount: invoice.amount,
        paymentAmount: Number(amount),
        remainingAfter: invoice.remaining - Number(amount),
        paymentDate: new Date(),
      });
      onSuccess(`Payment of ${fmt(amount)} recorded! Receipt opened.`);
      onClose();
    } catch (ex) {
      setErr(ex.response?.data?.error || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", borderRadius: 12, padding: 28, width: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", margin: 0 }}>Record Payment</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>✕</button>
        </div>
        <div style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13 }}>
          <div style={{ color: "#64748b" }}>Invoice: <strong style={{ color: "#1e293b" }}>{invoice.externalId}</strong></div>
          <div style={{ color: "#64748b", marginTop: 3 }}>Remaining: <strong style={{ color: "#dc2626" }}>{fmt(invoice.remaining)}</strong></div>
        </div>
        {err && <div style={{ background: "#fef2f2", color: "#dc2626", fontSize: 12, padding: "8px 12px", borderRadius: 7, marginBottom: 12, border: "1px solid #fca5a5" }}>{err}</div>}
        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Amount (₹)</label>
          <input
            type="number" min="1" max={invoice.remaining} required
            placeholder={`Max ${fmt(invoice.remaining)}`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 13, boxSizing: "border-box" }}
          />
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <button type="button" onClick={onClose}
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
  );
}

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [payTarget, setPayTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const load = useCallback(() => getCustomerSummary(id).then((r) => setData(r.data)), [id]);
  useEffect(() => { load(); }, [load]);

  if (!data) return <div style={{ padding: 24, color: "#94a3b8" }}>Loading...</div>;

  const isOverdue = (inv) => new Date(inv.dueDate) < new Date() && inv.remaining > 0;
  const totalInvoiced = data.invoices.reduce((s, i) => s + i.amount, 0);
  const totalPaid = data.invoices.reduce((s, i) => s + i.paid, 0);
  const totalRemaining = totalInvoiced - totalPaid;

  return (
    <div style={{ padding: 24 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {payTarget && (
        <PayModal
          invoice={payTarget}
          onClose={() => setPayTarget(null)}
          onSuccess={(msg) => { setToast({ message: msg, type: "success" }); load(); }}
        />
      )}

      {/* Back */}
      <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", color: "#6366f1", fontSize: 13, cursor: "pointer", marginBottom: 16, padding: 0 }}>
        ← Back
      </button>

      {/* Customer Header */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#ea580c", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 16 }}>
                {data.name.charAt(0)}
              </div>
              <div>
                <h1 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: 0 }}>{data.name}</h1>
                <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>{data.email}</p>
              </div>
            </div>
          </div>
          {/* Summary Pills */}
          <div style={{ display: "flex", gap: 12 }}>
            {[
              { label: "Invoiced", value: fmt(totalInvoiced), color: "#6366f1" },
              { label: "Paid", value: fmt(totalPaid), color: "#16a34a" },
              { label: "Outstanding", value: fmt(totalRemaining), color: totalRemaining > 0 ? "#dc2626" : "#16a34a" },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: "center", background: "#f8fafc", borderRadius: 8, padding: "8px 16px" }}>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>{s.label}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Invoices Section */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 14 }}>Invoices</div>
        <Table
          columns={[
            { key: "externalId", label: "Invoice ID" },
            { key: "amount", label: "Amount", render: (r) => fmt(r.amount) },
            { key: "dueDate", label: "Due Date", render: (r) => fmtDate(r.dueDate) },
            { key: "paid", label: "Paid", render: (r) => fmt(r.paid) },
            { key: "remaining", label: "Remaining", render: (r) => (
              <span style={{ fontWeight: 600, color: r.remaining > 0 ? "#dc2626" : "#16a34a" }}>{fmt(r.remaining)}</span>
            )},
            { key: "status", label: "Status", render: (r) =>
              r.remaining === 0 ? <Badge label="Paid" type="paid" /> :
              isOverdue(r) ? <Badge label="Overdue" type="overdue" /> :
              <Badge label="Pending" type="pending" />
            },
            { key: "pay", label: "", render: (r) => r.remaining > 0 ? (
              <button
                onClick={() => setPayTarget({ ...r, customerName: data.name })}
                style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #86efac", borderRadius: 6, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              >
                Pay
              </button>
            ) : null },
          ]}
          rows={data.invoices}
        />
      </div>

      {/* Payment History Sections */}
      {data.invoices.filter((inv) => inv.payments.length > 0).map((inv) => (
        <div key={inv.id} style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>Payment History</div>
            <span style={{ fontSize: 11, background: "#f1f5f9", color: "#64748b", padding: "2px 8px", borderRadius: 4, fontWeight: 500 }}>{inv.externalId}</span>
          </div>
          <Table
            columns={[
              { key: "externalId", label: "Payment ID" },
              { key: "amount", label: "Amount", render: (r) => <span style={{ color: "#16a34a", fontWeight: 600 }}>{fmt(r.amount)}</span> },
              { key: "paymentDate", label: "Date", render: (r) => fmtDate(r.paymentDate) },
              { key: "receipt", label: "", render: (r) => (
                <button
                  onClick={() => printReceipt({
                    invoiceId: inv.externalId,
                    customer: data.name,
                    invoiceAmount: inv.amount,
                    paymentAmount: r.amount,
                    remainingAfter: inv.remaining,
                    paymentDate: r.paymentDate,
                  })}
                  style={{ background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 6, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                >
                  Receipt
                </button>
              )},
            ]}
            rows={inv.payments}
          />
        </div>
      ))}
    </div>
  );
}
