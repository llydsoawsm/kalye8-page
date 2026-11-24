export function initSiteChrome(root: ParentNode = document): void {
  const header = root.querySelector<HTMLElement>('#site-header');
  const navLinks = root.querySelectorAll<HTMLAnchorElement>('.site-nav__link');
  const revealNodes = root.querySelectorAll<HTMLElement>('.reveal');

  const updateScroll = () => {
    header?.classList.toggle('is-scrolled', window.scrollY > 36);
  };

  window.addEventListener('scroll', updateScroll, { passive: true });
  updateScroll();

  if (typeof IntersectionObserver === 'undefined') {
    revealNodes.forEach((el) => el.classList.add('is-revealed'));
    return;
  }

  if (revealNodes.length > 0) {
    const revealObs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            revealObs.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.14 },
    );
    revealNodes.forEach((el) => revealObs.observe(el));
  }

  const linkById = new Map<string, HTMLAnchorElement>();
  navLinks.forEach((a) => {
    const id = a.getAttribute('href')?.replace('#', '');
    if (id) linkById.set(id, a);
  });

  if (linkById.size > 0) {
    const navObs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = entry.target.id;
          if (!linkById.has(id)) continue;
          navLinks.forEach((a) => a.classList.remove('is-active'));
          linkById.get(id)?.classList.add('is-active');
        }
      },
      { rootMargin: '-35% 0px -55% 0px' },
    );
    linkById.forEach((_, id) => {
      const target = root.querySelector(`#${id}`);
      if (target) navObs.observe(target);
    });
  }
}
