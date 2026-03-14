import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/customers", label: "Customers" },
  { to: "/overdue", label: "Overdue Invoices" },
];

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
      <span className="text-lg font-bold text-indigo-600">PaySaathi</span>
      <div className="flex gap-6">
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `text-sm font-medium transition-colors ${
                isActive ? "text-indigo-600" : "text-gray-500 hover:text-gray-800"
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
