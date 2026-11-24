import * as THREE from 'three';
import { loadRealStreetWorld, OUTLINE_LAYER, type RealStreetWorld } from './paintedStreet';

export class StreetMapViewer {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(52, 1, 0.2, 450);
  private world?: RealStreetWorld;
  private clock = new THREE.Clock();
  private elapsed = 0;
  private raf = 0;
  private isVisible = true;
  private isDisposed = false;
  private resizeObserver: ResizeObserver;
  private visObserver: IntersectionObserver;

  private readonly baseCamPos = new THREE.Vector3(10.5, 7.4, 29.0);
  private readonly baseLookAt = new THREE.Vector3(-1.2, 2.0, 1.0);

  constructor(
    private canvas: HTMLCanvasElement,
    private onReady?: () => void,
  ) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setPixelRatio(Math.min(1.75, window.devicePixelRatio || 1));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.camera.layers.enable(OUTLINE_LAYER);
    this.camera.position.copy(this.baseCamPos);
    this.camera.lookAt(this.baseLookAt);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas.parentElement ?? canvas);
    this.visObserver = new IntersectionObserver(
      (entries) => {
        this.isVisible = entries.some((e) => e.isIntersecting);
        if (this.isVisible && !document.hidden) this.startLoop();
        else this.stopLoop();
      },
      { threshold: 0.02 },
    );
    this.visObserver.observe(canvas);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    window.addEventListener('resize', this.onWindowResize);

    this.resize();
    void this.initWorld();
  }

  private async initWorld(): Promise<void> {
    this.world = await loadRealStreetWorld(this.renderer, this.scene, {
      camPos: this.baseCamPos,
      withShadows: true,
      withClouds: true,
      programKeyPrefix: 'hero-street',
      isDisposed: () => this.isDisposed,
    });
    if (this.isDisposed) return;

    this.world.updateViewport(Math.max(1, this.renderer.domElement.height));
    this.renderer.render(this.scene, this.camera);
    this.onReady?.();
    if (this.isVisible && !document.hidden) this.startLoop();
  }

  private resize(): void {
    const host = this.canvas.parentElement ?? this.canvas;
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (w <= 0 || h <= 0) return;

    this.renderer.setPixelRatio(Math.min(1.75, window.devicePixelRatio || 1));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.world?.updateViewport(Math.max(1, this.renderer.domElement.height));
    this.renderer.render(this.scene, this.camera);
  }

  private onWindowResize = (): void => this.resize();

  private onVisibilityChange = (): void => {
    if (!document.hidden && this.isVisible) this.startLoop();
    else this.stopLoop();
  };

  private startLoop(): void {
    if (this.raf || this.isDisposed) return;
    this.clock.getDelta();
    this.raf = requestAnimationFrame(this.loop);
  }

  private stopLoop(): void {
    if (!this.raf) return;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private loop = (): void => {
    this.raf = 0;
    if (!this.isVisible || document.hidden || this.isDisposed) return;

    const dt = Math.min(0.05, this.clock.getDelta());
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!reducedMotion && this.world) {
      this.elapsed += dt;
      const swayX = Math.sin(this.elapsed * 0.21) * 2.2;
      const swayY = Math.cos(this.elapsed * 0.16) * 0.4;
      this.camera.position.set(this.baseCamPos.x + swayX, this.baseCamPos.y + swayY, this.baseCamPos.z);
      this.camera.lookAt(this.baseLookAt.x + swayX * 0.35, this.baseLookAt.y, this.baseLookAt.z);
      this.world.skyMesh.position.copy(this.camera.position);
      this.world.updateClouds(dt);
    }

    this.renderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame(this.loop);
  };

  public dispose(): void {
    this.isDisposed = true;
    this.stopLoop();
    this.resizeObserver.disconnect();
    this.visObserver.disconnect();
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    window.removeEventListener('resize', this.onWindowResize);
    this.renderer.dispose();
  }
}
