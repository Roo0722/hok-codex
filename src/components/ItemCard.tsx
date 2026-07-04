"use client";

import type { Item } from "@/data/items";
import { getItemImagePath } from "@/data/items";

interface ItemCardProps {
  item: Item;
  changedRecently?: boolean;
  onClick: (item: Item) => void;
}

export function ItemCard({ item, changedRecently, onClick }: ItemCardProps) {
  const statEntries = Object.entries(item.stats).slice(0, 3);

  return (
    <button
      onClick={() => onClick(item)}
      className="hok-card rounded-lg p-3 text-left w-full relative"
    >
      {changedRecently && (
        <span className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded bg-[#E85D3A]/20 text-[#F09880] border border-[#E85D3A]/30">
          Updated
        </span>
      )}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded bg-[#2A2A2A] overflow-hidden shrink-0">
          <img
            src={getItemImagePath(item.itemId)}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-[#F0F0F0] truncate">{item.name}</h3>
          <p className="text-xs text-[#C2924C] font-mono">{item.price} gold</p>
        </div>
      </div>

      <div className="mt-2 space-y-1">
        {statEntries.map(([key, value]) => (
          <div key={key} className="flex items-center justify-between text-xs">
            <span className="text-[#808080] capitalize">{key}</span>
            <span className="text-[#F0F0F0] font-mono">{value}</span>
          </div>
        ))}
      </div>
    </button>
  );
}
