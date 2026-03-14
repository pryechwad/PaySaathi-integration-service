const express = require("express");
const axios = require("axios");
const prisma = require("../db");

const router = express.Router();
const BASE = process.env.EXTERNAL_API_URL;

router.post("/", async (req, res) => {
  try {
    const [{ data: customers }, { data: invoices }, { data: payments }] =
      await Promise.all([
        axios.get(`${BASE}/customers`),
        axios.get(`${BASE}/invoices`),
        axios.get(`${BASE}/payments`),
      ]);

    // Upsert customers
    for (const c of customers) {
      await prisma.customer.upsert({
        where: { externalId: c.id },
        update: { name: c.name, email: c.email },
        create: { externalId: c.id, name: c.name, email: c.email },
      });
    }

    // Upsert invoices
    for (const inv of invoices) {
      const customer = await prisma.customer.findUnique({
        where: { externalId: inv.customer_id },
      });
      if (!customer) continue;

      await prisma.invoice.upsert({
        where: { externalId: inv.id },
        update: { amount: inv.amount, dueDate: new Date(inv.due_date) },
        create: {
          externalId: inv.id,
          customerId: customer.id,
          amount: inv.amount,
          dueDate: new Date(inv.due_date),
        },
      });
    }

    // Upsert payments
    for (const pay of payments) {
      const invoice = await prisma.invoice.findUnique({
        where: { externalId: pay.invoice_id },
      });
      if (!invoice) continue;

      await prisma.payment.upsert({
        where: { externalId: pay.id },
        update: { amount: pay.amount, paymentDate: new Date(pay.payment_date) },
        create: {
          externalId: pay.id,
          invoiceId: invoice.id,
          amount: pay.amount,
          paymentDate: new Date(pay.payment_date),
        },
      });
    }

    res.json({ message: "Sync completed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
