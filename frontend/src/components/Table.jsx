export default function Table({ columns, rows, emptyMsg = "No data found." }) {
  return (
    <div className="overflow-x-auto rounded-xl shadow">
      <table className="min-w-full bg-white text-sm">
        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-left font-medium">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6 text-center text-gray-400">
                {emptyMsg}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-gray-700">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
