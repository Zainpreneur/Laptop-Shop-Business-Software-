import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/", label: "Dashboard", icon: "📊", end: true },
  { to: "/inventory", label: "Inventory", icon: "💻" },
  { to: "/sales", label: "Sales / POS", icon: "🧾" },
  { to: "/customers", label: "Customers", icon: "👤" },
  { to: "/suppliers", label: "Suppliers", icon: "🏭" },
  { to: "/purchase-orders", label: "Purchase Orders", icon: "📦", adminOnly: true },
  { to: "/repairs", label: "Repair Tickets", icon: "🔧" },
  { to: "/users", label: "Users", icon: "🛡️", adminOnly: true },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-slate-800">
          <div className="font-semibold text-white text-lg flex items-center gap-2">
            💻 Laptop Shop
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Business Manager</div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems
            .filter((item) => !item.adminOnly || isAdmin)
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-brand-600 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`
                }
              >
                <span>{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
        </nav>
        <div className="px-3 py-4 border-t border-slate-800">
          <div className="px-3 mb-2">
            <div className="text-sm font-medium text-white">{user?.name}</div>
            <div className="text-xs text-slate-400">{user?.role}</div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            ⏻ Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 bg-slate-50 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
