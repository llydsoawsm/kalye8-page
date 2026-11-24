import './styles/main.css';

import { initHeroMap } from './components/heroMap';
import { initKidShowcase } from './components/kidShowcase';
import { initSiteChrome } from './components/siteChrome';
import { initSkillsShowcase } from './components/skillsShowcase';

export function bootstrapApp(root: ParentNode = document): void {
  initSiteChrome(root);
  initHeroMap(root);
  initKidShowcase(root);
  initSkillsShowcase(root);
}

if (typeof document !== 'undefined') {
  bootstrapApp(document);
}
