import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CULTURAL_OUTFITS,
  GAME_MODES,
  HAZARDS_DATA,
  HERO_SLIDES,
  SKILLS_DATA,
} from '../src/data/gameContent';
import { ROSTER_PRESETS } from '../src/three/kidLook';

const ROOT = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(ROOT, 'assets');

function readTextFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...readTextFiles(full));
    else if (/\.(ts|css|html)$/.test(entry.name)) out.push(fs.readFileSync(full, 'utf8'));
  }
  return out;
}

describe('Kalye 8 Standalone Landing Page Content & Assets', () => {
  it('contains all 10 skills, 3 hazards, 5 modes, 4 cultural outfits, and 10 roster presets', () => {
    expect(SKILLS_DATA).toHaveLength(10);
    expect(HAZARDS_DATA).toHaveLength(3);
    expect(GAME_MODES).toHaveLength(5);
    expect(CULTURAL_OUTFITS).toHaveLength(4);
    expect(ROSTER_PRESETS).toHaveLength(10);

    for (const s of SKILLS_DATA) {
      expect(s.energyCost).toBeGreaterThanOrEqual(12);
      expect(s.energyCost).toBeLessThanOrEqual(24);
      expect(s.quip.length).toBeGreaterThan(3);
      expect(s.learnDesc.length).toBeGreaterThan(10);
      expect(s.lusobDesc.length).toBeGreaterThan(5);
      expect(s.bantayDesc.length).toBeGreaterThan(5);
    }
    for (const h of HAZARDS_DATA) {
      expect(h.quip.length).toBeGreaterThan(3);
    }
  });

  it('stores all referenced assets directly inside root assets/ (safe to delete kalye-8/)', () => {
    const assetUrls = new Set<string>([
      'favicon.svg',
      'models/kid.glb',
      'models/kid_menu_anims.glb',
      'models/kalye_skills.glb',
      'models/nanay_rig.glb',
      'models/kalye_street.glb',
      'models/kalye_beyond.glb',
      'draco/draco_decoder.js',
      'draco/draco_decoder.wasm',
      'draco/draco_wasm_wrapper.js',
      'basis/basis_transcoder.js',
      'basis/basis_transcoder.wasm',
      'textures/street/road.ktx2',
      'textures/street/plaster.ktx2',
      'textures/street/yero.ktx2',
      'textures/street/sign.ktx2',
      'textures/street/wear_street_road.ktx2',
      'textures/street/wear_street_left.ktx2',
      'textures/street/wear_street_right.ktx2',
      'textures/street/wear_street_cross.ktx2',
      'textures/street/wear_street_ends.ktx2',
      'audio/bgm_title.mp3',
      'images/logos/kalye-8.svg',
      'images/logos/dost.png',
      'images/logos/level-up.png',
      'images/skills/action_runner_juke.jpg',
      'images/skills/action_tag_lunge.jpg',
      'images/kanto/nuno_photo_wink.png',
      'images/ui-kit/PNGs/Buttons/LargeButtons/ButtonLargeGreen.png',
      'images/ui-kit/PNGs/Buttons/LargeButtons/ButtonLargeBlue.png',
      'images/ui-kit/PNGs/Buttons/Tab.png',
      'images/ui-kit/PNGs/Buttons/TabActive.png',
      'images/ui-kit/PNGs/TitleContainers/TitleContainerSettings.png',
      'images/ui-kit/PNGs/TitleContainers/TitleContainerExit.png',
    ]);

    for (const s of SKILLS_DATA) {
      assetUrls.add(s.iconUrl);
      assetUrls.add(s.audioUrl);
    }
    for (const h of HAZARDS_DATA) {
      assetUrls.add(h.iconUrl);
      assetUrls.add(h.audioUrl);
    }
    for (const slide of HERO_SLIDES) {
      assetUrls.add(slide.imageUrl);
    }

    for (const rel of assetUrls) {
      const full = path.join(ASSETS_DIR, rel);
      expect(fs.existsSync(full), `Expected standalone asset in root assets/: ${rel}`).toBe(true);
    }
  });

  it('has zero runtime/build references to kalye-8/ or external live-game URLs', () => {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const pkg = fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8');
    const viteCfg = fs.readFileSync(path.join(ROOT, 'vite.config.ts'), 'utf8');
    const srcFiles = readTextFiles(path.join(ROOT, 'src'));

    for (const content of [html, pkg, viteCfg, ...srcFiles]) {
      expect(content).not.toContain('20-196-64-188.sslip.io');
      expect(content).not.toContain('kalye-8/');
    }
  });
});
