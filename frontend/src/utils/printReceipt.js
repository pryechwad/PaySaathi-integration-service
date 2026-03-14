const fmt = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

export function printReceipt({ invoiceId, customer, invoiceAmount, paymentAmount, remainingAfter, paymentDate }) {
  const receiptNo = `RCP-${Date.now().toString().slice(-8)}`;
  const status = remainingAfter <= 0 ? "PAID IN FULL" : "PARTIALLY PAID";
  const statusBg = remainingAfter <= 0 ? "#f0fdf4" : "#fffbeb";
  const statusColor = remainingAfter <= 0 ? "#15803d" : "#b45309";
  const statusBorder = remainingAfter <= 0 ? "#86efac" : "#fde68a";
  const balColor = remainingAfter > 0 ? "#dc2626" : "#15803d";

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>Receipt ${receiptNo}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#1e293b}
  .page{width:680px;margin:40px auto;padding:48px;border:1px solid #e2e8f0}
  .header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:24px;border-bottom:2px solid #1e293b}
  .brand{font-size:22px;font-weight:700;letter-spacing:-0.3px}
  .brand-sub{font-size:11px;color:#64748b;margin-top:3px}
  .receipt-label{text-align:right}
  .receipt-label h2{font-size:18px;font-weight:700;text-transform:uppercase;letter-spacing:1px}
  .receipt-label p{font-size:11px;color:#64748b;margin-top:4px}
  .meta{display:flex;justify-content:space-between;margin:28px 0}
  .meta-block .lbl{color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:.06em;font-weight:600;margin-bottom:4px}
  .meta-block .val{color:#1e293b;font-weight:600;font-size:13px}
  .badge{display:inline-block;padding:3px 10px;border-radius:4px;font-size:11px;font-weight:700;letter-spacing:.05em;background:${statusBg};color:${statusColor};border:1px solid ${statusBorder};margin-top:8px}
  table{width:100%;border-collapse:collapse;margin:8px 0 24px}
  thead tr{background:#f8fafc}
  th{padding:10px 14px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0}
  td{padding:12px 14px;font-size:13px;color:#334155;border-bottom:1px solid #f1f5f9}
  .r{text-align:right}
  .totals{margin-left:auto;width:280px}
  .trow{display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#475569;border-bottom:1px solid #f1f5f9}
  .trow.last{font-weight:700;font-size:15px;color:#1e293b;border-bottom:none;padding-top:10px}
  .footer{margin-top:36px;padding-top:20px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:flex-end}
  .footer-note{font-size:11px;color:#94a3b8;line-height:1.7}
  .footer-brand{font-size:11px;color:#cbd5e1;font-weight:600}
  @media print{
    body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .page{border:none;margin:0;padding:36px;width:100%}
  }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <div class="brand">PaySaathi</div>
      <div class="brand-sub">Billing &amp; Receivables Platform</div>
    </div>
    <div class="receipt-label">
      <h2>Payment Receipt</h2>
      <p>Receipt No: <strong>${receiptNo}</strong></p>
      <p>Date: ${fmtDate(paymentDate || new Date())}</p>
    </div>
  </div>

  <div class="meta">
    <div class="meta-block">
      <div class="lbl">Received From</div>
      <div class="val">${customer}</div>
    </div>
    <div class="meta-block" style="text-align:right">
      <div class="lbl">Invoice Reference</div>
      <div class="val">${invoiceId}</div>
      <div><span class="badge">${status}</span></div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="r">Invoice Amount</th>
        <th class="r">Amount Paid</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Payment against Invoice ${invoiceId}</td>
        <td class="r">${fmt(invoiceAmount)}</td>
        <td class="r" style="color:#15803d;font-weight:600">${fmt(paymentAmount)}</td>
      </tr>
    </tbody>
  </table>

  <div class="totals">
    <div class="trow"><span>Invoice Total</span><span>${fmt(invoiceAmount)}</span></div>
    <div class="trow"><span>Amount Paid</span><span style="color:#15803d;font-weight:600">${fmt(paymentAmount)}</span></div>
    <div class="trow last"><span>Balance Remaining</span><span style="color:${balColor}">${fmt(remainingAfter)}</span></div>
  </div>

  <div class="footer">
    <div class="footer-note">
      This is a system-generated receipt and does not require a signature.<br/>
      For queries, contact your account manager.
    </div>
    <div class="footer-brand">PaySaathi</div>
  </div>
</div>
<script>window.onload=()=>{window.print()}<\/script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=780,height=900");
  win.document.write(html);
  win.document.close();
}
