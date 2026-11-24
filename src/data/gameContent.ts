export interface EventInfo {
  title: string;
  shortTitle: string;
  occasion: string;
  dates: string;
  locationNote: string;
  ribbonLabel: string;
  inviteHeadline: string;
  inviteBody: string;
}

export const EVENT_INFO: EventInfo = {
  title: 'DOST Level Up 3.0: Esports Game Development Challenge',
  shortTitle: 'DOST LEVEL UP 3.0',
  occasion: 'National Science, Technology, and Innovation Week (NSTW 2026)',
  dates: 'November 25–29, 2026',
  locationNote: 'NSTW 2026 Showcase • Crafted in the Philippines',
  ribbonLabel: 'NSTW 2026 CUP',
  inviteHeadline: 'Tara, Laro Tayo! Visit Our Demo Booth',
  inviteBody:
    'Thanks for scanning our QR code at the DOST Level Up 3.0 Game Dev Challenge! Bring your friends, pick your favorite kid, and jump into a live 1v1 Duel or 5v5 Patintero match right at our booth.',
};

export type SkillAimType = 'none' | 'arc' | 'place';
export type SkillCategory = 'cc' | 'mobility' | 'utility' | 'aimed';

export interface SkillData {
  id: string;
  name: string;
  tagName: string;
  quip: string;
  energyCost: number;
  aim: SkillAimType;
  aimLabel: string;
  categories: SkillCategory[];
  accentColor: string;
  iconUrl: string;
  audioUrl: string;
  shortDesc: string;
  learnDesc: string;
  lusobDesc: string;
  bantayDesc: string;
}

export const SKILLS_DATA: SkillData[] = [
  {
    id: 'nanay_hanger',
    name: 'Nanay Hanger',
    tagName: 'NANAY HANGER',
    quip: '"Umuwi ka na, kakain na!"',
    energyCost: 18,
    aim: 'none',
    aimLabel: 'Instant Homing',
    categories: ['cc'],
    accentColor: '#ec4899',
    iconUrl: 'images/skills/nanay-hanger.jpg',
    audioUrl: 'audio/skills/nanay_cast.wav',
    shortDesc: 'Homing Nanay stun (1.5s)',
    learnDesc:
      'Calls Nanay, who chases down the nearest opponent with her hanger and stuns them for 1.5 s.',
    lusobDesc: 'Chases & stuns line defenders.',
    bantayDesc: 'Hunts down runners in your box.',
  },
  {
    id: 'balat_saging',
    name: 'Banana Peel',
    tagName: 'BANANA PEEL',
    quip: '"Hala, madulas!"',
    energyCost: 12,
    aim: 'arc',
    aimLabel: 'Lobbed Arc (10m)',
    categories: ['cc', 'aimed'],
    accentColor: '#eab308',
    iconUrl: 'images/skills/balat-saging.jpg',
    audioUrl: 'audio/skills/banana_land.wav',
    shortDesc: 'Lobbed slip trap (1.2s stun)',
    learnDesc:
      'Aim and lob a banana peel up to 10 m. It lies on the street, and whoever steps on it slips.',
    lusobDesc: 'Aim it at the defenders chasing you.',
    bantayDesc: 'Lob a trap where runners will cross.',
  },
  {
    id: 'tapon_tsinelas',
    name: 'Slipper Toss',
    tagName: 'SLIPPER TOSS',
    quip: '"Sapul! Balikan mo tsinelas mo!"',
    energyCost: 15,
    aim: 'arc',
    aimLabel: 'Lobbed Arc (12m)',
    categories: ['cc', 'aimed'],
    accentColor: '#38bdf8',
    iconUrl: 'images/skills/tapon-tsinelas.jpg',
    audioUrl: 'audio/skills/slipper_hit.wav',
    shortDesc: 'Lobbed 12m arc (1.8s stun, 1-shoe limp)',
    learnDesc:
      "Aim and throw your tsinelas up to 12 m. You're 15% slower until you walk over it to pick it up.",
    lusobDesc: 'Snipe a blocking guard from afar.',
    bantayDesc: 'Root a runner for an easy tag.',
  },
  {
    id: 'tumbling_kalye',
    name: 'Street Roll',
    tagName: 'STREET ROLL',
    quip: '"Lusot sa ilalim!"',
    energyCost: 18,
    aim: 'none',
    aimLabel: 'Instant Dash',
    categories: ['mobility'],
    accentColor: '#10b981',
    iconUrl: 'images/skills/tumbing-kalye.jpg',
    audioUrl: 'audio/skills/tumble.wav',
    shortDesc: '3.5m dodge roll / dive (0.6s)',
    learnDesc:
      'A quick 3.5 m roll: runners roll clean under a tag, defenders dive further for one.',
    lusobDesc: 'Roll cleanly under tags.',
    bantayDesc: 'Extended diving tag roll.',
  },
  {
    id: 'mamang_taho',
    name: 'Mamang Taho',
    tagName: 'MAMANG TAHO',
    quip: '"Tahoooo! May sago\'t arnibal!"',
    energyCost: 18,
    aim: 'place',
    aimLabel: 'Placed Lure (6m)',
    categories: ['cc', 'aimed'],
    accentColor: '#d97706',
    iconUrl: 'images/skills/mamang-taho.jpg',
    audioUrl: 'audio/skills/taho_call.wav',
    shortDesc: 'Taho vendor lures the nearest opponent (2s)',
    learnDesc:
      'Throw the taho vendor up to 6 m. For 2 s he lures the nearest opponent toward him.',
    lusobDesc: 'Pull a guard along his line, away from your gap.',
    bantayDesc: 'Call a runner toward your line.',
  },
  {
    id: 'nuno_sa_punso',
    name: 'Nuno sa Punso',
    tagName: 'NUNO SA PUNSO',
    quip: '"Tabi-tabi po!"',
    energyCost: 21,
    aim: 'place',
    aimLabel: 'Placed Curse (6m)',
    categories: ['cc', 'aimed'],
    accentColor: '#a855f7',
    iconUrl: 'images/skills/nuno-sa-punso.jpg',
    audioUrl: 'audio/skills/nuno_curse.wav',
    shortDesc: 'Beam: -40% speed, no skills (3s)',
    learnDesc:
      "Throw the nuno's mound up to 6 m. He curses the nearest opponent: 40% slower and no skills for 3 s.",
    lusobDesc: 'A nuno beams the nearest guard.',
    bantayDesc: 'A nuno beams the nearest runner.',
  },
  {
    id: 'palamig_plastik',
    name: 'Palamig sa Plastik',
    tagName: 'PALAMIG',
    quip: '"Palamig muna, init ng araw!"',
    energyCost: 21,
    aim: 'none',
    aimLabel: 'Team Aura (6s)',
    categories: ['utility'],
    accentColor: '#e11d2e',
    iconUrl: 'images/skills/palamig-sa-plastik.jpg',
    audioUrl: 'audio/skills/palamig_cast.wav',
    shortDesc: 'Drink up: allies near you refill energy 3x (6s)',
    learnDesc:
      'Drink up for 6 s. Teammates inside your circle refill their energy 3x faster.',
    lusobDesc: 'Recover stamina mid-run, and share it.',
    bantayDesc: 'Keep your line fresh.',
  },
  {
    id: 'kadang_race',
    name: 'Kadang Race',
    tagName: 'KADANG RACE',
    quip: '"Habulin niyo ko!"',
    energyCost: 15,
    aim: 'none',
    aimLabel: 'Instant Boost (4s)',
    categories: ['mobility'],
    accentColor: '#fb923c',
    iconUrl: 'images/skills/kadang-race.jpg',
    audioUrl: 'audio/skills/kadang_cast.wav',
    shortDesc: 'Ride bamboo stilts: 30% faster (4s)',
    learnDesc: 'Hop on bamboo stilts and walk 30% faster for 4 s.',
    lusobDesc: 'A longer, calmer burst of speed.',
    bantayDesc: 'Slide along your line faster.',
  },
  {
    id: 'utot_higante',
    name: 'Utot Higante',
    tagName: 'UTOT HIGANTE',
    quip: '"Uy, sino \'yon?!"',
    energyCost: 18,
    aim: 'none',
    aimLabel: 'Smoke Cloud (5s)',
    categories: ['utility'],
    accentColor: '#84cc16',
    iconUrl: 'images/skills/utot-higante.jpg',
    audioUrl: 'audio/skills/utot_cast.wav',
    shortDesc: 'Huge smoke screen hides your team (5s)',
    learnDesc:
      'Drop a huge stinky cloud. Teammates inside it are hidden from the other team for 5 s.',
    lusobDesc: 'Slip past guards unseen.',
    bantayDesc: 'Hide your line from runners.',
  },
  {
    id: 'pacman_kamao',
    name: 'Pambansang Kamao',
    tagName: 'PACMAN',
    quip: '"Walang tatama!"',
    energyCost: 24,
    aim: 'none',
    aimLabel: 'Skill Shield (1.5s)',
    categories: ['utility'],
    accentColor: '#facc15',
    iconUrl: 'images/skills/pacman.jpg',
    audioUrl: 'audio/skills/kamao_cast.wav',
    shortDesc: 'Immune to enemy skills (1.5s)',
    learnDesc:
      'Become the boxer for 1.5 s: no enemy skill can touch you (tags still can).',
    lusobDesc: 'Shrug off a slipper or a nanay.',
    bantayDesc: 'Hold your line against any skill.',
  },
];

export interface HazardData {
  id: 'padaan_tricycle' | 'askal_sprint' | 'buhos_tubig';
  name: string;
  taglishTitle: string;
  quip: string;
  announcement: string;
  effectBadge: string;
  cadenceBadge: string;
  iconUrl: string;
  audioUrl: string;
  accentColor: string;
}

export const HAZARDS_DATA: HazardData[] = [
  {
    id: 'padaan_tricycle',
    name: 'TRICYCLE PASSING',
    taglishTitle: 'Padaan! Tricycle Crossing',
    quip: '"Padaan po! Beep beep!"',
    announcement:
      'Three barangay tricycles roar across the street at 11 m/s. Getting clipped knocks you back and stuns you for 5 seconds!',
    effectBadge: '5.0s Stun + Knockback',
    cadenceBadge: '3 Crossings • 11 m/s',
    iconUrl: 'images/hazards/hazard-tricycle.png',
    audioUrl: 'audio/skills/tricycle_hazard_1.wav',
    accentColor: '#f5a623',
  },
  {
    id: 'askal_sprint',
    name: 'STRAY DOG SPRINT',
    taglishTitle: 'Askal Herd Incoming!',
    quip: '"Takbo! May aso!"',
    announcement:
      'Three packs of neighborhood askals sprint across the court at 9.5 m/s. Dodge their path or get stunned for 3 seconds!',
    effectBadge: '3.0s Stun',
    cadenceBadge: '3 Waves • 9.5 m/s',
    iconUrl: 'images/hazards/hazard-askal.png',
    audioUrl: 'audio/skills/dog_herd_bark.wav',
    accentColor: '#e32421',
  },
  {
    id: 'buhos_tubig',
    name: 'WET ASPHALT',
    taglishTitle: 'Buhos Tubig — Madulas!',
    quip: '"Buhos tubig — ingat!"',
    announcement:
      'Soapy water splashes onto 3 spots on the street for 10 seconds. Step in and you lose grip in a 1.2-second slip-and-slide!',
    effectBadge: '1.2s Slip & Slide',
    cadenceBadge: '3 Puddles • 10s',
    iconUrl: 'images/hazards/hazard-puddle.png',
    audioUrl: 'audio/skills/puddle_splash.wav',
    accentColor: '#4474e8',
  },
];

export type CourtTabId = 'lusob' | 'bantay' | 'kulong' | 'loops';

export interface CourtTabData {
  id: CourtTabId;
  label: string;
  kicker: string;
  headline: string;
  summary: string;
  bullets: string[];
  calloutStat: string;
}

export const COURT_TABS: CourtTabData[] = [
  {
    id: 'lusob',
    label: 'LUSOB (Runners)',
    kicker: 'OFFENSE • 360° MOVEMENT',
    headline: 'Cross 4 Chalk Lines & Get Home',
    summary: 'Sprint freely from Start Base to Far Zone and back to score.',
    bullets: [
      '1 full round-trip = +1 Point.',
      'Safe inside Start Base and Far Zone.',
    ],
    calloutStat: '1 Full Round-Trip = 1 Point',
  },
  {
    id: 'bantay',
    label: 'BANTAY & PATOTOT',
    kicker: 'DEFENSE • RAIL-LOCKED',
    headline: 'Hold Your Line & Guard the Spine',
    summary: 'Line Guards slide across chalk lines; the Patotot patrols the yellow center T-spine.',
    bullets: [
      'Press TAG to lunge off your line (1.65 m reach).',
      'Every lunge stuns the guard for 2.0 s after!',
    ],
    calloutStat: '1.65m Lunge • 2s Stun',
  },
  {
    id: 'kulong',
    label: 'KULONG (Jail)',
    kicker: 'SIDELINE JAIL & RESCUE',
    headline: 'Only a Teammate Can Free You',
    summary: 'Tagged runners go to the sideline cage. All 5 jailed = instant turnover.',
    bullets: [
      'Finish a lap to pick a jailed teammate to rescue.',
      'Rescued runners respawn at Start Base with fresh skills.',
    ],
    calloutStat: 'Lap Complete = Rescue Ally',
  },
  {
    id: 'loops',
    label: 'LOOPS & ENERGY',
    kicker: 'MATCH FORMAT',
    headline: 'Best-of-3 Loops & Stamina',
    summary: 'Two 90s halves per Loop, swapping roles at halftime. First to 2 Loops wins.',
    bullets: [
      'Running drains stamina; standing still refills it.',
      'Skills spend 12–24 energy.',
    ],
    calloutStat: 'Best of 3 Loops • 2 × 90s',
  },
];

export interface HowToPlaySign {
  id: string;
  title: string;
  tag: string;
  lines: string[];
}

export const HOW_TO_PLAY_SIGNS: HowToPlaySign[] = [
  {
    id: 'score',
    title: 'Takbo. Uwi. Puntos.',
    tag: 'Scoring',
    lines: [
      'LOKAL and DAYO take turns: one team runs, the other guards.',
      'Cross to the far end and back—each full trip home scores 1 point.',
      'Win 2 Loops out of 3 to claim the street!',
    ],
  },
  {
    id: 'tag',
    title: 'Bawal Mahuli',
    tag: 'Tagging',
    lines: [
      'Guards: close in and hit TAG to lunge off your chalk line.',
      'Runners: bait lunges and weave past stunned guards.',
      'Safe zones at Start Base and Far End Zone.',
    ],
  },
  {
    id: 'jail',
    title: 'Kulong',
    tag: 'Jail & Rescue',
    lines: [
      'A tagged runner goes straight to the sideline cage. No bail.',
      'A free teammate who finishes a lap picks a jailed ally to rescue.',
      'All 5 runners jailed = instant turnover!',
    ],
  },
  {
    id: 'energy',
    title: 'Palamig Muna',
    tag: 'Energy & Skills',
    lines: [
      'Running drains energy; standing still or Palamig refills it.',
      'Out of energy? You move like it is 2 PM under the sun!',
      'Pick 2 of 10 street skills before every match.',
    ],
  },
  {
    id: 'switch',
    title: 'Palit!',
    tag: '1v1 Duel Swap',
    lines: [
      'In 1v1 Duel, control all 5 kids on your squad.',
      'Press TAB (or the Switch button) to jump into another teammate mid-play.',
      'Flank guards solo by setting up your own distractions!',
    ],
  },
  {
    id: 'scoreboard',
    title: 'Iskor & MVP',
    tag: 'Match Stats',
    lines: [
      'Hold V (or tap the score pill) for the live match scoreboard.',
      'Tracks tags, laps, rescues, and Loop scores in real time.',
      'Post-match crowns the street MVP with full stats.',
    ],
  },
];

export interface ControlBinding {
  action: string;
  desktopKey: string;
  touchControl: string;
}

export const CONTROL_BINDINGS: ControlBinding[] = [
  { action: 'Move / Sprint', desktopKey: 'W A S D / Arrows', touchControl: 'Left Virtual Joystick' },
  { action: 'Tag / Lunge', desktopKey: 'SPACE', touchControl: 'TAG Action Button' },
  { action: 'Street Skill 1', desktopKey: 'Q', touchControl: 'Skill Slot 1 Button' },
  { action: 'Street Skill 2', desktopKey: 'E', touchControl: 'Skill Slot 2 Button' },
  { action: 'Switch Kid (Duel)', desktopKey: 'TAB', touchControl: 'SWITCH Teammate Button' },
  { action: 'Scoreboard / Emote', desktopKey: 'V / B', touchControl: 'Tap Score Pill / Emote' },
];

export interface GameModeData {
  id: string;
  title: string;
  badge: string;
  accentColor: string;
  description: string;
  highlights: string[];
}

export const GAME_MODES: GameModeData[] = [
  {
    id: 'vs-bots',
    title: 'VS BOTS',
    badge: 'EASY • NORMAL • HARD',
    accentColor: '#4ab328',
    description: 'Practice solo against clever bots across 3 difficulty tiers.',
    highlights: [],
  },
  {
    id: 'multiplayer',
    title: 'MULTIPLAYER 5V5',
    badge: 'ONLINE BARKADA',
    accentColor: '#4474e8',
    description: 'Squad up with K8 invite codes for full 10-player Patintero.',
    highlights: [],
  },
  {
    id: 'duel',
    title: '1V1 DUEL',
    badge: 'SQUAD SWAP',
    accentColor: '#f5a623',
    description: 'Control all 5 kids and swap roles mid-play with TAB.',
    highlights: [],
  },
  {
    id: 'custom-lobby',
    title: 'CUSTOM LOBBY',
    badge: 'PRIVATE 1V1 / 5V5',
    accentColor: '#a855f7',
    description: 'Host private rooms mixing friends and bots for brackets.',
    highlights: [],
  },
  {
    id: 'freeworld',
    title: 'FREEWORLD',
    badge: 'SANDBOX',
    accentColor: '#e32421',
    description: 'Unlimited energy and instant skills to test combos freely.',
    highlights: [],
  },
];

export interface CulturalOutfitCard {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  presetLook: {
    top: 'duster' | 'barong' | 'tboli' | 'ifugao';
    bottom: 'pambahay' | 'slacks' | 'tnalak' | 'ifugaowrap';
    shoes: 'bakya' | 'schoolshoes' | 'anklets' | 'sandals';
    cap: 'salakot' | 'none' | 'bandana';
    hair: 'ponytail' | 'curtain' | 'tirintas' | 'spiky';
    face: 'smile' | 'determined' | 'smug' | 'grin';
    skin: 'golden' | 'light' | 'morena' | 'kayumanggi';
    topColor: string;
    bottomColor: string;
    shoeColor: string;
    capColor: string;
  };
}

export const CULTURAL_OUTFITS: CulturalOutfitCard[] = [
  {
    id: 'duster',
    title: 'Duster & Bakya',
    subtitle: 'Everyday Filipino Home Look',
    description:
      'Sleeveless square-neck floral house dress paired with pambahay shorts and carved wooden bakya clogs.',
    presetLook: {
      top: 'duster',
      bottom: 'pambahay',
      shoes: 'bakya',
      cap: 'salakot',
      hair: 'ponytail',
      face: 'smile',
      skin: 'golden',
      topColor: '#F2F0E6',
      bottomColor: '#E8789A',
      shoeColor: '#E04A3C',
      capColor: '#C98A3A',
    },
  },
  {
    id: 'barong',
    title: 'Barong Tagalog',
    subtitle: 'Classic Embroidered Formal',
    description:
      'Cream embroidered Barong Tagalog worn untucked with cropped black slacks and school shoes.',
    presetLook: {
      top: 'barong',
      bottom: 'slacks',
      shoes: 'schoolshoes',
      cap: 'none',
      hair: 'curtain',
      face: 'determined',
      skin: 'light',
      topColor: '#C9B88A',
      bottomColor: '#26272D',
      shoeColor: '#F4F2EC',
      capColor: '#E04A3C',
    },
  },
  {
    id: 'tboli',
    title: "T'boli Blouse & T'nalak",
    subtitle: 'Southern Mindanao Inspired',
    description:
      "Fitted black T'boli blouse with red and white geometric trim, T'nalak-inspired diamond skirt, and brass anklets.",
    presetLook: {
      top: 'tboli',
      bottom: 'tnalak',
      shoes: 'anklets',
      cap: 'none',
      hair: 'tirintas',
      face: 'smug',
      skin: 'morena',
      topColor: '#2B2D33',
      bottomColor: '#9C5B3B',
      shoeColor: '#F6C735',
      capColor: '#E04A3C',
    },
  },
  {
    id: 'ifugao',
    title: 'Ifugao Wrap & Sandals',
    subtitle: 'Cordillera Highland Inspired',
    description:
      'Woven wrap worn over one shoulder with red-and-black striped wrap shorts and plaited native-fiber sandals.',
    presetLook: {
      top: 'ifugao',
      bottom: 'ifugaowrap',
      shoes: 'sandals',
      cap: 'none',
      hair: 'spiky',
      face: 'grin',
      skin: 'kayumanggi',
      topColor: '#E04A3C',
      bottomColor: '#E04A3C',
      shoeColor: '#9C5B3B',
      capColor: '#E04A3C',
    },
  },
];

export interface HeroSlide {
  id: string;
  badge: string;
  title: string;
  caption: string;
  imageUrl: string;
  scoreLabel: string;
}

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'street-court',
    badge: '5 PM BARANGAY COURT',
    title: '5v5 Patintero on a Living Street',
    caption: 'Chalk lines, power wires, fiesta banderitas, and the NSTW 2026 Cup billboard.',
    imageUrl: 'images/card.jpg',
    scoreLabel: 'LOKAL 02 — 01 DAYO • LOOP 2/3',
  },
  {
    id: 'skills-kanto',
    badge: "ALING NENA'S KANTO",
    title: '10 Filipino Street Skills',
    caption: 'Nanay’s flying hanger, Mamang Taho’s cart, and a Nuno sa Punso!',
    imageUrl: 'images/kanto/nuno_photo.png',
    scoreLabel: 'SKILLS CORNER • 10 TO DISCOVER',
  },
  {
    id: 'tag-lunge',
    badge: 'CLUTCH TAGS & JUKES',
    title: 'Dive, Dodge & Rescue',
    caption: 'Bait a 2-second lunge opening and bring a jailed teammate home!',
    imageUrl: 'images/skills/action_tag_lunge.jpg',
    scoreLabel: '1.65M LUNGE • BEST OF 3 LOOPS',
  },
];
