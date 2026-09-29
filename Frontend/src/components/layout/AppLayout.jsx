import React, { useState, useEffect, useCallback } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
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

  // Global Apple Keyboard Shortcuts (Cmd/Ctrl+K for search, Cmd/Ctrl+B for sidebar toggle, F2 for POS)
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

  const location = useLocation();

  return (
    <div className="min-h-screen flex bg-black text-white antialiased font-sans selection:bg-[#0066CC]/40 selection:text-white">
      {/* Persistent Apple Sidebar */}
      <Sidebar
        user={user}
        business={business}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        onLogout={logout}
      />

      {/* Main Apple Canvas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-black">
        <Header
          user={user}
          onOpenMobileSidebar={() => setIsMobileOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onLogout={logout}
        />

        {/* Dynamic Page View Area with Apple Page Enter animation */}
        <main key={location.pathname} className="flex-1 overflow-y-auto bg-black page-enter">
          {children || <Outlet />}
        </main>
      </div>

      {/* Apple Spotlight Search Modal */}
      <UniversalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
}
