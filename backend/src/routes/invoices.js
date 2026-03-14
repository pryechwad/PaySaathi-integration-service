const express = require("express");
const prisma = require("../db");

const router = express.Router();

// GET /api/invoices/overdue
router.get("/overdue", async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { dueDate: { lt: new Date() } },
      include: { customer: true, payments: true },
    });

    const result = invoices.map((inv) => {
      const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
      return {
        id: inv.id,
        externalId: inv.externalId,
        customer: inv.customer.name,
        amount: inv.amount,
        dueDate: inv.dueDate,
        paid,
        remaining: inv.amount - paid,
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
