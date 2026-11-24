/**
 * Standalone character look data & palette math for Kalye 8 (models/kid.glb).
 */

export type FaceId = 'grin' | 'smile' | 'smug' | 'determined' | 'tawa' | 'kilig' | 'gulat' | 'pikon';
export type HairId = 'messy' | 'spiky' | 'ponytail' | 'pigtails' | 'semikalbo' | 'curtain' | 'tirintas' | 'sampaguita';
export type CapId = 'none' | 'forward' | 'backward' | 'bucket' | 'bandana' | 'salakot' | 'bimpo' | 'snapback';
export type TopId = 'tee' | 'graphic' | 'sando' | 'jersey' | 'duster' | 'barong' | 'tboli' | 'ifugao';
export type BottomId = 'garter' | 'jogger' | 'denim' | 'ballers' | 'pambahay' | 'slacks' | 'tnalak' | 'ifugaowrap';
export type ShoesId = 'tsinelas' | 'slides' | 'sneakers' | 'barefoot' | 'bakya' | 'schoolshoes' | 'anklets' | 'sandals';
export type SkinId = 'mestiza' | 'light' | 'golden' | 'kayumanggi' | 'morena' | 'deep';

export interface KidLook {
  v: 1;
  face: FaceId;
  hair: HairId;
  cap: CapId;
  top: TopId;
  bottom: BottomId;
  shoes: ShoesId;
  skin: SkinId;
  hairColor: string;
  capColor: string;
  topColor: string;
  bottomColor: string;
  shoeColor: string;
}

export interface Option<T extends string> {
  id: T;
  label: string;
  group?: 'boy' | 'girl';
}

export const FACE_OPTIONS: Option<FaceId>[] = [
  { id: 'grin', label: 'Fierce Grin' },
  { id: 'smile', label: 'Masayahin' },
  { id: 'smug', label: 'Mayabang' },
  { id: 'determined', label: 'Seryoso' },
  { id: 'tawa', label: 'Tawa' },
  { id: 'kilig', label: 'Kilig' },
  { id: 'gulat', label: 'Gulat' },
  { id: 'pikon', label: 'Pikon' },
];

export const HAIR_OPTIONS: Option<HairId>[] = [
  { id: 'messy', label: 'Messy Crop', group: 'boy' },
  { id: 'spiky', label: 'Spiky Fade', group: 'boy' },
  { id: 'ponytail', label: 'High Ponytail', group: 'girl' },
  { id: 'pigtails', label: 'Twin Pigtails', group: 'girl' },
  { id: 'semikalbo', label: 'Semi-Kalbo', group: 'boy' },
  { id: 'curtain', label: 'Curtain Bangs', group: 'boy' },
  { id: 'tirintas', label: 'Tirintas', group: 'girl' },
  { id: 'sampaguita', label: 'Sampaguita Bun', group: 'girl' },
];

export const CAP_OPTIONS: Option<CapId>[] = [
  { id: 'none', label: 'None' },
  { id: 'forward', label: 'Baseball Cap' },
  { id: 'backward', label: 'Backwards Cap' },
  { id: 'bucket', label: 'Bucket Hat' },
  { id: 'bandana', label: 'Bandana' },
  { id: 'salakot', label: 'Salakot' },
  { id: 'bimpo', label: 'Bimpo' },
  { id: 'snapback', label: 'Araw Snapback' },
];

export const TOP_OPTIONS: Option<TopId>[] = [
  { id: 'tee', label: 'Plain Tee' },
  { id: 'graphic', label: 'Araw Tee' },
  { id: 'sando', label: 'Sando' },
  { id: 'jersey', label: 'Jersey' },
  { id: 'duster', label: 'Duster', group: 'girl' },
  { id: 'barong', label: 'Barong Tagalog' },
  { id: 'tboli', label: "T'boli Blouse", group: 'girl' },
  { id: 'ifugao', label: 'Ifugao Wrap', group: 'boy' },
];

export const BOTTOM_OPTIONS: Option<BottomId>[] = [
  { id: 'garter', label: 'Garter Shorts' },
  { id: 'jogger', label: 'Striped Shorts' },
  { id: 'denim', label: 'Denim Shorts' },
  { id: 'ballers', label: 'Ballers' },
  { id: 'pambahay', label: 'Pambahay Shorts', group: 'girl' },
  { id: 'slacks', label: 'Slacks' },
  { id: 'tnalak', label: "T'nalak Skirt", group: 'girl' },
  { id: 'ifugaowrap', label: 'Ifugao Woven Wrap', group: 'boy' },
];

export const SHOE_OPTIONS: Option<ShoesId>[] = [
  { id: 'tsinelas', label: 'Tsinelas' },
  { id: 'slides', label: 'Slides' },
  { id: 'sneakers', label: 'Sneakers' },
  { id: 'barefoot', label: 'Nakayapak' },
  { id: 'bakya', label: 'Bakya', group: 'girl' },
  { id: 'schoolshoes', label: 'School Shoes' },
  { id: 'anklets', label: 'Brass Anklets', group: 'girl' },
  { id: 'sandals', label: 'Woven Sandals', group: 'boy' },
];

export const SKIN_PRESETS: { id: SkinId; label: string; hex: string }[] = [
  { id: 'mestiza', label: 'Mestiza', hex: '#F0CBA4' },
  { id: 'light', label: 'Light Kayumanggi', hex: '#DDA677' },
  { id: 'golden', label: 'Golden Kayumanggi', hex: '#C98A55' },
  { id: 'kayumanggi', label: 'Kayumanggi', hex: '#B8713F' },
  { id: 'morena', label: 'Morena / Moreno', hex: '#985A30' },
  { id: 'deep', label: 'Deep Moreno', hex: '#74401F' },
];

export const HAIR_PRESETS = ['#22262A', '#3A2A20', '#5E3B22', '#8A5A30', '#B07A45'];

export const CLOTH_PRESETS = [
  '#E04A3C', '#F6C735', '#2F7FD8', '#2F5C9E', '#3FA35B', '#F2F0E6',
  '#2B2D33', '#E8789A', '#8B5CC7', '#F08A2E', '#4FC1C9', '#9C5B3B',
];

export const DEFAULT_LOOK: KidLook = {
  v: 1,
  face: 'grin',
  hair: 'messy',
  cap: 'none',
  top: 'tee',
  bottom: 'garter',
  shoes: 'tsinelas',
  skin: 'kayumanggi',
  hairColor: '#22262A',
  capColor: '#E04A3C',
  topColor: '#F2F0E6',
  bottomColor: '#2F5C9E',
  shoeColor: '#2F7FD8',
};

export const SLOT_KEYS = ['face', 'hair', 'cap', 'top', 'bottom', 'shoes'] as const;
export type SlotKey = (typeof SLOT_KEYS)[number];

export const SLOT_OPTIONS: Record<SlotKey, Option<string>[]> = {
  face: FACE_OPTIONS,
  hair: HAIR_OPTIONS,
  cap: CAP_OPTIONS,
  top: TOP_OPTIONS,
  bottom: BOTTOM_OPTIONS,
  shoes: SHOE_OPTIONS,
};

export const SLOT_COLOR: Record<SlotKey, keyof KidLook | null> = {
  face: null,
  hair: 'hairColor',
  cap: 'capColor',
  top: 'topColor',
  bottom: 'bottomColor',
  shoes: 'shoeColor',
};

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function isHex(v: unknown): v is string {
  return typeof v === 'string' && HEX_RE.test(v);
}

function hexToRgb(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (x: number) => Math.round(Math.max(0, Math.min(1, x)) * 255).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase();
}

export function hexToHsl(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}

export function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return rgbToHex(r + m, g + m, b + m);
}

export function luminance(hex: string): number {
  const lin = hexToRgb(hex).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

export function shadowOf(hex: string): string {
  const [h, s, l] = hexToHsl(hex);
  let d = ((15 - h + 540) % 360) - 180;
  d = Math.max(-12, Math.min(12, d));
  const sat = s < 0.08 ? s + 0.12 : Math.min(1, s * 1.15 + 0.04);
  return hslToHex(h + d * 0.6, sat, l * 0.74);
}

export function detailOf(hex: string): string {
  const [h, s] = hexToHsl(hex);
  if (luminance(hex) > 0.35) return hslToHex(h, Math.min(0.6, s * 0.8 + 0.1), 0.2);
  return hslToHex(h + 25, Math.min(0.35, s * 0.4 + 0.08), 0.92);
}

export function shadeOf(hex: string): string {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, Math.min(1, s * 1.05), Math.max(0.06, l * 0.72));
}

export function skinHex(id: SkinId): string {
  return (SKIN_PRESETS.find((p) => p.id === id) ?? SKIN_PRESETS[3]).hex;
}

export function capped(look: KidLook): boolean {
  return look.cap !== 'none';
}

export function visibleParts(look: KidLook): string[] {
  const parts = [
    'GEO-body',
    'GEO-head',
    `GEO-face_${look.face}`,
    `GEO-hair_${look.hair}${capped(look) ? '_capped' : ''}`,
    `GEO-top_${look.top}`,
    `GEO-bottom_${look.bottom}`,
  ];
  if (look.cap !== 'none') parts.push(`GEO-cap_${look.cap}`);
  if (look.shoes !== 'barefoot') parts.push(`GEO-shoe_${look.shoes}_L`, `GEO-shoe_${look.shoes}_R`);
  return parts;
}

export function tintColor(look: KidLook, tint: string): string | null {
  const base: Record<string, string> = {
    skin: skinHex(look.skin),
    hair: look.hairColor,
    cap: look.capColor,
    top: look.topColor,
    bottom: look.bottomColor,
    shoe: look.shoeColor,
  };
  if (tint in base) return base[tint];
  if (tint.endsWith('_shade')) {
    const b = base[tint.slice(0, -'_shade'.length)];
    return b ? shadeOf(b) : null;
  }
  if (tint.endsWith('_detail')) {
    const b = base[tint.slice(0, -'_detail'.length)];
    return b ? detailOf(b) : null;
  }
  return null;
}

function pick<T extends string>(v: unknown, opts: { id: T }[], fallback: T): T {
  return opts.some((o) => o.id === v) ? (v as T) : fallback;
}

export function sanitizeLook(raw: unknown): KidLook {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const d = DEFAULT_LOOK;
  const col = (k: keyof KidLook) => (isHex(r[k]) ? (r[k] as string).toUpperCase() : (d[k] as string));
  return {
    v: 1,
    face: pick(r.face, FACE_OPTIONS, d.face),
    hair: pick(r.hair, HAIR_OPTIONS, d.hair),
    cap: pick(r.cap, CAP_OPTIONS, d.cap),
    top: pick(r.top, TOP_OPTIONS, d.top),
    bottom: pick(r.bottom, BOTTOM_OPTIONS, d.bottom),
    shoes: pick(r.shoes, SHOE_OPTIONS, d.shoes),
    skin: pick(r.skin, SKIN_PRESETS, d.skin),
    hairColor: col('hairColor'),
    capColor: col('capColor'),
    topColor: col('topColor'),
    bottomColor: col('bottomColor'),
    shoeColor: col('shoeColor'),
  };
}

export const OUTFIT_SETS: readonly { top: TopId; bottom: BottomId; shoes: ShoesId; group?: 'boy' | 'girl' }[] = [
  { top: 'duster', bottom: 'pambahay', shoes: 'bakya', group: 'girl' },
  { top: 'barong', bottom: 'slacks', shoes: 'schoolshoes' },
  { top: 'tboli', bottom: 'tnalak', shoes: 'anklets', group: 'girl' },
  { top: 'ifugao', bottom: 'ifugaowrap', shoes: 'sandals', group: 'boy' },
];

const IN_A_SET = new Set<string>(OUTFIT_SETS.flatMap((o) => [o.top, o.bottom, o.shoes]));
const everyday = <T extends string>(opts: Option<T>[]): Option<T>[] => opts.filter((o) => !IN_A_SET.has(o.id));
const choose = <T>(rng: () => number, arr: readonly T[]): T => arr[Math.floor(rng() * arr.length) % arr.length];

export function randomLook(rng: () => number = Math.random): KidLook {
  const set = rng() < 0.25 ? choose(rng, OUTFIT_SETS) : null;
  const hairs = set?.group ? HAIR_OPTIONS.filter((h) => h.group === set.group) : HAIR_OPTIONS;
  return {
    v: 1,
    face: choose(rng, FACE_OPTIONS).id,
    hair: choose(rng, hairs).id,
    cap: rng() < 0.45 ? 'none' : choose(rng, CAP_OPTIONS.slice(1)).id,
    top: set ? set.top : choose(rng, everyday(TOP_OPTIONS)).id,
    bottom: set ? set.bottom : choose(rng, everyday(BOTTOM_OPTIONS)).id,
    shoes: set
      ? set.shoes
      : rng() < 0.12
        ? 'barefoot'
        : choose(rng, everyday(SHOE_OPTIONS).filter((o) => o.id !== 'barefoot')).id,
    skin: choose(rng, SKIN_PRESETS).id,
    hairColor: rng() < 0.7 ? HAIR_PRESETS[0] : choose(rng, HAIR_PRESETS),
    capColor: choose(rng, CLOTH_PRESETS),
    topColor: choose(rng, CLOTH_PRESETS),
    bottomColor: choose(rng, CLOTH_PRESETS),
    shoeColor: choose(rng, CLOTH_PRESETS),
  };
}

const L = (o: Partial<KidLook>): KidLook => ({ ...DEFAULT_LOOK, ...o });

export interface RosterPreset {
  id: string;
  name: string;
  team: 'Blue' | 'Red';
  look: KidLook;
}

export const ROSTER_PRESETS: RosterPreset[] = [
  { id: 'blue-1', name: 'BONG', team: 'Blue', look: L({}) },
  {
    id: 'blue-2',
    name: 'NENE',
    team: 'Blue',
    look: L({ face: 'tawa', hair: 'pigtails', skin: 'light', top: 'graphic', topColor: '#F6C735', bottom: 'jogger', bottomColor: '#2F5C9E', shoes: 'slides', shoeColor: '#E8789A' }),
  },
  {
    id: 'blue-3',
    name: 'TINAY',
    team: 'Blue',
    look: L({ face: 'kilig', hair: 'sampaguita', hairColor: '#5E3B22', skin: 'mestiza', top: 'sando', topColor: '#F2F0E6', bottom: 'denim', bottomColor: '#3B6FB5', shoes: 'tsinelas', shoeColor: '#E04A3C' }),
  },
  {
    id: 'blue-4',
    name: 'DODONG',
    team: 'Blue',
    look: L({ face: 'determined', hair: 'semikalbo', skin: 'morena', top: 'jersey', topColor: '#2F7FD8', bottom: 'ballers', bottomColor: '#2F7FD8', shoes: 'sneakers', shoeColor: '#F2F0E6' }),
  },
  {
    id: 'blue-5',
    name: 'TOTOY',
    team: 'Blue',
    look: L({ face: 'grin', hair: 'messy', cap: 'snapback', capColor: '#2F7FD8', skin: 'golden', top: 'tee', topColor: '#F08A2E', bottom: 'garter', bottomColor: '#2B2D33', shoes: 'tsinelas', shoeColor: '#3FA35B' }),
  },
  {
    id: 'red-1',
    name: 'KULOT',
    team: 'Red',
    look: L({ face: 'pikon', hair: 'messy', cap: 'bimpo', capColor: '#E04A3C', skin: 'deep', top: 'jersey', topColor: '#E04A3C', bottom: 'ballers', bottomColor: '#2B2D33', shoes: 'sneakers', shoeColor: '#2B2D33' }),
  },
  {
    id: 'red-2',
    name: 'JUNJUN',
    team: 'Red',
    look: L({ face: 'gulat', hair: 'spiky', skin: 'kayumanggi', top: 'ifugao', bottom: 'ifugaowrap', shoes: 'sandals' }),
  },
  {
    id: 'red-3',
    name: 'BEBENG',
    team: 'Red',
    look: L({ face: 'smile', hair: 'ponytail', hairColor: '#3A2A20', cap: 'salakot', capColor: '#C98A3A', skin: 'golden', top: 'duster', topColor: '#F2F0E6', bottom: 'pambahay', bottomColor: '#E8789A', shoes: 'bakya', shoeColor: '#E04A3C' }),
  },
  {
    id: 'red-4',
    name: 'BOYET',
    team: 'Red',
    look: L({ face: 'determined', hair: 'curtain', hairColor: '#3A2A20', skin: 'light', top: 'barong', bottom: 'slacks', bottomColor: '#26272D', shoes: 'schoolshoes', shoeColor: '#F4F2EC', topColor: '#C9B88A' }),
  },
  {
    id: 'red-5',
    name: 'INDAY',
    team: 'Red',
    look: L({ face: 'smug', hair: 'tirintas', hairColor: '#5E3B22', skin: 'morena', top: 'tboli', bottom: 'tnalak', shoes: 'anklets' }),
  },
];

