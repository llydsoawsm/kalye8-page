import { SKILLS_DATA, type SkillData } from '../data/gameContent';
import type { SkillDemoViewer } from '../three/skillDemoViewer';

export function initSkillsShowcase(root: ParentNode = document): void {
  const section = root.querySelector<HTMLElement>('#skills');
  const grid = root.querySelector<HTMLElement>('#skills-grid');
  const iconEl = root.querySelector<HTMLImageElement>('#skill-detail-icon');
  const nameEl = root.querySelector<HTMLElement>('#skill-detail-name');
  const metaEl = root.querySelector<HTMLElement>('#skill-detail-meta');
  const quipEl = root.querySelector<HTMLElement>('#skill-detail-quip');
  const descEl = root.querySelector<HTMLElement>('#skill-detail-desc');
  const lusobEl = root.querySelector<HTMLElement>('#skill-detail-lusob');
  const bantayEl = root.querySelector<HTMLElement>('#skill-detail-bantay');

  const demoCanvas = root.querySelector<HTMLCanvasElement>('#skill-demo-canvas');
  const demoStatus = root.querySelector<HTMLElement>('#skill-demo-status');
  const replayBtn = root.querySelector<HTMLButtonElement>('#btn-skill-replay');

  if (!grid || SKILLS_DATA.length === 0) return;

  let activeSkill: SkillData = SKILLS_DATA[0];
  let demoViewer: SkillDemoViewer | null = null;
  let demoAttempted = false;
  let replayCount = 0;

  if (section) section.dataset.replayCount = '0';

  const selectSkill = (skill: SkillData) => {
    activeSkill = skill;
    grid.querySelectorAll<HTMLButtonElement>('.skill-tile').forEach((tile) => {
      tile.setAttribute('aria-pressed', String(tile.dataset.skillId === skill.id));
    });

    if (iconEl) {
      iconEl.src = skill.iconUrl;
      iconEl.alt = skill.name;
    }
    if (nameEl) nameEl.textContent = skill.name;
    if (metaEl) metaEl.textContent = `${skill.energyCost} Energy · ${skill.aimLabel}`;
    if (quipEl) quipEl.textContent = skill.quip;
    if (descEl) descEl.textContent = skill.learnDesc;
    if (lusobEl) lusobEl.textContent = skill.lusobDesc;
    if (bantayEl) bantayEl.textContent = skill.bantayDesc;

    demoViewer?.setSkill(skill.id);
  };

  grid.innerHTML = '';
  for (const skill of SKILLS_DATA) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'skill-tile';
    btn.dataset.skillId = skill.id;
    btn.setAttribute('aria-pressed', String(skill.id === activeSkill.id));
    btn.innerHTML = `
      <img class="skill-tile__img" src="${skill.iconUrl}" alt="" loading="lazy" />
      <span class="skill-tile__name">${skill.name}</span>
    `;
    btn.addEventListener('click', () => selectSkill(skill));
    grid.appendChild(btn);
  }

  replayBtn?.addEventListener('click', () => {
    replayCount += 1;
    if (section) section.dataset.replayCount = String(replayCount);
    demoViewer?.replay();
  });

  const mountDemo = async () => {
    if (demoAttempted || !demoCanvas || typeof WebGLRenderingContext === 'undefined') return;
    demoAttempted = true;
    try {
      const { SkillDemoViewer: DemoClass } = await import('../three/skillDemoViewer');
      demoViewer = new DemoClass(demoCanvas, activeSkill.id, () => {
        demoCanvas.classList.add('is-ready');
        if (demoStatus) demoStatus.hidden = true;
      });
    } catch {
      if (demoStatus) {
        demoStatus.hidden = false;
        demoStatus.textContent = '3D demo unavailable on this device.';
      }
    }
  };

  if (section && typeof IntersectionObserver !== 'undefined') {
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          obs.disconnect();
          void mountDemo();
        }
      },
      { rootMargin: '240px 0px' },
    );
    obs.observe(section);
  }

  selectSkill(SKILLS_DATA[0]);
}
