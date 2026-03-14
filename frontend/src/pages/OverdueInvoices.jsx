import { useEffect, useState } from "react";
import { getOverdueInvoices } from "../api/api";
import Table from "../components/Table";
import Badge from "../components/Badge";

const fmt = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN");

export default function OverdueInvoices() {
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    getOverdueInvoices().then((r) => setInvoices(r.data));
  }, []);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold text-gray-800">Overdue Invoices</h1>
      <Table
        columns={[
          { key: "externalId", label: "Invoice ID" },
          { key: "customer", label: "Customer" },
          { key: "amount", label: "Amount", render: (r) => fmt(r.amount) },
          { key: "dueDate", label: "Due Date", render: (r) => fmtDate(r.dueDate) },
          { key: "paid", label: "Paid", render: (r) => fmt(r.paid) },
          { key: "remaining", label: "Remaining", render: (r) => (
            <span className="font-medium text-red-600">{fmt(r.remaining)}</span>
          )},
          { key: "badge", label: "Status", render: () => <Badge label="Overdue" type="overdue" /> },
        ]}
        rows={invoices}
        emptyMsg="No overdue invoices."
      />
    </div>
  );
}
