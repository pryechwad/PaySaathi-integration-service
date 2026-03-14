const express = require("express");
const prisma = require("../db");

const router = express.Router();

// GET /api/insights/dashboard
router.get("/dashboard", async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: { payments: true },
    });

    const now = new Date();
    let totalReceivables = 0;
    let totalOverdue = 0;
    let totalCollected = 0;

    for (const inv of invoices) {
      const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
      const remaining = inv.amount - paid;
      totalReceivables += remaining;
      totalCollected += paid;
      if (inv.dueDate < now && remaining > 0) totalOverdue += remaining;
    }

    const totalCustomers = await prisma.customer.count();
    const totalInvoices = invoices.length;

    res.json({
      totalCustomers,
      totalInvoices,
      totalReceivables,
      totalOverdue,
      totalCollected,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
