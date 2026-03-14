const express = require("express");
const prisma = require("../db");

const router = express.Router();

// GET /api/invoices/overdue — MUST be before /:id routes
router.get("/overdue", async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { dueDate: { lt: new Date() } },
      include: { customer: true, payments: true },
    });
    const result = invoices
      .map((inv) => {
        const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
        const remaining = inv.amount - paid;
        return { id: inv.id, externalId: inv.externalId, customer: inv.customer.name, amount: inv.amount, dueDate: inv.dueDate, paid, remaining };
      })
      .filter((inv) => inv.remaining > 0);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/invoices — all invoices
router.get("/", async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: { customer: true, payments: true },
      orderBy: { dueDate: "asc" },
    });
    const result = invoices.map((inv) => {
      const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
      const remaining = inv.amount - paid;
      const isOverdue = inv.dueDate < new Date() && remaining > 0;
      return {
        id: inv.id,
        externalId: inv.externalId,
        customerId: inv.customerId,
        customer: inv.customer.name,
        amount: inv.amount,
        dueDate: inv.dueDate,
        paid,
        remaining,
        status: remaining === 0 ? "paid" : isOverdue ? "overdue" : "pending",
      };
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/invoices — create invoice
router.post("/", async (req, res) => {
  try {
    const { customerId, amount, dueDate, externalId } = req.body;
    if (!customerId || !amount || !dueDate) return res.status(400).json({ error: "customerId, amount, dueDate required" });
    const invoice = await prisma.invoice.create({
      data: {
        externalId: externalId || `manual_${Date.now()}`,
        customerId: Number(customerId),
        amount: Number(amount),
        dueDate: new Date(dueDate),
      },
    });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/invoices/:id/pay — record payment
router.post("/:id/pay", async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: Number(req.params.id) },
      include: { payments: true },
    });
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    const paid = invoice.payments.reduce((s, p) => s + p.amount, 0);
    const remaining = invoice.amount - paid;
    const payAmount = Number(req.body.amount);
    if (!payAmount || payAmount <= 0) return res.status(400).json({ error: "Valid amount required" });
    if (payAmount > remaining) return res.status(400).json({ error: `Amount exceeds remaining balance ₹${remaining}` });
    const payment = await prisma.payment.create({
      data: {
        externalId: `manual_pay_${Date.now()}`,
        invoiceId: invoice.id,
        amount: payAmount,
        paymentDate: new Date(),
      },
    });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
