import { useEffect, useState } from "react";
import { getDashboard, syncData, getCustomers } from "../api/api";
import StatCard from "../components/StatCard";
import Table from "../components/Table";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

const fmt = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  const load = async () => {
    const [d, c] = await Promise.all([getDashboard(), getCustomers()]);
    setStats(d.data);
    setCustomers(c.data);
  };

  useEffect(() => { load(); }, []);

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg("");
    try {
      await syncData();
      setSyncMsg("Sync successful!");
      await load();
    } catch {
      setSyncMsg("Sync failed. Is the mock API running?");
    } finally {
      setSyncing(false);
    }
  };

  const chartData = customers.map((c) => ({
    name: c.name.split(" ")[0],
    outstanding: c.outstandingBalance,
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
        <div className="flex items-center gap-3">
          {syncMsg && <span className="text-sm text-gray-500">{syncMsg}</span>}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {syncing ? "Syncing..." : "Sync Data"}
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total Customers" value={stats.totalCustomers} />
          <StatCard title="Total Invoices" value={stats.totalInvoices} />
          <StatCard title="Total Receivables" value={fmt(stats.totalReceivables)} color="text-indigo-600" />
          <StatCard title="Total Overdue" value={fmt(stats.totalOverdue)} color="text-red-600" />
        </div>
      )}

      {chartData.length > 0 && (
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="text-sm font-semibold text-gray-600 mb-4">Outstanding Balance by Customer</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => fmt(v)} />
              <Bar dataKey="outstanding" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-gray-600 mb-3">Customer Overview</h2>
        <Table
          columns={[
            { key: "name", label: "Customer" },
            { key: "email", label: "Email" },
            { key: "totalInvoiced", label: "Invoiced", render: (r) => fmt(r.totalInvoiced) },
            { key: "totalPaid", label: "Paid", render: (r) => fmt(r.totalPaid) },
            { key: "outstandingBalance", label: "Outstanding", render: (r) => (
              <span className="font-medium text-indigo-600">{fmt(r.outstandingBalance)}</span>
            )},
          ]}
          rows={customers}
        />
      </div>
    </div>
  );
}
