export default function Badge({ label, type = "default" }) {
  const styles = {
    overdue: "bg-red-100 text-red-700",
    paid: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    default: "bg-gray-100 text-gray-700",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[type] || styles.default}`}>
      {label}
    </span>
  );
}
