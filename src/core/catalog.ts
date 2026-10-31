import type { Ratio } from "./types";

export type ItemConfig = {
  slug: string;
  name: string;
  id: number;
  depths: readonly number[];
  standardDepth: number;
  standardRatio: Ratio;
};

const STD: Ratio = ["sell", 90];
const D_DEFAULT = [1, 500, 1000, 2000, 3000, 4000, 5000];
const D_MATRIX = [1, 250, 500, 1000, 5000, 10000, 20000];
const D_STONE = [1, 50, 100, 250, 500, 1000];

export const ITEMS: readonly ItemConfig[] = [
  { slug: "mc", name: "Mystic Coin", id: 19976, depths: [1, 250, 1000, 2500, 5000], standardDepth: 2500, standardRatio: STD },
  { slug: "ecto", name: "Glob of Ectoplasm", id: 19721, depths: D_DEFAULT, standardDepth: 2000, standardRatio: STD },
  { slug: "matrix", name: "Stabilizing Matrix", id: 73248, depths: D_MATRIX, standardDepth: 1000, standardRatio: STD },
  { slug: "encryption", name: "Fractal Encryption Key", id: 75919, depths: D_MATRIX, standardDepth: 1000, standardRatio: STD },
  { slug: "ass", name: "Antique Summoning Stone", id: 96978, depths: D_STONE, standardDepth: 250, standardRatio: STD },
  { slug: "ambergris", name: "Chunk of Ancient Ambergris", id: 96347, depths: D_STONE, standardDepth: 250, standardRatio: STD },
  { slug: "runestone", name: "Jade Runestone", id: 96722, depths: D_DEFAULT, standardDepth: 2000, standardRatio: STD },
  { slug: "gemstone", name: "Amalgamated Gemstone", id: 68063, depths: D_DEFAULT, standardDepth: 2000, standardRatio: STD },
  { slug: "lodestone", name: "Amalgamated Draconic Lodestone", id: 92687, depths: [50, 100, 250, 500], standardDepth: 100, standardRatio: STD },
];

export type SetConfig = {
  slug: string;
  name: string;
  tier: number;
  materials: readonly { name: string; id: number }[];
  depths: readonly number[];
  standardDepth: number;
  standardRatio: Ratio;
};

const SET_DEPTHS = [1, 100, 250, 1000, 5000];
const mats = (ids: number[]) =>
  ["Blood", "Bones", "Claws", "Dust", "Fangs", "Scales", "Totems", "Venom"].map((name, i) => ({ name, id: ids[i]! }));

export const SETS: readonly SetConfig[] = [
  {
    slug: "t5", name: "T5 set", tier: 5, depths: SET_DEPTHS, standardDepth: 250, standardRatio: STD,
    materials: mats([24294, 24341, 24350, 24276, 24356, 24288, 24299, 24282]),
  },
  {
    slug: "t6", name: "T6 set", tier: 6, depths: SET_DEPTHS, standardDepth: 250, standardRatio: STD,
    materials: mats([24295, 24358, 24351, 24277, 24357, 24289, 24300, 24283]),
  },
];

/** Non-weapon legendaries that are tradeable and belong on /leg. Weapons are auto-discovered. */
export const LEGENDARY_INCLUDE: readonly number[] = [105497]; // Aetheric Anchor

/** Gen 3 = Aurene's weapons (End of Dragons). Everything else discovered is Gen 1 or "Other". */
export const LEGENDARY_GEN3_PREFIX = "Aurene's ";
export const LEGENDARY_OTHER_NAMES: readonly string[] = ["Klobjarne Geirr", "Wages of Stars", "Aetheric Anchor"];

export type LegendaryEntry = { id: number; name: string; gen: 1 | 3 | "other"; kind: string };

export const REFRESH_MS = 5 * 60 * 1000;
export const itemBySlug = (slug: string) => ITEMS.find((i) => i.slug === slug);
export const setBySlug = (slug: string) => SETS.find((s) => s.slug === slug);
