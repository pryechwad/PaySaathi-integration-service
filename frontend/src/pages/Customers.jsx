import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCustomers } from "../api/api";
import Table from "../components/Table";

const fmt = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getCustomers().then((r) => setCustomers(r.data));
  }, []);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold text-gray-800">Customers</h1>
      <Table
        columns={[
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "totalInvoiced", label: "Total Invoiced", render: (r) => fmt(r.totalInvoiced) },
          { key: "totalPaid", label: "Total Paid", render: (r) => fmt(r.totalPaid) },
          {
            key: "outstandingBalance",
            label: "Outstanding",
            render: (r) => <span className="font-medium text-indigo-600">{fmt(r.outstandingBalance)}</span>,
          },
          {
            key: "actions",
            label: "",
            render: (r) => (
              <button
                onClick={() => navigate(`/customers/${r.id}`)}
                className="text-indigo-600 text-xs hover:underline"
              >
                View Details →
              </button>
            ),
          },
        ]}
        rows={customers}
      />
    </div>
  );
}
