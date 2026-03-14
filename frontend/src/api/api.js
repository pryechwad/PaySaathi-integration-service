import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:3000/api" });

export const syncData = () => api.post("/sync");
export const getCustomers = () => api.get("/customers");
export const getCustomerSummary = (id) => api.get(`/customers/${id}/summary`);
export const getOverdueInvoices = () => api.get("/invoices/overdue");
export const getDashboard = () => api.get("/insights/dashboard");
