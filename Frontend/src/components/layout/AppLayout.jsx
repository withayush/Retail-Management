import React, { useState, useEffect, useCallback } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "./Sidebar";
import Header from "./Header";
import UniversalSearchModal from "./UniversalSearchModal";

export default function AppLayout({ children }) {
  const { user, business, logout } = useAuth();
  const navigate = useNavigate();

  // Desktop Collapsed state (saved in localStorage)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sidebarCollapsed") === "true";
    } catch {
      return false;
    }
  });

  // Mobile Drawer state
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Universal Search Modal State
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebarCollapsed", String(next));
      return next;
    });
  }, []);

  // Global Keyboard Shortcuts (Ctrl+K for search, Ctrl+B for sidebar toggle, F2 for POS)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleCollapse();
      } else if (e.key === "F2") {
        e.preventDefault();
        navigate("/pos");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleCollapse, navigate]);

  return (
    <div className="min-h-screen flex bg-[#09090b] text-zinc-100 antialiased font-sans">
      {/* Persistent Responsive Sidebar */}
      <Sidebar
        user={user}
        business={business}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        onLogout={logout}
      />

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#09090b]">
        <Header
          user={user}
          onOpenMobileSidebar={() => setIsMobileOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onLogout={logout}
        />

        {/* Dynamic Page View Area */}
        <main className="flex-1 overflow-y-auto bg-[#09090b]">
          {children || <Outlet />}
        </main>
      </div>

      {/* Universal Search Modal */}
      <UniversalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
}
