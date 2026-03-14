const express = require("express");
const prisma = require("../db");

const router = express.Router();

// GET /api/customers — list with outstanding balance
router.get("/", async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      include: { invoices: { include: { payments: true } } },
    });

    const result = customers.map((c) => {
      const totalInvoiced = c.invoices.reduce((s, inv) => s + inv.amount, 0);
      const totalPaid = c.invoices.flatMap((inv) => inv.payments).reduce((s, p) => s + p.amount, 0);
      return {
        id: c.id,
        name: c.name,
        email: c.email,
        totalInvoiced,
        totalPaid,
        outstandingBalance: totalInvoiced - totalPaid,
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/customers/:id/summary
router.get("/:id/summary", async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: Number(req.params.id) },
      include: { invoices: { include: { payments: true } } },
    });

    if (!customer) return res.status(404).json({ error: "Customer not found" });

    const invoices = customer.invoices.map((inv) => {
      const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
      return {
        id: inv.id,
        externalId: inv.externalId,
        amount: inv.amount,
        dueDate: inv.dueDate,
        status: inv.status,
        paid,
        remaining: inv.amount - paid,
        payments: inv.payments,
      };
    });

    res.json({ id: customer.id, name: customer.name, email: customer.email, invoices });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/customers/:id/credit — credit insight for a single customer
router.get("/:id/credit", async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: Number(req.params.id) },
      include: { invoices: { include: { payments: true } } },
    });

    if (!customer) return res.status(404).json({ error: "Customer not found" });

    const now = new Date();
    let totalInvoiced = 0, totalPaid = 0, totalOverdue = 0;
    const overdueInvoices = [];

    for (const inv of customer.invoices) {
      const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
      const remaining = inv.amount - paid;
      totalInvoiced += inv.amount;
      totalPaid += paid;

      if (inv.dueDate < now && remaining > 0) {
        const daysOverdue = Math.floor((now - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24));
        totalOverdue += remaining;
        overdueInvoices.push({
          invoiceId: inv.externalId,
          amount: inv.amount,
          remaining,
          dueDate: inv.dueDate,
          daysOverdue,
        });
      }
    }

    const outstandingBalance = totalInvoiced - totalPaid;
    const collectionRate = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0;

    // Simple risk classification
    let riskLevel;
    if (totalOverdue === 0) riskLevel = "low";
    else if (totalOverdue <= totalInvoiced * 0.3) riskLevel = "medium";
    else riskLevel = "high";

    res.json({
      customerId: customer.id,
      name: customer.name,
      email: customer.email,
      totalInvoiced,
      totalPaid,
      outstandingBalance,
      totalOverdue,
      collectionRate,
      riskLevel,
      overdueInvoices,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
