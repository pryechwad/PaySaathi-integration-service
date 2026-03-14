export default function StatCard({ title, value, color = "text-gray-800" }) {
  return (
    <div className="bg-white rounded-xl shadow p-5 flex flex-col gap-1">
      <span className="text-sm text-gray-500">{title}</span>
      <span className={`text-2xl font-semibold ${color}`}>{value}</span>
    </div>
  );
}
