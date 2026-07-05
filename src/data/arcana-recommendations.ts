export interface ArcanaRecommendation {
  color: "Red" | "Green" | "Blue";
  names: string[];
  reason: string;
}

export interface RoleLoadout {
  role: string;
  description: string;
  recommendations: ArcanaRecommendation[];
}

export const arcanaLoadoutsByRole: RoleLoadout[] = [
  {
    role: "Tank (Roam / Clash Lane)",
    description:
      "Tanks need to survive long fights and support their team. Stack health, defenses, and cooldown reduction.",
    recommendations: [
      { color: "Red", names: ["Fate"], reason: "Health + defense + attack speed for sustained pressure" },
      { color: "Green", names: ["Harmony", "Longevity"], reason: "Maximum health pool for team-fight survival" },
      { color: "Blue", names: ["Fortify", "Reverberation"], reason: "Defense + cooldown for repeated engages" },
    ],
  },
  {
    role: "Mage (Mid)",
    description: "Mages need raw magic damage and the cooldown reduction to chain spells.",
    recommendations: [
      { color: "Red", names: ["Nightmare", "Saint"], reason: "Magic attack + magic pierce for burst damage" },
      { color: "Green", names: ["Reincarnation"], reason: "Magic attack + lifesteal for sustain in lane" },
      { color: "Blue", names: ["Compassion", "Tribute"], reason: "Cooldown reduction to spam abilities" },
    ],
  },
  {
    role: "Marksman (Farm)",
    description: "Marksmen scale with attack speed, critical strikes, and physical pierce in late game.",
    recommendations: [
      { color: "Red", names: ["Calamity", "Mutation", "Red Moon"], reason: "Crit rate + attack speed for DPS scaling" },
      { color: "Green", names: ["Hunt"], reason: "Movement speed + attack speed for kiting" },
      { color: "Blue", names: ["Eagle Eye"], reason: "Physical pierce to shred tanks" },
    ],
  },
  {
    role: "Warrior / Fighter (Clash Lane)",
    description: "Warriors mix damage and durability — split the difference between tank and assassin.",
    recommendations: [
      { color: "Red", names: ["Conflict", "Mutation"], reason: "Physical attack + pierce + lifesteal" },
      { color: "Green", names: ["Reaver"], reason: "Physical lifesteal for sustained trades" },
      { color: "Blue", names: ["Eagle Eye"], reason: "Pierce to bypass defensive items" },
    ],
  },
  {
    role: "Assassin (Jungle)",
    description: "Assassins burst squishy targets and escape. Front-load damage and movement speed.",
    recommendations: [
      { color: "Red", names: ["Mutation"], reason: "Physical attack + pierce for burst" },
      { color: "Green", names: ["Hunt", "Stealth"], reason: "Movement speed for ganking and escape" },
      { color: "Blue", names: ["Eagle Eye"], reason: "Pierce to one-shot squishy targets" },
    ],
  },
];
