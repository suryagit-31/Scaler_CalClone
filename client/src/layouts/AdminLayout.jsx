import { Outlet, NavLink } from "react-router-dom";
import {
  Link2,
  Calendar,
  Clock,
  Search,
  ChevronDown,
  User,
} from "lucide-react";

function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-50 border-r border-gray-200">
        <div className="flex flex-col h-full">
          {/* User Profile Section */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-amber-700 flex items-center justify-center text-white font-medium text-sm">
                    T
                  </div>
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-gray-50"></div>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  Surya Damma...
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ChevronDown className="w-4 h-4 text-gray-500" />
                <Search className="w-4 h-4 text-gray-500" />
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-4 space-y-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-gray-200 text-black"
                    : "text-gray-600 hover:bg-gray-100"
                }`
              }
            >
              <Link2 className="w-4 h-4" />
              Event types
            </NavLink>

            <NavLink
              to="/bookings"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-gray-200 text-black"
                    : "text-gray-600 hover:bg-gray-100"
                }`
              }
            >
              <Calendar className="w-4 h-4" />
              Bookings
            </NavLink>

            <NavLink
              to="/availability"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-gray-200 text-black"
                    : "text-gray-600 hover:bg-gray-100"
                }`
              }
            >
              <Clock className="w-4 h-4" />
              Availability
            </NavLink>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 bg-gray-50 min-h-screen p-4">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
