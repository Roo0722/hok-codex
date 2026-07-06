"use client";

import { useEffect, useMemo, useState } from "react";
import { TabNav, TabKey } from "@/components/TabNav";
import { HeroCard } from "@/components/HeroCard";
import { HeroDetailModal } from "@/components/HeroDetailModal";
import { ItemCard } from "@/components/ItemCard";
import { ItemDetailModal } from "@/components/ItemDetailModal";
import { ArcanaCard } from "@/components/ArcanaCard";
import { ArcanaRecommendations } from "@/components/ArcanaRecommendations";
import { PatchTab } from "@/components/PatchTab";
import { heroes, type Hero } from "@/data/heroes";
import { items, type Item } from "@/data/items";
import { arcana } from "@/data/arcana";
import { getPublishedPatches, getPendingPatches } from "@/data/patches";
import { fetchLiveRankings, type RemoteRanking } from "@/lib/worker-api";
import { Search } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabKey>("heroes");
  const [query, setQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedHero, setSelectedHero] = useState<Hero | null>(null);
  const [rankings, setRankings] = useState<Record<string, RemoteRanking>>({});
  const [sortByRanking, setSortByRanking] = useState(false);

  useEffect(() => {
    fetchLiveRankings()
      .then((data) => {
        const map: Record<string, RemoteRanking> = {};
        for (const r of data) map[r.hero_name] = r;
        setRankings(map);
      })
      .catch(() => {
        // Rankings are a nice-to-have; silently fall back to static tier data.
      });
  }, []);

  const publishedPatches = useMemo(() => getPublishedPatches(), []);
  const pendingPatches = useMemo(() => getPendingPatches(), []);

  const recentlyChangedIds = useMemo(() => {
    const latest = publishedPatches[0];
    if (!latest) return new Set<string>();
    return new Set(latest.structuredChanges.map((c) => c.entityId));
  }, [publishedPatches]);

  const tierOrder: Record<string, number> = { "S+": 0, S: 1, A: 2, B: 3, C: 4 };

  const filteredHeroes = useMemo(() => {
    const base = heroes.filter((h) => h.name.toLowerCase().includes(query.toLowerCase()));
    if (!sortByRanking) return base;
    return [...base].sort((a, b) => {
      const tierA = rankings[a.name]?.tier || a.tier;
      const tierB = rankings[b.name]?.tier || b.tier;
      return (tierOrder[tierA] ?? 99) - (tierOrder[tierB] ?? 99);
    });
  }, [query, sortByRanking, rankings]);
  const filteredItems = useMemo(
    () => items.filter((i) => i.name.toLowerCase().includes(query.toLowerCase())),
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
        <p className="text-xs text-[#808080]">Heroes, items, arcana — always current</p>
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

      {activeTab === "heroes" && (
        <div className="px-3 pb-2 flex justify-end">
          <button
            onClick={() => setSortByRanking((v) => !v)}
            className={`text-xs px-3 py-1.5 rounded-full border ${
              sortByRanking
                ? "bg-[#C2924C]/20 border-[#C2924C]/50 text-[#E7C285]"
                : "border-[#C2924C]/20 text-[#808080]"
            }`}
          >
            Sort by ranking
          </button>
        </div>
      )}

      {activeTab === "heroes" && (
        <div className="grid grid-cols-1 gap-2 px-3">
          {filteredHeroes.map((hero) => (
            <HeroCard
              key={hero.heroId}
              hero={hero}
              changedRecently={recentlyChangedIds.has(hero.slug)}
              ranking={rankings[hero.name]}
              onClick={setSelectedHero}
            />
          ))}
          {filteredHeroes.length === 0 && (
            <p className="text-sm text-[#808080] text-center py-8">No heroes found.</p>
          )}
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

      {activeTab === "arcana" && (
        <>
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
          {query === "" && (
            <div className="mt-4">
              <ArcanaRecommendations />
            </div>
          )}
        </>
      )}

      {activeTab === "patches" && (
        <PatchTab publishedPatches={publishedPatches} pendingPatches={pendingPatches} />
      )}

      <HeroDetailModal hero={selectedHero} onClose={() => setSelectedHero(null)} />
      <ItemDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
    </main>
  );
}
