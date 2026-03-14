import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCustomerSummary } from "../api/api";
import Table from "../components/Table";
import Badge from "../components/Badge";

const fmt = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN");

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    getCustomerSummary(id).then((r) => setData(r.data));
  }, [id]);

  if (!data) return <div className="p-6 text-gray-400">Loading...</div>;

  const isOverdue = (inv) => new Date(inv.dueDate) < new Date() && inv.remaining > 0;

  return (
    <div className="p-6 space-y-6">
      <button onClick={() => navigate(-1)} className="text-sm text-indigo-600 hover:underline">
        ← Back
      </button>
      <div>
        <h1 className="text-xl font-bold text-gray-800">{data.name}</h1>
        <p className="text-sm text-gray-500">{data.email}</p>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-600 mb-3">Invoices</h2>
        <Table
          columns={[
            { key: "externalId", label: "Invoice ID" },
            { key: "amount", label: "Amount", render: (r) => fmt(r.amount) },
            { key: "dueDate", label: "Due Date", render: (r) => fmtDate(r.dueDate) },
            { key: "paid", label: "Paid", render: (r) => fmt(r.paid) },
            { key: "remaining", label: "Remaining", render: (r) => fmt(r.remaining) },
            {
              key: "status",
              label: "Status",
              render: (r) =>
                r.remaining === 0 ? (
                  <Badge label="Paid" type="paid" />
                ) : isOverdue(r) ? (
                  <Badge label="Overdue" type="overdue" />
                ) : (
                  <Badge label="Pending" type="pending" />
                ),
            },
          ]}
          rows={data.invoices}
        />
      </div>

      {data.invoices.map((inv) =>
        inv.payments.length > 0 ? (
          <div key={inv.id}>
            <h2 className="text-sm font-semibold text-gray-600 mb-2">
              Payment History — {inv.externalId}
            </h2>
            <Table
              columns={[
                { key: "externalId", label: "Payment ID" },
                { key: "amount", label: "Amount", render: (r) => fmt(r.amount) },
                { key: "paymentDate", label: "Date", render: (r) => fmtDate(r.paymentDate) },
              ]}
              rows={inv.payments}
            />
          </div>
        ) : null
      )}
    </div>
  );
}
