require("dotenv").config();
const express = require("express");
const cors = require("cors");

const syncRoutes = require("./routes/sync");
const customerRoutes = require("./routes/customers");
const invoiceRoutes = require("./routes/invoices");
const insightRoutes = require("./routes/insights");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/sync", syncRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/insights", insightRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
