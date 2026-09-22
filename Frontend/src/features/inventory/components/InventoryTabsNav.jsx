import React from "react";
import { Boxes, History, Bell } from "lucide-react";

export default function InventoryTabsNav({ activeTab, setActiveTab, alertsSummary }) {
  const tabs = [
    { id: "STORE_STATE", label: "Current Stock State", icon: Boxes },
    { id: "LEDGER_TRAIL", label: "Movement Ledger Audit", icon: History },
    { id: "ALERTS_QUEUE", label: "Low-Stock Alerts", icon: Bell, badge: alertsSummary?.totalActive },
  ];

  return (
    <div className="flex items-center gap-1.5 border-b border-[#1f1f23] pb-1 overflow-x-auto">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              isActive
                ? "bg-zinc-800 text-white font-semibold shadow-xs"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-zinc-400"}`} />
            <span>{tab.label}</span>
            {tab.badge > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive
                    ? "bg-red-500/20 text-red-300 border border-red-500/30"
                    : "bg-zinc-800 text-zinc-300 border border-zinc-700"
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
