import { CLOTH_PRESETS, HAIR_OPTIONS, OUTFIT_SETS, randomLook, type KidLook } from '../three/kidLook';
import type { KidViewer } from '../three/kidViewer';

export function generateRandomTeam(count = 5, rng: () => number = Math.random): KidLook[] {
  const team: KidLook[] = [];
  const usedTops = new Set<string>();

  for (let i = 0; i < count; i++) {
    const look = randomLook(rng);
    if (usedTops.has(look.topColor)) {
      const nextColor = CLOTH_PRESETS.find((c) => !usedTops.has(c));
      if (nextColor) look.topColor = nextColor;
    }
    usedTops.add(look.topColor);
    team.push(look);
  }

  const hasHeritage = team.some((k) => OUTFIT_SETS.some((s) => s.top === k.top));
  if (!hasHeritage && team.length > 0) {
    const pickIdx = Math.floor(rng() * team.length) % team.length;
    const set = OUTFIT_SETS[Math.floor(rng() * OUTFIT_SETS.length) % OUTFIT_SETS.length];
    const hairs = set.group ? HAIR_OPTIONS.filter((h) => h.group === set.group) : HAIR_OPTIONS;
    const hair = hairs[Math.floor(rng() * hairs.length) % hairs.length];
    team[pickIdx] = {
      ...team[pickIdx],
      top: set.top,
      bottom: set.bottom,
      shoes: set.shoes,
      hair: hair.id,
    };
  }

  return team;
}

export function initKidShowcase(root: ParentNode = document): void {
  const section = root.querySelector<HTMLElement>('#kids');
  const canvas = root.querySelector<HTMLCanvasElement>('#kid-canvas');
  const statusEl = root.querySelector<HTMLElement>('#kid-stage-status');
  const randomBtn = root.querySelector<HTMLButtonElement>('#btn-kid-random');

  let team: KidLook[] = generateRandomTeam(5);
  let viewer: KidViewer | null = null;
  let viewerAttempted = false;
  let shuffleCount = 0;

  if (section) section.dataset.shuffleCount = '0';

  randomBtn?.addEventListener('click', () => {
    team = generateRandomTeam(5);
    shuffleCount += 1;
    if (section) section.dataset.shuffleCount = String(shuffleCount);
    if (viewer) {
      viewer.setTeam(team);
      viewer.playTeamEmotes();
    }
  });

  if (canvas) {
    let downX = 0;
    let downY = 0;
    canvas.addEventListener('pointerdown', (e) => {
      downX = e.clientX;
      downY = e.clientY;
    });
    canvas.addEventListener('pointerup', (e) => {
      const dist = Math.hypot(e.clientX - downX, e.clientY - downY);
      if (dist < 6) viewer?.playTeamEmotes();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key.toLowerCase() !== 'f') return;
    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable)
    ) {
      return;
    }
    viewer?.playTeamEmotes();
  });

  const mountViewer = async () => {
    if (viewerAttempted || !canvas) return;
    viewerAttempted = true;
    try {
      const { KidViewer: ViewerClass } = await import('../three/kidViewer');
      viewer = new ViewerClass(canvas, team);
      if (statusEl) statusEl.hidden = true;
    } catch {
      if (statusEl) {
        statusEl.hidden = false;
        statusEl.textContent = '3D squad preview unavailable on this device.';
      }
    }
  };

  if (section && typeof IntersectionObserver !== 'undefined') {
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          obs.disconnect();
          void mountViewer();
        }
      },
      { rootMargin: '240px 0px' },
    );
    obs.observe(section);
  }
}
