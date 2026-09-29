import React from "react";
import { Boxes, History, Bell } from "lucide-react";

export default function InventoryTabsNav({ activeTab, setActiveTab, alertsSummary }) {
  const tabs = [
    { id: "STORE_STATE", label: "Current Stock State", icon: Boxes },
    { id: "LEDGER_TRAIL", label: "Movement Ledger Trail", icon: History },
    { id: "ALERTS_QUEUE", label: "Low-Stock Alerts", icon: Bell, badge: alertsSummary?.totalActive },
  ];

  return (
    <div className="flex items-center gap-2 border-b border-[#D2D2D7]/12 pb-2 overflow-x-auto">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 cursor-pointer whitespace-nowrap ${
              isActive
                ? "bg-[#0066CC] text-white shadow-[0_2px_12px_rgba(0,102,204,0.35)]"
                : "text-[#D2D2D7] hover:text-white hover:bg-white/10"
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-[#6E6E73]"}`} />
            <span>{tab.label}</span>
            {tab.badge > 0 && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-[#FF791B]/20 text-[#FFA466] border border-[#FF791B]/30"
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
