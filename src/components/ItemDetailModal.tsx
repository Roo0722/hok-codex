"use client";

import type { Item } from "@/data/items";
import { getItemImagePath } from "@/data/items";
import { X } from "lucide-react";

interface ItemDetailModalProps {
  item: Item | null;
  onClose: () => void;
}

export function ItemDetailModal({ item, onClose }: ItemDetailModalProps) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center">
      <div className="hok-card rounded-t-2xl sm:rounded-lg w-full sm:max-w-md max-h-[85vh] overflow-y-auto p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded bg-[#2A2A2A] overflow-hidden shrink-0">
              <img
                src={getItemImagePath(item.itemId)}
                alt={item.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#E7C285]">{item.name}</h2>
              <p className="text-sm text-[#C2924C] font-mono">{item.price} gold</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#808080] p-1">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-1 mb-4">
          {Object.entries(item.stats).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between text-sm">
              <span className="text-[#808080] capitalize">{key}</span>
              <span className="text-[#F0F0F0] font-mono">{value}</span>
            </div>
          ))}
        </div>

        {item.passive && (
          <div className="mb-3 pt-3 border-t border-[#C2924C]/10">
            <p className="text-xs font-semibold text-[#C2924C] mb-1">Passive</p>
            <p className="text-sm text-[#CCCCCC] leading-relaxed">{item.passive}</p>
          </div>
        )}

        {item.active && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-[#C2924C] mb-1">Active</p>
            <p className="text-sm text-[#CCCCCC] leading-relaxed">{item.active}</p>
          </div>
        )}

        {item.unique && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-[#C2924C] mb-1">Unique</p>
            <p className="text-sm text-[#CCCCCC] leading-relaxed">{item.unique}</p>
          </div>
        )}

        {item.components.length > 0 && (
          <div className="pt-3 border-t border-[#C2924C]/10">
            <p className="text-xs font-semibold text-[#999999] mb-2">Builds from</p>
            <div className="flex flex-wrap gap-1.5">
              {item.components.map((c) => (
                <span
                  key={c.id}
                  className="text-xs px-2 py-1 rounded bg-[#2A2A2A] text-[#F0F0F0]"
                >
                  {c.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <p className="text-[10px] text-[#666666] mt-4">
          Last updated: {item.lastUpdated || "unknown"}
        </p>
      </div>
    </div>
  );
}
