import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getInvoices, getCustomers, createInvoice, payInvoice, createCustomer } from "../api/api";
import Table from "../components/Table";
import Badge from "../components/Badge";
import Toast from "../components/Toast";
import { printReceipt } from "../utils/printReceipt";
import { downloadCSV, downloadPDF, invoiceColumns } from "../utils/exportUtils";

const fmt = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN");

function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    }}>
      <div style={{ background: "#fff", borderRadius: 12, padding: 28, width: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0",
  borderRadius: 7, fontSize: 13, color: "#1e293b", outline: "none",
  boxSizing: "border-box",
};

export default function Invoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [toast, setToast] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [payTarget, setPayTarget] = useState(null);
  const [form, setForm] = useState({ customerId: "", amount: "", dueDate: "" });
  const [payAmount, setPayAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNewCust, setShowNewCust] = useState(false);
  const [newCust, setNewCust] = useState({ name: "", email: "" });
  const [custLoading, setCustLoading] = useState(false);

  const handleAddCustomer = async () => {
    if (!newCust.name.trim()) return;
    setCustLoading(true);
    try {
      const res = await createCustomer(newCust);
      await load();
      setForm((f) => ({ ...f, customerId: String(res.data.id) }));
      setShowNewCust(false);
      setNewCust({ name: "", email: "" });
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to create customer", "error");
    } finally {
      setCustLoading(false);
    }
  };

  const load = useCallback(async () => {
    const [inv, cust] = await Promise.all([getInvoices(), getCustomers()]);
    setInvoices(inv.data);
    setCustomers(cust.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  const showToast = (message, type = "success") => setToast({ message, type });

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createInvoice(form);
      showToast("Invoice created successfully!");
      setShowCreate(false);
      setForm({ customerId: "", amount: "", dueDate: "" });
      await load();
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to create invoice", "error");
    } finally {
      setLoading(false);
    }
  };

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
      showToast(`Payment of ${fmt(paid)} recorded! Receipt opened.`);
      setPayTarget(null);
      setPayAmount("");
      await load();
    } catch (err) {
      showToast(err.response?.data?.error || "Payment failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-5">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1e293b", margin: 0 }}>Invoices</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => downloadCSV(`invoices-${Date.now()}.csv`, invoiceColumns, invoices)}
            style={{ background: "#f0fdf4", color: "#15803d", border: "1px solid #86efac", borderRadius: 7, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            ↓ Export Excel
          </button>
          <button
            onClick={() => downloadPDF(
              "Invoices Report",
              `Generated on ${new Date().toLocaleDateString("en-IN")}`,
              invoiceColumns, invoices,
              [
                ["Total Invoiced", `Rs. ${invoices.reduce((s, r) => s + r.amount, 0).toLocaleString("en-IN")}`],
                ["Total Collected", `Rs. ${invoices.reduce((s, r) => s + r.paid, 0).toLocaleString("en-IN")}`],
                ["Total Outstanding", `Rs. ${invoices.reduce((s, r) => s + r.remaining, 0).toLocaleString("en-IN")}`],
              ]
            )}
            style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #93c5fd", borderRadius: 7, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            ↓ Export PDF
          </button>
          <button
            onClick={() => setShowCreate(true)}
            style={{ background: "#ea580c", color: "#fff", border: "none", borderRadius: 7, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            + New Invoice
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
            <span style={{ color: r.remaining > 0 ? "#dc2626" : "#16a34a", fontWeight: 600 }}>{fmt(r.remaining)}</span>
          )},
          { key: "status", label: "Status", render: (r) => <Badge label={r.status.charAt(0).toUpperCase() + r.status.slice(1)} type={r.status} /> },
          { key: "actions", label: "", render: (r) => (
            <div style={{ display: "flex", gap: 8 }}>
              {r.remaining > 0 && (
                <button
                  onClick={() => { setPayTarget(r); setPayAmount(""); }}
                  style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #86efac", borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                >
                  Pay
                </button>
              )}
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
                  style={{ background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                >
                  Receipt
                </button>
              )}
              <button
                onClick={() => navigate(`/customers/${r.customerId}`)}
                style={{ background: "none", border: "none", color: "#6366f1", fontSize: 12, cursor: "pointer", fontWeight: 500 }}
              >
                Open →
              </button>
            </div>
          )},
        ]}
        rows={invoices}
        emptyMsg="No invoices found. Sync data or create one."
      />

      {/* Create Invoice Modal */}
      {showCreate && (
        <Modal title="Create Invoice" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate}>
            <Field label="Customer">
              <select
                required
                value={form.customerId}
                onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                style={inputStyle}
              >
                <option value="">Select customer...</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {/* Add new customer inline */}
              {!showNewCust ? (
                <button
                  type="button"
                  onClick={() => setShowNewCust(true)}
                  style={{ marginTop: 7, background: "none", border: "none", color: "#ea580c", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}
                >
                  + New Customer
                </button>
              ) : (
                <div style={{ marginTop: 10, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#475569", marginBottom: 8 }}>New Customer</div>
                  <input
                    type="text" placeholder="Name *" value={newCust.name}
                    onChange={(e) => setNewCust((p) => ({ ...p, name: e.target.value }))}
                    style={{ ...inputStyle, marginBottom: 7 }}
                  />
                  <input
                    type="email" placeholder="Email (optional)" value={newCust.email}
                    onChange={(e) => setNewCust((p) => ({ ...p, email: e.target.value }))}
                    style={{ ...inputStyle, marginBottom: 8 }}
                  />
                  <div style={{ display: "flex", gap: 7 }}>
                    <button
                      type="button" onClick={() => { setShowNewCust(false); setNewCust({ name: "", email: "" }); }}
                      style={{ flex: 1, padding: "6px", border: "1px solid #e2e8f0", borderRadius: 6, background: "#fff", fontSize: 12, cursor: "pointer", color: "#64748b" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button" onClick={handleAddCustomer} disabled={custLoading || !newCust.name.trim()}
                      style={{ flex: 1, padding: "6px", border: "none", borderRadius: 6, background: "#ea580c", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: custLoading ? 0.6 : 1 }}
                    >
                      {custLoading ? "Saving..." : "Add & Select"}
                    </button>
                  </div>
                </div>
              )}
            </Field>
            <Field label="Amount (₹)">
              <input
                type="number" min="1" required
                placeholder="e.g. 5000"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                style={inputStyle}
              />
            </Field>
            <Field label="Due Date">
              <input
                type="date" required
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                style={inputStyle}
              />
            </Field>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button type="button" onClick={() => setShowCreate(false)}
                style={{ flex: 1, padding: "9px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", fontSize: 13, cursor: "pointer", color: "#64748b" }}>
                Cancel
              </button>
              <button type="submit" disabled={loading}
                style={{ flex: 1, padding: "9px", border: "none", borderRadius: 8, background: "#ea580c", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
                {loading ? "Creating..." : "Create Invoice"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Pay Invoice Modal */}
      {payTarget && (
        <Modal title={`Record Payment — ${payTarget.externalId}`} onClose={() => setPayTarget(null)}>
          <div style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13 }}>
            <div style={{ color: "#64748b" }}>Customer: <strong style={{ color: "#1e293b" }}>{payTarget.customer}</strong></div>
            <div style={{ color: "#64748b", marginTop: 4 }}>
              Remaining: <strong style={{ color: "#dc2626" }}>{fmt(payTarget.remaining)}</strong>
            </div>
          </div>
          <form onSubmit={handlePay}>
            <Field label="Payment Amount (₹)">
              <input
                type="number" min="1" max={payTarget.remaining} required
                placeholder={`Max ${fmt(payTarget.remaining)}`}
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                style={inputStyle}
              />
            </Field>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
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
        </Modal>
      )}
    </div>
  );
}
