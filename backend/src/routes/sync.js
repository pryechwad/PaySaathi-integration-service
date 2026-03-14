const express = require("express");
const axios = require("axios");
const prisma = require("../db");

const router = express.Router();
const BASE = process.env.EXTERNAL_API_URL;

router.post("/", async (req, res) => {
  const skipped = [];
  const errors = [];
  const counts = { customers: 0, invoices: 0, payments: 0 };

  // Step 1: Fetch from external API
  let customers, invoices, payments;
  try {
    const [c, inv, pay] = await Promise.all([
      axios.get(`${BASE}/customers`),
      axios.get(`${BASE}/invoices`),
      axios.get(`${BASE}/payments`),
    ]);
    customers = c.data;
    invoices = inv.data;
    payments = pay.data;
  } catch (err) {
    return res.status(502).json({
      error: "Failed to reach external API",
      detail: err.message,
    });
  }

  // Step 2: Upsert customers
  for (const c of customers) {
    if (!c.id || !c.name) {
      skipped.push({ type: "customer", record: c, reason: "Missing id or name" });
      continue;
    }
    try {
      await prisma.customer.upsert({
        where: { externalId: c.id },
        update: { name: c.name, email: c.email },
        create: { externalId: c.id, name: c.name, email: c.email },
      });
      counts.customers++;
    } catch (err) {
      errors.push({ type: "customer", id: c.id, reason: err.message });
    }
  }

  // Step 3: Upsert invoices
  for (const inv of invoices) {
    if (!inv.id || !inv.customer_id || inv.amount == null || !inv.due_date) {
      skipped.push({ type: "invoice", record: inv, reason: "Missing required fields" });
      continue;
    }
    try {
      const customer = await prisma.customer.findUnique({ where: { externalId: inv.customer_id } });
      if (!customer) {
        skipped.push({ type: "invoice", id: inv.id, reason: `Customer ${inv.customer_id} not found` });
        continue;
      }
      const dueDate = new Date(inv.due_date);
      if (isNaN(dueDate.getTime())) {
        skipped.push({ type: "invoice", id: inv.id, reason: `Invalid due_date: ${inv.due_date}` });
        continue;
      }
      await prisma.invoice.upsert({
        where: { externalId: inv.id },
        update: { amount: inv.amount, dueDate },
        create: { externalId: inv.id, customerId: customer.id, amount: inv.amount, dueDate },
      });
      counts.invoices++;
    } catch (err) {
      errors.push({ type: "invoice", id: inv.id, reason: err.message });
    }
  }

  // Step 4: Upsert payments
  for (const pay of payments) {
    if (!pay.id || !pay.invoice_id || pay.amount == null || !pay.payment_date) {
      skipped.push({ type: "payment", record: pay, reason: "Missing required fields" });
      continue;
    }
    if (pay.amount <= 0) {
      skipped.push({ type: "payment", id: pay.id, reason: `Invalid amount: ${pay.amount}` });
      continue;
    }
    try {
      const invoice = await prisma.invoice.findUnique({ where: { externalId: pay.invoice_id } });
      if (!invoice) {
        skipped.push({ type: "payment", id: pay.id, reason: `Invoice ${pay.invoice_id} not found` });
        continue;
      }
      const paymentDate = new Date(pay.payment_date);
      if (isNaN(paymentDate.getTime())) {
        skipped.push({ type: "payment", id: pay.id, reason: `Invalid payment_date: ${pay.payment_date}` });
        continue;
      }
      await prisma.payment.upsert({
        where: { externalId: pay.id },
        update: { amount: pay.amount, paymentDate },
        create: { externalId: pay.id, invoiceId: invoice.id, amount: pay.amount, paymentDate },
      });
      counts.payments++;
    } catch (err) {
      errors.push({ type: "payment", id: pay.id, reason: err.message });
    }
  }

  res.json({
    message: "Sync completed",
    synced: counts,
    skipped: skipped.length > 0 ? skipped : undefined,
    errors: errors.length > 0 ? errors : undefined,
  });
});

module.exports = router;
