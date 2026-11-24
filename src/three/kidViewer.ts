import * as THREE from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { assignUniqueEmotes, pickNextUniqueEmote, type KidEmoteDef } from './kidEmotes';
import { shadowOf, tintColor, visibleParts, type KidLook } from './kidLook';

const OUTLINE_LAYER = 1;
const KID_RIM = 0.38;
const FLAT_MATERIALS = /^MAT-(eye|blush|mouth|teeth|tongue)/;
const SUN_DIR = new THREE.Vector3(0.5, 0.85, -0.75).normalize();

const LOBBY_SPOTS: ReadonlyArray<{ x: number; z: number; yaw: number }> = [
  { x: -1.62, z: 0.52, yaw: -0.26 },
  { x: -0.82, z: 0.12, yaw: -0.14 },
  { x: 0.0, z: -0.28, yaw: 0.0 },
  { x: 0.82, z: 0.12, yaw: 0.14 },
  { x: 1.62, z: 0.52, yaw: 0.26 },
];

const OUTLINE_SHARED = {
  uWidthPx: { value: 2.2 },
  uRefDist: { value: 16 },
  uViewportH: { value: 1080 },
};

const OUTLINE_VERT = /* glsl */ `
#include <common>
#include <skinning_pars_vertex>
attribute vec3 outlineNormal;
uniform float uWidthPx;
uniform float uRefDist;
uniform float uViewportH;
void main() {
  vec3 objectNormal = outlineNormal;
  #include <skinbase_vertex>
  #include <skinnormal_vertex>
  vec3 transformed = vec3( position );
  #include <skinning_vertex>
  vec4 mvPosition = modelViewMatrix * vec4( transformed, 1.0 );
  vec3 viewNormal = normalize( normalMatrix * objectNormal );
  float depth = max( -mvPosition.z, 0.05 );
  float px = uWidthPx * clamp( uRefDist / depth, 0.4, 1.8 );
  float metresPerPx = 2.0 * depth / ( uViewportH * projectionMatrix[ 1 ][ 1 ] );
  mvPosition.xyz += viewNormal * px * metresPerPx;
  gl_Position = projectionMatrix * mvPosition;
}
`;

const OUTLINE_FRAG = /* glsl */ `
uniform vec3 uInk;
void main() {
  gl_FragColor = vec4( uInk, 1.0 );
  #include <colorspace_fragment>
}
`;

const toonCache = new Map<string, THREE.MeshToonMaterial>();
const outlineMatCache = new Map<string, THREE.ShaderMaterial>();
const sourceMats = new WeakMap<THREE.Mesh, THREE.Material[]>();

function toonMaterial(name: string, lit: string, shadow: string, rim: number): THREE.MeshToonMaterial {
  const key = `${name}|${lit}|${shadow}|${rim}`;
  const hit = toonCache.get(key);
  if (hit) return hit;

  const mat = new THREE.MeshToonMaterial({
    name,
    color: lit,
    side: THREE.DoubleSide,
  });
  mat.toneMapped = false;

  const uLit = { value: new THREE.Color(lit) };
  const uShadow = { value: new THREE.Color(shadow) };
  const uRim = { value: rim };
  const uSun = { value: SUN_DIR };

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uToonLit = uLit;
    shader.uniforms.uToonShadow = uShadow;
    shader.uniforms.uToonRim = uRim;
    shader.uniforms.uToonSun = uSun;

    shader.fragmentShader = shader.fragmentShader
      .replace(
        'void main() {',
        `uniform vec3 uToonLit;
uniform vec3 uToonShadow;
uniform float uToonRim;
uniform vec3 uToonSun;
void main() {`,
      )
      .replace(
        '#include <opaque_fragment>',
        `{
          vec3 toonN = normalize( normal );
          vec3 toonL = normalize( ( viewMatrix * vec4( uToonSun, 0.0 ) ).xyz );
          float toonNdl = dot( toonN, toonL ) * 0.5 + 0.5;
          float toonW = clamp( fwidth( toonNdl ), 0.0005, 0.08 );
          float toonLit = smoothstep( 0.45 - toonW, 0.45 + toonW, toonNdl );
          vec3 toonCol = mix( uToonShadow, uToonLit, toonLit );
          if ( uToonRim > 0.0 ) {
            float toonFres = 1.0 - clamp( dot( toonN, normalize( vViewPosition ) ), 0.0, 1.0 );
            float toonRimW = clamp( fwidth( toonFres ), 0.0005, 0.08 );
            float toonRim = smoothstep( 0.68 - toonRimW, 0.68 + toonRimW, toonFres ) * toonLit;
            toonCol = mix( toonCol, min( uToonLit * 1.3 + 0.06, vec3( 1.0 ) ), toonRim * uToonRim );
          }
          outgoingLight = toonCol;
        }
        #include <opaque_fragment>`,
      );
  };
  mat.customProgramCacheKey = () => `landing-toon-${rim > 0 ? 'rim' : 'flat'}`;
  mat.userData.toonShadow = uShadow.value;
  toonCache.set(key, mat);
  return mat;
}

function inkColorOf(shadow: THREE.Color): THREE.Color {
  const hsl = { h: 0, s: 0, l: 0 };
  shadow.getHSL(hsl);
  return new THREE.Color().setHSL(hsl.h, Math.min(1, hsl.s * 1.1), hsl.l * 0.32);
}

function outlineMaterial(ink: THREE.Color): THREE.ShaderMaterial {
  const key = ink.getHexString();
  const hit = outlineMatCache.get(key);
  if (hit) return hit;

  const mat = new THREE.ShaderMaterial({
    name: 'toon-outline',
    vertexShader: OUTLINE_VERT,
    fragmentShader: OUTLINE_FRAG,
    side: THREE.BackSide,
    uniforms: {
      uInk: { value: ink.clone() },
      uWidthPx: OUTLINE_SHARED.uWidthPx,
      uRefDist: OUTLINE_SHARED.uRefDist,
      uViewportH: OUTLINE_SHARED.uViewportH,
    },
  });
  mat.customProgramCacheKey = () => 'landing-outline-v1';
  outlineMatCache.set(key, mat);
  return mat;
}

function ensureOutlineNormals(geo: THREE.BufferGeometry): void {
  if (geo.getAttribute('outlineNormal')) return;
  const pos = geo.getAttribute('position') as THREE.BufferAttribute | undefined;
  if (!pos) return;
  const count = pos.count;
  geo.computeBoundingBox();
  const box = geo.boundingBox!;
  const size = box.getSize(new THREE.Vector3());
  const q = Math.max(size.x, size.y, size.z, 1e-6) / 65535;
  const keys = new Float64Array(count);
  for (let i = 0; i < count; i++) {
    const ix = Math.round((pos.getX(i) - box.min.x) / q);
    const iy = Math.round((pos.getY(i) - box.min.y) / q);
    const iz = Math.round((pos.getZ(i) - box.min.z) / q);
    keys[i] = (ix * 65536 + iy) * 65536 + iz;
  }

  const sums = new Map<number, [number, number, number]>();
  const index = geo.index;
  const triCount = (index ? index.count : count) / 3;
  const p0 = new THREE.Vector3();
  const p1 = new THREE.Vector3();
  const p2 = new THREE.Vector3();
  const e1 = new THREE.Vector3();
  const e2 = new THREE.Vector3();
  const faceN = new THREE.Vector3();

  const acc = (i: number, from: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3) => {
    e1.subVectors(a, from).normalize();
    e2.subVectors(b, from).normalize();
    const angle = Math.acos(Math.min(1, Math.max(-1, e1.dot(e2))));
    let s = sums.get(keys[i]);
    if (!s) sums.set(keys[i], (s = [0, 0, 0]));
    s[0] += faceN.x * angle;
    s[1] += faceN.y * angle;
    s[2] += faceN.z * angle;
  };

  for (let t = 0; t < triCount; t++) {
    const i0 = index ? index.getX(t * 3) : t * 3;
    const i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1;
    const i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2;
    p0.fromBufferAttribute(pos, i0);
    p1.fromBufferAttribute(pos, i1);
    p2.fromBufferAttribute(pos, i2);
    faceN.crossVectors(e1.subVectors(p1, p0), e2.subVectors(p2, p0));
    if (faceN.lengthSq() < 1e-18) continue;
    faceN.normalize();
    acc(i0, p0, p1, p2);
    acc(i1, p1, p2, p0);
    acc(i2, p2, p0, p1);
  }

  const out = new Float32Array(count * 3);
  const normalAttr = geo.getAttribute('normal');
  for (let i = 0; i < count; i++) {
    const s = sums.get(keys[i]);
    const len = s ? Math.hypot(s[0], s[1], s[2]) : 0;
    if (s && len > 1e-9) {
      out[i * 3] = s[0] / len;
      out[i * 3 + 1] = s[1] / len;
      out[i * 3 + 2] = s[2] / len;
    } else {
      out[i * 3] = normalAttr ? normalAttr.getX(i) : 0;
      out[i * 3 + 1] = normalAttr ? normalAttr.getY(i) : 1;
      out[i * 3 + 2] = normalAttr ? normalAttr.getZ(i) : 0;
    }
  }
  geo.setAttribute('outlineNormal', new THREE.BufferAttribute(out, 3));
}

function setMeshOutline(mesh: THREE.Mesh, shadow: THREE.Color): void {
  const geo = mesh.geometry;
  if (!geo.getAttribute('position') || !geo.getAttribute('normal')) return;
  const skin = mesh as THREE.SkinnedMesh;
  const mat = outlineMaterial(inkColorOf(shadow));
  let hull = mesh.children.find((c) => c.userData.isOutline === true) as THREE.Mesh | undefined;
  if (hull) {
    hull.material = mat;
    return;
  }
  ensureOutlineNormals(geo);
  if (skin.isSkinnedMesh) {
    const s = new THREE.SkinnedMesh(geo, mat);
    s.bind(skin.skeleton, skin.bindMatrix);
    hull = s;
  } else {
    hull = new THREE.Mesh(geo, mat);
  }
  hull.name = 'OUTLINE';
  hull.userData.isOutline = true;
  hull.layers.set(OUTLINE_LAYER);
  hull.frustumCulled = false;
  hull.matrixAutoUpdate = false;
  mesh.add(hull);
}

function shareSkeleton(root: THREE.Object3D): void {
  const skinned: THREE.SkinnedMesh[] = [];
  root.traverse((o) => {
    if ((o as THREE.SkinnedMesh).isSkinnedMesh) skinned.push(o as THREE.SkinnedMesh);
  });
  const first = skinned[0];
  if (!first) return;
  const baseSkel = first.skeleton;
  for (const mesh of skinned) {
    const s = mesh.skeleton;
    if (s === baseSkel) continue;
    const same =
      s.bones.length === baseSkel.bones.length &&
      s.bones.every((b, i) => b === baseSkel.bones[i]) &&
      s.boneInverses.every((m, i) => m.equals(baseSkel.boneInverses[i])) &&
      mesh.bindMatrix.equals(first.bindMatrix);
    if (same) mesh.bind(baseSkel, mesh.bindMatrix);
  }
}

interface KidInstance {
  root: THREE.Object3D;
  mixer: THREE.AnimationMixer;
  currentAction: THREE.AnimationAction | null;
  emote: KidEmoteDef | null;
  emoteRemaining: number;
}

export class KidViewer {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(34, 1, 0.05, 30);
  private turntable = new THREE.Group();
  private kids: KidInstance[] = [];
  private clipMap = new Map<string, THREE.AnimationClip>();
  private clock = new THREE.Clock();
  private elapsed = 0;
  private raf = 0;
  private yaw = 0;
  private isVisible = true;
  private isDragging = false;
  private isDisposed = false;
  private lastX = 0;
  private resizeObserver: ResizeObserver;
  private visObserver: IntersectionObserver;

  constructor(private canvas: HTMLCanvasElement, initialTeam: KidLook[]) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.setClearColor(0x000000, 0);

    this.scene.background = null;
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(0.95, 48),
      new THREE.MeshBasicMaterial({
        color: '#060608',
        transparent: true,
        opacity: 0.42,
        toneMapped: false,
      }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.scale.set(2.8, 1.0, 1.35);
    ground.position.set(0, 0.001, 0.14);
    this.scene.add(ground, this.turntable);

    this.camera.layers.enable(OUTLINE_LAYER);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas.parentElement ?? canvas);
    this.visObserver = new IntersectionObserver(
      (entries) => {
        this.isVisible = entries.some((e) => e.isIntersecting);
        if (this.isVisible && !document.hidden) this.startLoop();
        else this.stopLoop();
      },
      { threshold: 0.05 },
    );
    this.visObserver.observe(canvas);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    window.addEventListener('resize', this.onWindowResize);

    this.wireTouchAndMouseDrag();
    this.resize();
    void this.loadModel(initialTeam);
  }

  private async loadModel(initialTeam: KidLook[]): Promise<void> {
    const loader = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderPath('draco/');
    loader.setDRACOLoader(draco);
    const menuLoader = new GLTFLoader();

    try {
      const [gltf, menuGltf] = await Promise.all([
        loader.loadAsync('models/kid.glb'),
        menuLoader.loadAsync('models/kid_menu_anims.glb').catch(() => null),
      ]);
      if (this.isDisposed) return;

      const propsToRemove: THREE.Object3D[] = [];
      gltf.scene.traverse((o) => {
        if (/^PROP-shoe_[a-z]+$/.test(o.name)) propsToRemove.push(o);
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh) {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const m of mats) {
            if (!m.userData.kidSrc) m.userData.kidSrc = { ...m.userData };
          }
        }
      });
      for (const p of propsToRemove) p.removeFromParent();

      for (const c of gltf.animations) {
        if (!this.clipMap.has(c.name)) this.clipMap.set(c.name, c);
      }
      for (const c of menuGltf?.animations ?? []) {
        if (!this.clipMap.has(c.name)) this.clipMap.set(c.name, c);
      }

      for (let i = 0; i < LOBBY_SPOTS.length; i++) {
        const spot = LOBBY_SPOTS[i];
        const clone = SkeletonUtils.clone(gltf.scene);
        shareSkeleton(clone);
        clone.position.set(spot.x, 0, spot.z);
        clone.rotation.y = spot.yaw;
        this.turntable.add(clone);

        const mixer = new THREE.AnimationMixer(clone);
        this.kids.push({
          root: clone,
          mixer,
          currentAction: null,
          emote: null,
          emoteRemaining: 0,
        });
      }

      this.setTeam(initialTeam);
      this.playTeamEmotes(true);
      this.renderFrame();
      if (this.isVisible && !document.hidden) this.startLoop();
    } finally {
      draco.dispose();
    }
  }

  private applyLookToKid(kidRoot: THREE.Object3D, look: KidLook): void {
    const show = new Set(visibleParts(look));
    const isShown = (node: THREE.Object3D, parent: THREE.Object3D | null): boolean =>
      show.has(node.name) || (!!parent && show.has(parent.name));

    const stash = (kidRoot.userData.stashedParts ??= new Map<THREE.Object3D, THREE.Object3D>()) as Map<
      THREE.Object3D,
      THREE.Object3D
    >;
    for (const [node, parent] of [...stash]) {
      if (isShown(node, parent)) {
        parent.add(node);
        stash.delete(node);
      }
    }

    const visit = (node: THREE.Object3D): void => {
      for (const child of [...node.children]) {
        if (child.name.startsWith('GEO-')) {
          if (!isShown(child, node)) {
            stash.set(child, node);
            node.remove(child);
            continue;
          }
          child.visible = true;
        }
        visit(child);
      }
    };
    visit(kidRoot);

    kidRoot.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh || o.userData.isOutline === true) return;

      let src = sourceMats.get(mesh);
      if (!src) {
        src = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        sourceMats.set(mesh, src);
      }

      let inked = true;
      const out = src.map((m) => {
        const ud = (m.userData.kidSrc ?? m.userData) as Record<string, unknown>;
        const fallback = `#${((m as THREE.MeshStandardMaterial).color ?? new THREE.Color('#ffffff')).getHexString()}`;
        const baseLit = typeof ud.lit === 'string' ? ud.lit : fallback;
        const baseShadow = typeof ud.shadow === 'string' ? ud.shadow : shadowOf(baseLit);
        const tint = typeof ud.tint === 'string' ? ud.tint : '';
        if (ud.cast === false) inked = false;

        const lit = (tint && tintColor(look, tint)) || baseLit;
        const shadow = tint && lit !== baseLit ? shadowOf(lit) : baseShadow;
        const rim = FLAT_MATERIALS.test(m.name) ? 0 : KID_RIM;
        return toonMaterial(m.name, lit, shadow, rim);
      });

      mesh.material = Array.isArray(mesh.material) ? out : out[0];
      if (inked) {
        const shadowColor = out[0].userData.toonShadow as THREE.Color | undefined;
        if (shadowColor) setMeshOutline(mesh, shadowColor);
      }
    });
  }

  public setTeam(looks: KidLook[]): void {
    if (this.kids.length === 0 || looks.length === 0) return;
    for (let i = 0; i < this.kids.length; i++) {
      this.applyLookToKid(this.kids[i].root, looks[i % looks.length]);
    }
    this.renderFrame();
  }

  private startEmoteOn(
    index: number,
    emote: KidEmoteDef,
    opts?: { fade?: number; staggerOffset?: number; staticPreview?: boolean },
  ): void {
    const kid = this.kids[index];
    if (!kid) return;
    const clip = this.clipMap.get(emote.clip) ?? this.clipMap.get('Cheer') ?? this.clipMap.get('Idle');
    if (!clip) {
      kid.emote = emote;
      kid.emoteRemaining = emote.seconds;
      return;
    }

    const next = kid.mixer.clipAction(clip);
    const fade = opts?.fade ?? 0.25;
    next.enabled = true;
    next.reset();
    if (emote.loop) {
      next.setLoop(THREE.LoopRepeat, Infinity);
    } else {
      next.setLoop(THREE.LoopOnce, 1);
      next.clampWhenFinished = true;
    }
    next.setEffectiveWeight(1);

    if (fade > 0 && kid.currentAction && kid.currentAction !== next) {
      next.fadeIn(fade).play();
      kid.currentAction.fadeOut(fade);
    } else {
      if (kid.currentAction && kid.currentAction !== next) {
        kid.currentAction.stop();
      }
      next.play();
    }

    kid.currentAction = next;
    kid.emote = emote;

    const rawDuration = clip.duration || emote.seconds;
    const playDur = emote.loop ? emote.seconds : Math.max(1.2, rawDuration - 0.25);

    if (opts?.staticPreview) {
      next.time = rawDuration * emote.previewAt;
      kid.mixer.update(0);
      kid.emoteRemaining = Infinity;
    } else if (opts?.staggerOffset && opts.staggerOffset > 0) {
      const offset = Math.min(opts.staggerOffset, Math.max(0, playDur - 0.8));
      kid.mixer.update(offset);
      kid.emoteRemaining = Math.max(0.8, playDur - offset);
    } else {
      kid.emoteRemaining = playDur;
    }
  }

  public playTeamEmotes(initial = false): void {
    if (this.kids.length === 0) return;
    const prev = this.kids.every((k) => k.emote) ? this.kids.map((k) => k.emote!) : undefined;
    const nextEmotes = assignUniqueEmotes(this.kids.length, prev);
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    for (let i = 0; i < this.kids.length; i++) {
      this.startEmoteOn(i, nextEmotes[i], {
        fade: initial ? 0 : 0.25,
        staggerOffset: initial ? i * 0.28 : 0,
        staticPreview: reducedMotion,
      });
    }

    if (reducedMotion) {
      this.renderFrame();
    }
  }

  private wireTouchAndMouseDrag(): void {
    let pointerId: number | null = null;
    let startX = 0;
    let startY = 0;
    let intentDecided = false;

    this.canvas.addEventListener('pointerdown', (e) => {
      if (pointerId !== null) return;
      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      this.lastX = e.clientX;
      intentDecided = e.pointerType === 'mouse';
      this.isDragging = intentDecided;
    });

    this.canvas.addEventListener('pointermove', (e) => {
      if (e.pointerId !== pointerId) return;
      if (!intentDecided) {
        const dx = Math.abs(e.clientX - startX);
        const dy = Math.abs(e.clientY - startY);
        if (dx < 8 && dy < 8) return;
        if (dx > dy * 1.2) {
          intentDecided = true;
          this.isDragging = true;
          this.canvas.setPointerCapture(e.pointerId);
        } else {
          pointerId = null;
          this.isDragging = false;
          return;
        }
      }
      if (!this.isDragging) return;
      this.yaw = THREE.MathUtils.clamp(this.yaw + (e.clientX - this.lastX) * 0.008, -0.55, 0.55);
      this.lastX = e.clientX;
    });

    const release = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      pointerId = null;
      this.isDragging = false;
      intentDecided = false;
    };
    this.canvas.addEventListener('pointerup', release);
    this.canvas.addEventListener('pointercancel', release);
  }

  private resize(): void {
    const host = this.canvas.parentElement ?? this.canvas;
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (w <= 0 || h <= 0) return;

    const aspect = w / h;
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();

    const horizHalfFov = Math.atan(Math.tan(THREE.MathUtils.degToRad(34 * 0.5)) * aspect);
    const dist = Math.max(3.25, 2.18 / Math.max(0.15, Math.tan(horizHalfFov)));
    this.camera.position.set(0, 0.88 + (dist - 3.25) * 0.08, -dist);
    this.camera.lookAt(0, 0.62, 0.12);

    const bufH = Math.max(1, this.renderer.domElement.height);
    OUTLINE_SHARED.uViewportH.value = bufH;
    OUTLINE_SHARED.uWidthPx.value = Math.min(4.5, Math.max(1.25, (2.2 * bufH) / 1080));
    this.renderFrame();
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

  private renderFrame(): void {
    this.turntable.rotation.y = this.yaw;
    this.renderer.render(this.scene, this.camera);
  }

  private loop = (): void => {
    this.raf = 0;
    if (!this.isVisible || document.hidden || this.isDisposed) return;
    const dt = Math.min(0.05, this.clock.getDelta());
    for (const k of this.kids) k.mixer.update(dt);

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!reducedMotion) {
      for (let i = 0; i < this.kids.length; i++) {
        this.kids[i].emoteRemaining -= dt;
        if (this.kids[i].emoteRemaining <= 0) {
          const next = pickNextUniqueEmote(
            this.kids.map((item) => item.emote),
            i,
          );
          this.startEmoteOn(i, next, { fade: 0.25 });
        }
      }

      if (!this.isDragging) {
        this.elapsed += dt;
        this.yaw = THREE.MathUtils.lerp(this.yaw, Math.sin(this.elapsed * 0.45) * 0.06, Math.min(1, dt * 2.5));
      }
    }

    this.renderFrame();
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
