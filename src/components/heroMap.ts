export function initHeroMap(root: ParentNode = document): void {
  const canvas = root.querySelector<HTMLCanvasElement>('#hero-map-canvas');
  if (!canvas || typeof WebGLRenderingContext === 'undefined') return;

  void (async () => {
    try {
      const { StreetMapViewer } = await import('../three/streetMapViewer');
      new StreetMapViewer(canvas, () => {
        canvas.classList.add('is-ready');
      });
    } catch {
      // Gracefully keep dark fallback canvas if WebGL is unavailable
    }
  })();
}

