export interface KidEmoteDef {
  id: string;
  clip: string;
  label: string;
  seconds: number;
  loop: boolean;
  previewAt: number;
}

/** All 8 F-key wheel emotes available in the game. */
export const F_KEY_EMOTES: readonly KidEmoteDef[] = [
  { id: 'backflip', clip: 'Backflip', label: 'BACKFLIP', seconds: 1.7, loop: false, previewAt: 0.45 },
  { id: 'budots', clip: 'Budots', label: 'BUDOTS', seconds: 3.2, loop: true, previewAt: 0.3 },
  { id: 'pacute', clip: 'PaCute', label: 'PA-CUTE', seconds: 2.2, loop: false, previewAt: 0.5 },
  { id: 'tma', clip: 'Tma', label: 'TMA', seconds: 10, loop: false, previewAt: 0.29 },
  { id: 'brazil', clip: 'Brazil', label: 'BRAZILIAN', seconds: 5, loop: false, previewAt: 0.22 },
  { id: 'gandangbuhay', clip: 'GandaNgBuhay', label: 'LYCA', seconds: 14, loop: false, previewAt: 0.32 },
  { id: 'nguso', clip: 'NgusoPoint', label: 'NGUSO', seconds: 2.2, loop: false, previewAt: 0.5 },
  { id: 'hikab', clip: 'YawnScratch', label: 'HIKAB', seconds: 2.6, loop: false, previewAt: 0.45 },
];

/**
 * Deals `count` strictly unique emotes from the 8 F-key emotes so no two
 * crew members perform the same emote at the same time. When `previous` is
 * provided, avoids repeating a slot's prior emote whenever possible.
 */
export function assignUniqueEmotes(
  count = 5,
  previous?: readonly KidEmoteDef[],
  rng: () => number = Math.random,
): KidEmoteDef[] {
  const clamped = Math.max(0, Math.min(count, F_KEY_EMOTES.length));
  const pool = [...F_KEY_EMOTES];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1)) % (i + 1);
    const tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
  }

  const chosen = pool.slice(0, clamped);
  const unused = pool.slice(clamped);

  if (previous && previous.length >= clamped) {
    for (let i = 0; i < clamped; i++) {
      if (chosen[i].id !== previous[i]?.id) continue;
      if (unused.length > 0) {
        const swap = unused[0];
        unused[0] = chosen[i];
        chosen[i] = swap;
      } else {
        for (let j = 0; j < clamped; j++) {
          if (j === i) continue;
          if (chosen[j].id !== previous[i]?.id && chosen[i].id !== previous[j]?.id) {
            const tmp = chosen[i];
            chosen[i] = chosen[j];
            chosen[j] = tmp;
            break;
          }
        }
      }
    }
  }

  return chosen;
}

/**
 * Picks a random next emote for `slotIndex` that is not currently used by any
 * other teammate and differs from `slotIndex`'s current emote.
 */
export function pickNextUniqueEmote(
  activeEmotes: readonly (KidEmoteDef | null)[],
  slotIndex: number,
  rng: () => number = Math.random,
): KidEmoteDef {
  const otherIds = new Set<string>();
  for (let i = 0; i < activeEmotes.length; i++) {
    if (i !== slotIndex && activeEmotes[i]) {
      otherIds.add(activeEmotes[i]!.id);
    }
  }
  const currentId = activeEmotes[slotIndex]?.id;
  const fresh = F_KEY_EMOTES.filter((e) => !otherIds.has(e.id) && e.id !== currentId);
  const fallback = fresh.length > 0 ? fresh : F_KEY_EMOTES.filter((e) => !otherIds.has(e.id));
  const pool = fallback.length > 0 ? fallback : F_KEY_EMOTES;
  return pool[Math.floor(rng() * pool.length) % pool.length];
}

