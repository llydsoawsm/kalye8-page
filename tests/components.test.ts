import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { generateRandomTeam } from '../src/components/kidShowcase';
import { bootstrapApp } from '../src/main';
import { assignUniqueEmotes, F_KEY_EMOTES, pickNextUniqueEmote } from '../src/three/kidEmotes';
import { OUTFIT_SETS } from '../src/three/kidLook';

const HTML = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');

describe('Kalye 8 Minimal Landing Page', () => {
  beforeEach(() => {
    document.documentElement.innerHTML = HTML;
    bootstrapApp(document);
  });

  it('renders all minimal sections, 6 essential rules, controls strip, and omits removed sound/hint/booth copy', () => {
    expect(document.querySelector('#hero')).not.toBeNull();
    expect(document.querySelector('#hero #hero-map-canvas')).not.toBeNull();
    expect(document.querySelector('.hero__bg')).toBeNull();
    expect(document.querySelector('#kids')).not.toBeNull();
    expect(document.querySelector('#skills')).not.toBeNull();
    expect(document.querySelector('#play')).not.toBeNull();
    expect(document.querySelector('#booth')).not.toBeNull();
    expect(document.querySelector('#scroll-rail')).not.toBeNull();
    expect(document.querySelector('#controls-strip')).not.toBeNull();
    expect(document.querySelectorAll('#play .rule-row')).toHaveLength(6);

    expect(document.querySelector('#btn-bgm-toggle')).toBeNull();
    expect(document.querySelector('#btn-skill-sound')).toBeNull();
    expect(document.querySelector('.kid-hint')).toBeNull();
    expect(document.querySelector('.booth-copy')).toBeNull();
    expect(document.querySelector('#pole-drawer')).toBeNull();
    expect(document.querySelector('#map-nav')).toBeNull();
    expect(document.querySelector('#court-tabs')).toBeNull();
  });

  it('generates a varied 5-kid random lobby squad and shuffles cleanly without WebGL', () => {
    const team = generateRandomTeam(5);
    expect(team).toHaveLength(5);
    expect(new Set(team.map((k) => k.topColor)).size).toBe(5);
    expect(team.some((k) => OUTFIT_SETS.some((s) => s.top === k.top))).toBe(true);

    expect(document.querySelector('#kids #kid-canvas')).not.toBeNull();
    expect(document.querySelectorAll('#kids .crew-bar__cell')).toHaveLength(3);

    const shuffleBtn = document.querySelector<HTMLButtonElement>('#btn-kid-random');
    expect(shuffleBtn?.textContent?.trim()).toBe('Shuffle Team');

    const section = document.querySelector<HTMLElement>('#kids');
    expect(section?.dataset.shuffleCount).toBe('0');
    shuffleBtn?.click();
    expect(section?.dataset.shuffleCount).toBe('1');
  });

  it('assigns strictly unique random emotes from all 8 F-key emotes for the 5-kid crew', () => {
    expect(F_KEY_EMOTES.map((e) => e.clip)).toEqual([
      'Backflip',
      'Budots',
      'PaCute',
      'Tma',
      'Brazil',
      'GandaNgBuhay',
      'NgusoPoint',
      'YawnScratch',
    ]);

    let prev = assignUniqueEmotes(5);
    expect(prev).toHaveLength(5);
    expect(new Set(prev.map((e) => e.id)).size).toBe(5);

    for (let trial = 0; trial < 50; trial++) {
      const next = assignUniqueEmotes(5, prev);
      expect(next).toHaveLength(5);
      expect(new Set(next.map((e) => e.id)).size).toBe(5);
      for (let i = 0; i < 5; i++) {
        expect(next[i].id).not.toBe(prev[i].id);
      }
      prev = next;
    }

    const active = [...prev];
    for (let trial = 0; trial < 50; trial++) {
      const slot = trial % 5;
      const replacement = pickNextUniqueEmote(active, slot);
      const otherIds = new Set(active.filter((_, idx) => idx !== slot).map((e) => e.id));
      expect(otherIds.has(replacement.id)).toBe(false);
      expect(replacement.id).not.toBe(active[slot].id);
      active[slot] = replacement;
      expect(new Set(active.map((e) => e.id)).size).toBe(5);
    }
  });

  it('renders all 10 street skills, updates detail view on click, and wires demo replay', () => {
    const tiles = document.querySelectorAll<HTMLButtonElement>('#skills-grid .skill-tile');
    expect(tiles).toHaveLength(10);
    expect(tiles[0].getAttribute('aria-pressed')).toBe('true');
    expect(document.querySelector('#skill-detail-name')?.textContent).toBe('Nanay Hanger');
    expect(document.querySelector('#skills #skill-demo-canvas')).not.toBeNull();

    const slipperTile = Array.from(tiles).find((t) => t.textContent?.includes('Slipper Toss'));
    expect(slipperTile).toBeDefined();
    slipperTile?.click();

    expect(slipperTile?.getAttribute('aria-pressed')).toBe('true');
    expect(document.querySelector('#skill-detail-name')?.textContent).toBe('Slipper Toss');
    expect(document.querySelector('#skill-detail-meta')?.textContent).toBe('15 Energy · Lobbed Arc (12m)');
    expect(document.querySelector('#skill-detail-quip')?.textContent).toContain('Sapul');

    const replayBtn = document.querySelector<HTMLButtonElement>('#btn-skill-replay');
    expect(replayBtn).not.toBeNull();
    const skillsSection = document.querySelector<HTMLElement>('#skills');
    expect(skillsSection?.dataset.replayCount).toBe('0');
    replayBtn?.click();
    expect(skillsSection?.dataset.replayCount).toBe('1');
  });
});
