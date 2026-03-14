import { useEffect, useState } from "react";
import { getDashboard, syncData, getCustomers } from "../api/api";
import StatCard from "../components/StatCard";
import Table from "../components/Table";
import Toast from "../components/Toast";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";

const fmt = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

const PIE_COLORS = { paid: "#16a34a", overdue: "#dc2626", pending: "#d97706" };

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState(null);

  const load = async () => {
    const [d, c] = await Promise.all([getDashboard(), getCustomers()]);
    setStats(d.data);
    setCustomers(c.data);
  };

  useEffect(() => { load(); }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncData();
      await load();
      setToast({ message: "Data synced successfully! All records are up to date.", type: "success" });
    } catch {
      setToast({ message: "Sync failed. Is the mock API running on port 4000?", type: "error" });
    } finally {
      setSyncing(false);
    }
  };

  const chartData = customers.map((c) => ({
    name: c.name.split(" ")[0],
    outstanding: c.outstandingBalance,
  }));

  const pieData = stats ? [
    { name: "Paid", value: stats.paidCount },
    { name: "Overdue", value: stats.overdueCount },
    { name: "Pending", value: stats.pendingCount },
  ].filter((d) => d.value > 0) : [];

  return (
    <div className="p-6 space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1e293b", margin: 0 }}>Dashboard</h1>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: "3px 0 0" }}>Financial overview & analytics</p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          style={{
            background: syncing ? "#e2e8f0" : "#ea580c", color: syncing ? "#94a3b8" : "#fff",
            border: "none", borderRadius: 8, padding: "9px 18px",
            fontSize: 13, fontWeight: 600, cursor: syncing ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", gap: 7, transition: "all 0.2s",
          }}
        >
          {syncing ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 1s linear infinite" }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Syncing...
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              Sync Data
            </>
          )}
        </button>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>

      {/* Stat Cards */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
          <StatCard title="Total Customers" value={stats.totalCustomers} />
          <StatCard title="Total Invoices" value={stats.totalInvoices} />
          <StatCard title="Total Receivables" value={fmt(stats.totalReceivables)} accent />
          <StatCard title="Total Collected" value={fmt(stats.totalCollected)} sub="All time" />
          <StatCard title="Total Overdue" value={fmt(stats.totalOverdue)} danger />
          <StatCard title="Collection Rate" value={`${stats.collectionRate}%`} sub="Invoices fully paid" accent={stats.collectionRate >= 50} danger={stats.collectionRate < 30} />
        </div>
      )}

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Monthly Collections Line Chart */}
        {stats?.monthlyCollections?.length > 0 && (
          <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", padding: "18px 20px" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 14 }}>Monthly Collections (Last 6 Months)</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={stats.monthlyCollections}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => fmt(v)} />
                <Line type="monotone" dataKey="collected" stroke="#ea580c" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Invoice Status Pie */}
        {pieData.length > 0 && (
          <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", padding: "18px 20px" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 14 }}>Invoice Status Breakdown</div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={PIE_COLORS[entry.name.toLowerCase()] || "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Outstanding by Customer Bar Chart */}
      {chartData.length > 0 && (
        <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", padding: "18px 20px" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 14 }}>Outstanding Balance by Customer</div>
          <ResponsiveContainer width="100%" height={220}>
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

      {/* Top Overdue Customers */}
      {stats?.topOverdueCustomers?.length > 0 && (
        <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", padding: "18px 20px" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 14 }}>Top Overdue Customers</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {stats.topOverdueCustomers.map((c, i) => {
              const maxOverdue = stats.topOverdueCustomers[0].overdue;
              const pct = Math.round((c.overdue / maxOverdue) * 100);
              return (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: "#1e293b", fontWeight: 500 }}>{c.name}</span>
                    <span style={{ color: "#dc2626", fontWeight: 600 }}>{fmt(c.overdue)}</span>
                  </div>
                  <div style={{ height: 6, background: "#fee2e2", borderRadius: 4 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: "#dc2626", borderRadius: 4, transition: "width 0.5s" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Customer Overview Table */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 10 }}>Customer Overview</div>
        <Table
          columns={[
            { key: "name", label: "Customer" },
            { key: "email", label: "Email" },
            { key: "totalInvoiced", label: "Invoiced", render: (r) => fmt(r.totalInvoiced) },
            { key: "totalPaid", label: "Paid", render: (r) => fmt(r.totalPaid) },
            { key: "outstandingBalance", label: "Outstanding", render: (r) => (
              <span style={{ fontWeight: 600, color: r.outstandingBalance > 0 ? "#6366f1" : "#16a34a" }}>{fmt(r.outstandingBalance)}</span>
            )},
          ]}
          rows={customers}
        />
      </div>
    </div>
  );
}
