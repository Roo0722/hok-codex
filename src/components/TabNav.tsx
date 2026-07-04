"use client";

export type TabKey = "items" | "skills" | "arcana" | "patches";

interface TabNavProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
  pendingPatchCount?: number;
}

const tabs: { key: TabKey; label: string }[] = [
  { key: "items", label: "Items" },
  { key: "skills", label: "Skills" },
  { key: "arcana", label: "Arcana" },
  { key: "patches", label: "Patches" },
];

export function TabNav({ active, onChange, pendingPatchCount = 0 }: TabNavProps) {
  return (
    <nav className="flex border-b border-[#C2924C]/10 sticky top-0 bg-[#0D0D0D] z-10">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`relative flex-1 py-3 text-sm font-medium transition-colors ${
            active === tab.key
              ? "text-[#E7C285] border-b-2 border-[#C2924C]"
              : "text-[#808080]"
          }`}
        >
          {tab.label}
          {tab.key === "patches" && pendingPatchCount > 0 && (
            <span className="absolute top-1.5 right-1/4 w-2 h-2 rounded-full bg-[#E85D3A]" />
          )}
        </button>
      ))}
    </nav>
  );
}
