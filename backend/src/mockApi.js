const express = require("express");
const app = express();

const customers = [
  { id: "cust_1", name: "ABC Pvt Ltd", email: "abc@gmail.com" },
  { id: "cust_2", name: "XYZ Corp", email: "xyz@gmail.com" },
  { id: "cust_3", name: "Delta Solutions", email: "delta@gmail.com" },
];

const invoices = [
  { id: "inv_101", customer_id: "cust_1", amount: 5000, due_date: "2024-03-20" },
  { id: "inv_102", customer_id: "cust_1", amount: 3000, due_date: "2025-01-15" },
  { id: "inv_103", customer_id: "cust_2", amount: 8000, due_date: "2024-11-10" },
  { id: "inv_104", customer_id: "cust_3", amount: 2500, due_date: "2026-06-30" },
  { id: "inv_105", customer_id: "cust_2", amount: 4500, due_date: "2024-08-01" },
];

const payments = [
  { id: "pay_1", invoice_id: "inv_101", amount: 2000, payment_date: "2024-03-10" },
  { id: "pay_2", invoice_id: "inv_102", amount: 3000, payment_date: "2025-01-05" },
  { id: "pay_3", invoice_id: "inv_103", amount: 5000, payment_date: "2024-10-20" },
  { id: "pay_4", invoice_id: "inv_105", amount: 1000, payment_date: "2024-07-15" },
];

app.get("/customers", (req, res) => res.json(customers));
app.get("/invoices", (req, res) => res.json(invoices));
app.get("/payments", (req, res) => res.json(payments));

app.listen(4000, () => console.log("Mock API running on port 4000"));
