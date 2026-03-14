const express = require("express");
const prisma = require("../db");

const router = express.Router();

// GET /api/insights/dashboard
router.get("/dashboard", async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({ include: { payments: true, customer: true } });
    const now = new Date();
    let totalReceivables = 0, totalOverdue = 0, totalCollected = 0;
    let paidCount = 0, overdueCount = 0, pendingCount = 0;

    // monthly collections: last 6 months
    const monthlyMap = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString("en-IN", { month: "short", year: "2-digit" });
      monthlyMap[key] = 0;
    }

    for (const inv of invoices) {
      const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
      const remaining = inv.amount - paid;
      totalReceivables += remaining;
      totalCollected += paid;
      if (remaining === 0) paidCount++;
      else if (inv.dueDate < now && remaining > 0) { totalOverdue += remaining; overdueCount++; }
      else pendingCount++;

      for (const p of inv.payments) {
        const pd = new Date(p.paymentDate);
        const key = pd.toLocaleString("en-IN", { month: "short", year: "2-digit" });
        if (monthlyMap[key] !== undefined) monthlyMap[key] += p.amount;
      }
    }

    const totalCustomers = await prisma.customer.count();
    const totalInvoices = invoices.length;
    const collectionRate = totalInvoices > 0 ? Math.round((paidCount / totalInvoices) * 100) : 0;
    const monthlyCollections = Object.entries(monthlyMap).map(([month, collected]) => ({ month, collected }));

    // top overdue customers
    const custMap = {};
    for (const inv of invoices) {
      const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
      const remaining = inv.amount - paid;
      if (inv.dueDate < now && remaining > 0) {
        const cid = inv.customer.id;
        if (!custMap[cid]) custMap[cid] = { name: inv.customer.name, overdue: 0 };
        custMap[cid].overdue += remaining;
      }
    }
    const topOverdueCustomers = Object.values(custMap).sort((a, b) => b.overdue - a.overdue).slice(0, 5);

    res.json({
      totalCustomers, totalInvoices, totalReceivables, totalOverdue, totalCollected,
      paidCount, overdueCount, pendingCount, collectionRate,
      monthlyCollections, topOverdueCustomers,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
