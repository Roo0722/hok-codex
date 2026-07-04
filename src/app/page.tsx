"use client";

import { useMemo, useState } from "react";
import { TabNav, TabKey } from "@/components/TabNav";
import { ItemCard } from "@/components/ItemCard";
import { ItemDetailModal } from "@/components/ItemDetailModal";
import { ArcanaCard } from "@/components/ArcanaCard";
import { SkillCard } from "@/components/SkillCard";
import { PatchTab } from "@/components/PatchTab";
import { items, type Item } from "@/data/items";
import { skills } from "@/data/skills";
import { arcana } from "@/data/arcana";
import { getPublishedPatches, getPendingPatches } from "@/data/patches";
import { Search } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabKey>("items");
  const [query, setQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const publishedPatches = useMemo(() => getPublishedPatches(), []);
  const pendingPatches = useMemo(() => getPendingPatches(), []);

  const recentlyChangedIds = useMemo(() => {
    const latest = publishedPatches[0];
    if (!latest) return new Set<string>();
    return new Set(latest.structuredChanges.map((c) => c.entityId));
  }, [publishedPatches]);

  const filteredItems = useMemo(
    () => items.filter((i) => i.name.toLowerCase().includes(query.toLowerCase())),
    [query]
  );
  const filteredSkills = useMemo(
    () =>
      skills.filter(
        (s) =>
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          s.heroName.toLowerCase().includes(query.toLowerCase())
      ),
    [query]
  );
  const filteredArcana = useMemo(
    () => arcana.filter((a) => a.name.toLowerCase().includes(query.toLowerCase())),
    [query]
  );

  return (
    <main className="min-h-screen pb-6">
      <header className="p-4 border-b border-[#C2924C]/10">
        <h1 className="text-lg font-semibold text-[#E7C285]">HoK Codex</h1>
        <p className="text-xs text-[#808080]">Items, skills, arcana — always current</p>
      </header>

      <TabNav
        active={activeTab}
        onChange={setActiveTab}
        pendingPatchCount={pendingPatches.length}
      />

      {activeTab !== "patches" && (
        <div className="p-3">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#808080]"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              className="w-full bg-[#1A1A1A] border border-[#C2924C]/10 rounded-lg py-2 pl-9 pr-3 text-sm text-[#F0F0F0] placeholder-[#666666] outline-none focus:border-[#C2924C]/40"
            />
          </div>
        </div>
      )}

      {activeTab === "items" && (
        <div className="grid grid-cols-1 gap-2 px-3">
          {filteredItems.map((item) => (
            <ItemCard
              key={item.itemId}
              item={item}
              changedRecently={recentlyChangedIds.has(item.itemId)}
              onClick={setSelectedItem}
            />
          ))}
          {filteredItems.length === 0 && (
            <p className="text-sm text-[#808080] text-center py-8">No items found.</p>
          )}
        </div>
      )}

      {activeTab === "skills" && (
        <div className="grid grid-cols-1 gap-2 px-3">
          {filteredSkills.map((skill) => (
            <SkillCard
              key={skill.skillId}
              skill={skill}
              changedRecently={recentlyChangedIds.has(skill.skillId)}
            />
          ))}
          {filteredSkills.length === 0 && (
            <p className="text-sm text-[#808080] text-center py-8">No skills found.</p>
          )}
        </div>
      )}

      {activeTab === "arcana" && (
        <div className="grid grid-cols-1 gap-2 px-3">
          {filteredArcana.map((a) => (
            <ArcanaCard
              key={a.arcanaId}
              arcana={a}
              changedRecently={recentlyChangedIds.has(a.arcanaId)}
            />
          ))}
          {filteredArcana.length === 0 && (
            <p className="text-sm text-[#808080] text-center py-8">No arcana found.</p>
          )}
        </div>
      )}

      {activeTab === "patches" && (
        <PatchTab publishedPatches={publishedPatches} pendingPatches={pendingPatches} />
      )}

      <ItemDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
    </main>
  );
}
