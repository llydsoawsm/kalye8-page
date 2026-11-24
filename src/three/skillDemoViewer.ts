import * as THREE from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { ROSTER_PRESETS, SKIN_PRESETS, shadowOf, tintColor, visibleParts, type KidLook } from './kidLook';
import { loadRealStreetWorld, OUTLINE_LAYER, type RealStreetWorld } from './paintedStreet';

const KID_RIM = 0.38;
const KID_SCALE = 1 / 0.73;
const HIP_HEIGHT = 0.35;
const FLAT_MATERIALS = /^MAT-(eye|blush|mouth|teeth|tongue)/;
const SUN_DIR = new THREE.Vector3(0.5, 0.85, -0.75).normalize();
const LOOP_SECONDS = 3.6;
const REDUCED_MOTION_T = 1.65;
const ARENA_ORIGIN = new THREE.Vector3(0, 0, 6);

const OUTLINE_SHARED = {
  uWidthPx: { value: 2.0 },
  uRefDist: { value: 16 },
  uViewportH: { value: 720 },
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

function demoToonMaterial(
  name: string,
  lit: string,
  shadow: string,
  opts: { rim?: number; glowColor?: string; glow?: number; transparent?: boolean; opacity?: number } = {},
): THREE.MeshToonMaterial {
  const rim = opts.rim ?? 0;
  const glow = opts.glow ?? 0;
  const glowColor = opts.glowColor ?? lit;
  const opacity = opts.transparent ? (opts.opacity ?? 1) : 1;
  const key = `${name}|${lit}|${shadow}|${rim}|${glowColor}|${glow}|${opts.transparent ? opacity : ''}`;
  const hit = toonCache.get(key);
  if (hit) return hit;

  const mat = new THREE.MeshToonMaterial({
    name,
    color: lit,
    side: THREE.DoubleSide,
    transparent: !!opts.transparent,
    opacity,
  });
  mat.toneMapped = false;
  if (opts.transparent) mat.depthWrite = false;

  const uLit = { value: new THREE.Color(lit) };
  const uShadow = { value: new THREE.Color(shadow) };
  const uRim = { value: rim };
  const uSun = { value: SUN_DIR };
  const uGlow = { value: glow };
  const uGlowCol = { value: new THREE.Color(glowColor) };

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uToonLit = uLit;
    shader.uniforms.uToonShadow = uShadow;
    shader.uniforms.uToonRim = uRim;
    shader.uniforms.uToonSun = uSun;
    shader.uniforms.uToonGlow = uGlow;
    shader.uniforms.uToonGlowCol = uGlowCol;

    shader.fragmentShader = shader.fragmentShader
      .replace(
        'void main() {',
        `uniform vec3 uToonLit;
uniform vec3 uToonShadow;
uniform float uToonRim;
uniform vec3 uToonSun;
uniform float uToonGlow;
uniform vec3 uToonGlowCol;
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
          outgoingLight = mix( toonCol, uToonGlowCol, uToonGlow );
        }
        #include <opaque_fragment>`,
      );
  };
  mat.customProgramCacheKey = () => `skill-demo-toon-${rim > 0 ? 'r' : 'f'}`;
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
    name: 'skill-demo-outline',
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
  mat.customProgramCacheKey = () => 'skill-demo-outline-v1';
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

interface KidRig {
  skinned: THREE.SkinnedMesh;
  bones: Map<string, THREE.Bone>;
}

function getKidRig(body: THREE.Object3D): KidRig | null {
  let skinned: THREE.SkinnedMesh | null = null;
  body.traverse((o) => {
    if (!skinned && (o as THREE.SkinnedMesh).isSkinnedMesh) skinned = o as THREE.SkinnedMesh;
  });
  if (!skinned) return null;
  const sk = (skinned as THREE.SkinnedMesh).skeleton;
  return { skinned, bones: new Map(sk.bones.map((b) => [b.name, b])) };
}

function bindPosition(rig: KidRig, name: string, target = new THREE.Vector3()): THREE.Vector3 {
  const i = rig.skinned.skeleton.bones.findIndex((b) => b.name === name);
  if (i < 0) return target.set(0, 0, 0);
  const m = rig.skinned.skeleton.boneInverses[i].clone().invert();
  return target.setFromMatrixPosition(m);
}

function bindQuaternion(rig: KidRig, name: string, target = new THREE.Quaternion()): THREE.Quaternion {
  const i = rig.skinned.skeleton.bones.findIndex((b) => b.name === name);
  if (i < 0) return target.identity();
  const m = rig.skinned.skeleton.boneInverses[i].clone().invert();
  return target.setFromRotationMatrix(m);
}

const _ikInv = new THREE.Matrix4();
const _ikMm = new THREE.Matrix4();
const _ikS = new THREE.Vector3();
const _ikA = new THREE.Vector3();
const _ikP = new THREE.Vector3();
const _ikE = new THREE.Vector3();
const _ikD1 = new THREE.Vector3();
const _ikD2 = new THREE.Vector3();
const _ikQa = new THREE.Quaternion();
const _ikQb = new THREE.Quaternion();
const _ikQc = new THREE.Quaternion();

function solveLimb(
  body: THREE.Object3D,
  rig: KidRig,
  names: { upper: string; lower: string; end: string },
  end: THREE.Vector3,
  pole: THREE.Vector3,
  weight: number,
): void {
  if (weight <= 0.001) return;
  const upper = rig.bones.get(names.upper);
  const fore = rig.bones.get(names.lower);
  if (!upper || !fore || !upper.parent) return;

  body.updateMatrixWorld(true);
  _ikInv.copy(body.matrixWorld).invert();

  const bindUpper = bindPosition(rig, names.upper, new THREE.Vector3());
  const bindElbow = bindPosition(rig, names.lower, new THREE.Vector3());
  const bindHand = bindPosition(rig, names.end, new THREE.Vector3());
  const l1 = bindElbow.distanceTo(bindUpper);
  const l2 = bindHand.distanceTo(bindElbow);

  _ikMm.multiplyMatrices(_ikInv, upper.matrixWorld);
  _ikS.setFromMatrixPosition(_ikMm);
  _ikA.copy(end).sub(_ikS);
  const dist = Math.min(Math.max(_ikA.length(), 0.02), l1 + l2 - 1e-4);
  _ikA.normalize();
  const x = (l1 * l1 - l2 * l2 + dist * dist) / (2 * dist);
  const h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
  _ikP.copy(pole).addScaledVector(_ikA, -pole.dot(_ikA));
  if (_ikP.lengthSq() < 1e-6) _ikP.set(0, -1, 0);
  _ikP.normalize();
  _ikE.copy(_ikS).addScaledVector(_ikA, x).addScaledVector(_ikP, h);

  _ikD1.copy(bindElbow).sub(bindUpper).normalize();
  _ikD2.copy(_ikE).sub(_ikS).normalize();
  _ikQa.setFromUnitVectors(_ikD1, _ikD2).multiply(bindQuaternion(rig, names.upper, _ikQc));
  _ikMm.multiplyMatrices(_ikInv, upper.parent.matrixWorld);
  _ikQb.setFromRotationMatrix(_ikMm);
  const upperLocal = _ikQb.clone().invert().multiply(_ikQa);
  upper.quaternion.slerp(upperLocal, weight);

  const upperWorld = _ikQb.clone().multiply(upper.quaternion);
  const handPoint = _ikS.clone().addScaledVector(_ikA, dist);
  _ikD1.copy(bindHand).sub(bindElbow).normalize();
  _ikD2.copy(handPoint).sub(_ikE).normalize();
  _ikQa.setFromUnitVectors(_ikD1, _ikD2).multiply(bindQuaternion(rig, names.lower, _ikQc));
  const foreLocal = upperWorld.clone().invert().multiply(_ikQa);
  fore.quaternion.slerp(foreLocal, weight);
  upper.updateMatrixWorld(true);
}

function solveArm(body: THREE.Object3D, rig: KidRig, side: 'L' | 'R', hand: THREE.Vector3, pole: THREE.Vector3, weight: number): void {
  solveLimb(body, rig, { upper: `upper_arm_${side}`, lower: `forearm_${side}`, end: `hand_${side}` }, hand, pole, weight);
}

function solveLeg(body: THREE.Object3D, rig: KidRig, side: 'L' | 'R', foot: THREE.Vector3, pole: THREE.Vector3, weight: number): void {
  solveLimb(body, rig, { upper: `thigh_${side}`, lower: `shin_${side}`, end: `foot_${side}` }, foot, pole, weight);
}

function attachToBone(rig: KidRig, boneName: string, obj: THREE.Object3D): boolean {
  const bone = rig.bones.get(boneName);
  const i = rig.skinned.skeleton.bones.findIndex((b) => b.name === boneName);
  if (!bone || i < 0) return false;
  obj.updateMatrix();
  const local = new THREE.Matrix4().multiplyMatrices(rig.skinned.skeleton.boneInverses[i], obj.matrix);
  local.decompose(obj.position, obj.quaternion, obj.scale);
  bone.add(obj);
  return true;
}

function buildPacmanPropsOnKid(body: THREE.Object3D): THREE.Object3D[] {
  const rig = getKidRig(body);
  if (!rig) return [];

  const parts: THREE.Object3D[] = [];
  const makeMesh = (geo: THREE.BufferGeometry, hex: string): THREE.Mesh => {
    const m = new THREE.Mesh(geo, demoToonMaterial(`pacman-${hex.slice(1)}`, hex, shadowOf(hex)));
    m.userData.isPacmanProp = true;
    setMeshOutline(m, new THREE.Color(shadowOf(hex)));
    return m;
  };
  const add = (bone: string, obj: THREE.Object3D) => {
    obj.visible = false;
    if (attachToBone(rig, bone, obj)) parts.push(obj);
  };

  const RED = '#dc2626';
  const GOLD = '#fbbf24';
  const WHITE = '#f8fafc';
  const DARK = '#14161a';

  for (const side of ['L', 'R'] as const) {
    const sx = side === 'L' ? -1 : 1;
    const hand = bindPosition(rig, `hand_${side}`);
    const elbow = bindPosition(rig, `forearm_${side}`);

    const glove = makeMesh(new THREE.SphereGeometry(0.092, 16, 12), RED);
    glove.position.copy(hand);
    glove.scale.set(1, 1.08, 1);
    add(`hand_${side}`, glove);

    const toElbow = elbow.clone().sub(hand).normalize();
    const cuff = makeMesh(new THREE.CylinderGeometry(0.058, 0.066, 0.06, 14), WHITE);
    cuff.position.copy(hand).addScaledVector(toElbow, 0.08);
    cuff.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), toElbow);
    add(`hand_${side}`, cuff);

    const thumb = makeMesh(new THREE.SphereGeometry(0.04, 10, 8), RED);
    thumb.position.copy(hand).add(new THREE.Vector3(-sx * 0.045, 0.02, -0.07));
    add(`hand_${side}`, thumb);
  }

  const hips = bindPosition(rig, 'hips');
  const belt = makeMesh(new THREE.CylinderGeometry(0.152, 0.156, 0.052, 24), RED);
  belt.position.set(0, hips.y + 0.04, 0);
  add('hips', belt);

  const plate = makeMesh(new THREE.BoxGeometry(0.09, 0.05, 0.02), GOLD);
  plate.position.set(0, hips.y + 0.04, -0.158);
  add('hips', plate);

  const chest = bindPosition(rig, 'chest');
  const chain = makeMesh(new THREE.TorusGeometry(0.1, 0.011, 8, 28), GOLD);
  chain.rotation.x = Math.PI / 2 + 0.35;
  chain.position.set(0, chest.y + 0.085, -0.03);
  add('chest', chain);

  const pendant = makeMesh(new THREE.ConeGeometry(0.022, 0.07, 6), GOLD);
  pendant.rotation.x = Math.PI;
  pendant.position.set(0, chest.y + 0.01, -0.118);
  add('chest', pendant);

  const head = bindPosition(rig, 'head');
  for (const sx of [-1, 1]) {
    const mo = makeMesh(new THREE.SphereGeometry(0.03, 10, 8), DARK);
    mo.scale.set(1.25, 0.55, 0.7);
    mo.position.set(sx * 0.032, head.y + 0.155, -0.172);
    add('head', mo);
  }
  const goatee = makeMesh(new THREE.SphereGeometry(0.03, 10, 8), DARK);
  goatee.scale.set(1.1, 1.3, 0.6);
  goatee.position.set(0, head.y + 0.03, -0.152);
  add('head', goatee);

  return parts;
}

const PROP_GLOW: Record<string, string> = {
  MAT_stun_star: '#fde047',
  MAT_stun_swirl: '#fde047',
};

function toonifyProp(root: THREE.Object3D, strapOverride?: string): void {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || o.userData.isOutline === true) return;
    const src = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const out = src.map((m) => {
      const ud = (m.userData.kidSrc ?? m.userData) as Record<string, unknown>;
      const fallback = `#${((m as THREE.MeshStandardMaterial).color ?? new THREE.Color('#ffffff')).getHexString()}`;
      const lit =
        m.name === 'MAT_tsinelas_strap' && strapOverride
          ? strapOverride
          : typeof ud.lit === 'string'
            ? ud.lit
            : fallback;
      const shadow =
        m.name === 'MAT_tsinelas_strap' && strapOverride
          ? shadowOf(strapOverride)
          : typeof ud.shadow === 'string'
            ? ud.shadow
            : shadowOf(lit);
      const glowColor = PROP_GLOW[m.name];
      return demoToonMaterial(m.name, lit, shadow, {
        glowColor,
        glow: glowColor ? 0.65 : 0,
        transparent: m.transparent,
        opacity: m.opacity,
      });
    });
    mesh.material = Array.isArray(mesh.material) ? out : out[0];
    if (!out[0].transparent) {
      const s = out[0].userData.toonShadow as THREE.Color | undefined;
      if (s) setMeshOutline(mesh, s);
    }
  });
}

function easeOutBack(t: number): number {
  const k = Math.min(1, Math.max(0, t));
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp01(t);
}

function boxerLook(base: KidLook): KidLook {
  const skinHex = SKIN_PRESETS.find((s) => s.id === base.skin)?.hex ?? '#B8713F';
  return {
    ...base,
    face: 'determined',
    hair: 'spiky',
    cap: 'none',
    top: 'sando',
    topColor: skinHex,
    bottom: 'ballers',
    bottomColor: '#1d4ed8',
    shoes: 'sneakers',
    shoeColor: '#dc2626',
    hairColor: '#14161a',
  };
}

interface Actor {
  wrapper: THREE.Group;
  body: THREE.Group;
  rig: KidRig | null;
  mixer: THREE.AnimationMixer;
  actions: Map<string, THREE.AnimationAction>;
  currentClip: string;
}

interface SmokePuff {
  mesh: THREE.Mesh;
  x: number;
  y: number;
  z: number;
  r: number;
  delay: number;
  phase: number;
}

const CASTER_LOOK = ROSTER_PRESETS[0].look;
const ENEMY_LOOK = ROSTER_PRESETS[5].look;
const ALLY_LOOK = ROSTER_PRESETS[1].look;

export class SkillDemoViewer {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(34, 1, 0.1, 450);
  private arena = new THREE.Group();
  private world?: RealStreetWorld;
  private clock = new THREE.Clock();
  private loopTime = 0;
  private raf = 0;
  private isVisible = true;
  private isDisposed = false;
  private loaded = false;
  private currentSkillId: string;
  private activeTargetMode: 'enemy' | 'ally' = 'enemy';
  private activeCasterMode: 'normal' | 'boxer' = 'normal';

  private caster?: Actor;
  private target?: Actor;
  private nanay?: Actor;
  private pacmanParts: THREE.Object3D[] = [];

  private bananaProp = new THREE.Group();
  private tsinelasProp = new THREE.Group();
  private enemyTsinelasProp = new THREE.Group();
  private tahoProp = new THREE.Group();
  private tahoScoop: THREE.Object3D | null = null;
  private nunoProp = new THREE.Group();
  private nunoBolt = new THREE.Group();
  private palamigBag = new THREE.Group();
  private palamigRing = new THREE.Group();
  private stiltL = new THREE.Group();
  private stiltR = new THREE.Group();
  private pacmanAura = new THREE.Group();
  private statusStunned = new THREE.Group();
  private statusTaunt = new THREE.Group();
  private statusCurseOrbs = new THREE.Group();
  private statusCurseRing = new THREE.Group();
  private smokeGroup = new THREE.Group();
  private smokePuffs: SmokePuff[] = [];
  private palamigSparkles: THREE.Mesh[] = [];

  private resizeObserver: ResizeObserver;
  private visObserver: IntersectionObserver;

  constructor(
    private canvas: HTMLCanvasElement,
    initialSkillId: string,
    private onReady?: () => void,
  ) {
    this.currentSkillId = initialSkillId;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setPixelRatio(Math.min(1.75, window.devicePixelRatio || 1));

    this.camera.layers.enable(OUTLINE_LAYER);
    this.arena.position.copy(ARENA_ORIGIN);
    this.scene.add(this.arena);

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

    this.resize();
    void this.loadAssets();
  }

  private createActor(sceneObj: THREE.Object3D, animations: THREE.AnimationClip[]): Actor {
    const wrapper = new THREE.Group();
    const body = SkeletonUtils.clone(sceneObj) as THREE.Group;
    shareSkeleton(body);
    wrapper.add(body);
    this.arena.add(wrapper);

    const mixer = new THREE.AnimationMixer(body);
    const actions = new Map<string, THREE.AnimationAction>();
    for (const clip of animations) {
      const act = mixer.clipAction(clip);
      if (
        clip.name === 'Throw' ||
        clip.name === 'Tumble' ||
        clip.name === 'Slip' ||
        clip.name === 'Lunge' ||
        clip.name === 'HangerStrike' ||
        clip.name === 'Tag'
      ) {
        act.setLoop(THREE.LoopOnce, 1);
        act.clampWhenFinished = true;
      } else {
        act.setLoop(THREE.LoopRepeat, Infinity);
      }
      actions.set(clip.name, act);
    }

    const idle = actions.get('Idle') ?? actions.get('NanayMarch');
    idle?.play();
    return {
      wrapper,
      body,
      rig: getKidRig(body),
      mixer,
      actions,
      currentClip: idle ? idle.getClip().name : '',
    };
  }

  private playClip(actor: Actor | undefined, name: string, timeScale = 1, forceReset = false): void {
    if (!actor) return;
    const resolved = actor.actions.has(name) ? name : actor.actions.has('Idle') ? 'Idle' : actor.currentClip;
    if (!resolved) return;
    if (actor.currentClip === resolved && !forceReset) {
      const act = actor.actions.get(resolved);
      if (act) act.timeScale = timeScale;
      return;
    }
    const prev = actor.actions.get(actor.currentClip);
    const next = actor.actions.get(resolved);
    if (!next) return;
    prev?.fadeOut(0.12);
    next.reset();
    next.timeScale = timeScale;
    next.fadeIn(0.12).play();
    actor.currentClip = resolved;
  }

  private applyKidLook(kidRoot: THREE.Object3D, look: KidLook): void {
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
      if (!mesh.isMesh || o.userData.isOutline === true || o.userData.isPacmanProp === true) return;

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
        return demoToonMaterial(m.name, lit, shadow, { rim });
      });

      mesh.material = Array.isArray(mesh.material) ? out : out[0];
      if (inked) {
        const shadowColor = out[0].userData.toonShadow as THREE.Color | undefined;
        if (shadowColor) setMeshOutline(mesh, shadowColor);
      }
    });
  }

  private cloneProp(pack: THREE.Group, name: string, scale = 1, strapOverride?: string): THREE.Group {
    const src = pack.getObjectByName(name);
    const group = src ? (src.clone(true) as THREE.Group) : new THREE.Group();
    if (scale !== 1) group.scale.setScalar(scale);
    toonifyProp(group, strapOverride);
    return group;
  }

  private buildNunoBolt(): THREE.Group {
    const group = new THREE.Group();
    const outerMat = demoToonMaterial('MAT_nuno_beam', '#c084fc', '#7e22ce', { glowColor: '#e9d5ff', glow: 0.75 });
    const coreMat = demoToonMaterial('MAT_nuno_beam_core', '#ffffff', '#e9d5ff', { glowColor: '#ffffff', glow: 1 });
    for (let k = 0; k < 8; k++) {
      const seg = new THREE.Group();
      const outerGeo = new THREE.CylinderGeometry(0.032, 0.032, 1, 8, 1, false);
      outerGeo.rotateX(Math.PI / 2);
      const outer = new THREE.Mesh(outerGeo, outerMat);
      const coreGeo = new THREE.CylinderGeometry(0.012, 0.012, 1, 8, 1, false);
      coreGeo.rotateX(Math.PI / 2);
      const core = new THREE.Mesh(coreGeo, coreMat);
      seg.add(outer, core);
      group.add(seg);
    }
    return group;
  }

  private aimNunoBolt(from: THREE.Vector3, to: THREE.Vector3, time: number): void {
    const step = Math.floor(time * 12);
    const n = new THREE.Vector3(-(to.z - from.z), 0, to.x - from.x).normalize();
    const pts: THREE.Vector3[] = [];
    const segs = 8;
    const noise = (k: number) => {
      const x = Math.sin(step * 12.9898 + k * 78.233) * 43758.5453;
      return (x - Math.floor(x)) * 2 - 1;
    };
    for (let k = 0; k <= segs; k++) {
      const p = from.clone().lerp(to, k / segs);
      if (k > 0 && k < segs) {
        p.addScaledVector(n, (k % 2 === 0 ? 1 : -1) * (0.08 + 0.08 * Math.abs(noise(k))));
        p.y += noise(k + 30) * 0.07;
      }
      pts.push(p);
    }
    const crackle = step % 6 === 0 ? 0.6 : 1;
    const zAxis = new THREE.Vector3(0, 0, 1);
    const dir = new THREE.Vector3();
    for (let k = 0; k < segs; k++) {
      const seg = this.nunoBolt.children[k];
      const a = pts[k];
      const b = pts[k + 1];
      const len = Math.max(0.001, a.distanceTo(b));
      seg.position.copy(a).add(b).multiplyScalar(0.5);
      dir.subVectors(b, a).divideScalar(len);
      seg.quaternion.setFromUnitVectors(zAxis, dir);
      seg.scale.set(crackle, crackle, len);
    }
  }

  private buildSmokeCloud(): void {
    const tones = [
      { lit: '#a3e635', shadow: '#65a30d' },
      { lit: '#d9f99d', shadow: '#a3e635' },
      { lit: '#84cc16', shadow: '#4d7c0f' },
    ];
    const sphere = new THREE.SphereGeometry(1, 14, 10);
    for (let i = 0; i < 22; i++) {
      const tone = tones[i % tones.length];
      const mat = demoToonMaterial(`smoke_${i % 3}`, tone.lit, tone.shadow, {
        transparent: true,
        opacity: 0.72,
      });
      const mesh = new THREE.Mesh(sphere, mat);
      const angle = (i / 22) * Math.PI * 2 + (i % 3) * 0.4;
      const dist = i < 4 ? 0.28 * i : 0.6 + (i % 5) * 0.28;
      const r = i < 4 ? 0.62 : 0.34 + (i % 4) * 0.11;
      const y = i < 4 ? 0.85 : r + ((i * 3) % 5) * 0.19;
      this.smokeGroup.add(mesh);
      this.smokePuffs.push({
        mesh,
        x: Math.cos(angle) * dist,
        y,
        z: Math.sin(angle) * dist * 0.8,
        r,
        delay: 0.03 * i,
        phase: i * 0.9,
      });
    }
  }

  private buildPalamigSparkles(): void {
    const mat = demoToonMaterial('palamig_spark', '#fde047', '#f59e0b', { glowColor: '#fef08a', glow: 0.9 });
    const geo = new THREE.OctahedronGeometry(0.065, 0);
    for (let i = 0; i < 10; i++) {
      const m = new THREE.Mesh(geo, mat);
      this.arena.add(m);
      this.palamigSparkles.push(m);
    }
  }

  private async loadAssets(): Promise<void> {
    const draco = new DRACOLoader();
    draco.setDecoderPath('draco/');
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);

    try {
      const [world, kidGltf, skillsGltf, nanayGltf] = await Promise.all([
        loadRealStreetWorld(this.renderer, this.scene, {
          camPos: this.camera.position.clone(),
          withShadows: false,
          withClouds: false,
          programKeyPrefix: 'skill-street',
          isDisposed: () => this.isDisposed,
        }),
        loader.loadAsync('models/kid.glb'),
        loader.loadAsync('models/kalye_skills.glb'),
        loader.loadAsync('models/nanay_rig.glb'),
      ]);
      if (this.isDisposed) return;

      this.world = world;
      this.world.updateViewport(Math.max(1, this.renderer.domElement.height));

      const propsToRemove: THREE.Object3D[] = [];
      kidGltf.scene.traverse((o) => {
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

      this.caster = this.createActor(kidGltf.scene, kidGltf.animations);
      this.target = this.createActor(kidGltf.scene, kidGltf.animations);
      this.caster.body.scale.setScalar(KID_SCALE);
      this.target.body.scale.setScalar(KID_SCALE);
      this.pacmanParts = buildPacmanPropsOnKid(this.caster.body);
      this.applyKidLook(this.caster.body, CASTER_LOOK);
      this.applyKidLook(this.target.body, ENEMY_LOOK);

      toonifyProp(nanayGltf.scene);
      this.nanay = this.createActor(nanayGltf.scene, nanayGltf.animations);

      const pack = skillsGltf.scene;
      this.bananaProp = this.cloneProp(pack, 'banana_peel', 1.15);
      this.tsinelasProp = this.cloneProp(pack, 'tsinelas_prop', 1.6, '#2563eb');
      this.enemyTsinelasProp = this.cloneProp(pack, 'tsinelas_prop', 1.6, '#dc2626');
      this.tahoProp = this.cloneProp(pack, 'taho_vendor', 1.45);
      this.tahoScoop = this.tahoProp.getObjectByName('taho_scoop') ?? null;
      this.nunoProp = this.cloneProp(pack, 'nuno_dwarf', 1.2);
      this.nunoBolt = this.buildNunoBolt();
      this.palamigBag = this.cloneProp(pack, 'palamig_bag', 0.75);
      this.palamigRing = this.cloneProp(pack, 'palamig_ring', 2.0);
      this.stiltL = this.cloneProp(pack, 'kadang_stilt', 1.0);
      this.stiltR = this.cloneProp(pack, 'kadang_stilt', 1.0);
      this.pacmanAura = this.cloneProp(pack, 'pacman_aura', 1.15);
      this.statusStunned = this.cloneProp(pack, 'status_stunned', 1.0);
      this.statusTaunt = this.cloneProp(pack, 'status_taunt', 1.35);
      this.statusCurseOrbs = this.cloneProp(pack, 'status_curse', 1.2);
      this.statusCurseRing = this.cloneProp(pack, 'status_curse_ring', 0.72);
      this.buildSmokeCloud();
      this.buildPalamigSparkles();

      this.arena.add(
        this.bananaProp,
        this.tsinelasProp,
        this.enemyTsinelasProp,
        this.tahoProp,
        this.nunoProp,
        this.nunoBolt,
        this.palamigBag,
        this.palamigRing,
        this.pacmanAura,
        this.statusStunned,
        this.statusTaunt,
        this.statusCurseOrbs,
        this.statusCurseRing,
        this.smokeGroup,
      );
      this.caster.wrapper.add(this.stiltL, this.stiltR);

      this.loaded = true;
      this.setSkill(this.currentSkillId);
      this.onReady?.();
      if (this.isVisible && !document.hidden) this.startLoop();
    } finally {
      draco.dispose();
    }
  }

  private hideAllProps(): void {
    const all: THREE.Object3D[] = [
      this.bananaProp,
      this.tsinelasProp,
      this.enemyTsinelasProp,
      this.tahoProp,
      this.nunoProp,
      this.nunoBolt,
      this.palamigBag,
      this.palamigRing,
      this.stiltL,
      this.stiltR,
      this.pacmanAura,
      this.statusStunned,
      this.statusTaunt,
      this.statusCurseOrbs,
      this.statusCurseRing,
      this.smokeGroup,
      ...this.palamigSparkles,
    ];
    for (const o of all) o.visible = false;
  }

  public setSkill(skillId: string): void {
    this.currentSkillId = skillId;
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    this.loopTime = reducedMotion ? REDUCED_MOTION_T : 0;
    if (!this.loaded) return;

    const wantTarget: 'enemy' | 'ally' =
      skillId === 'palamig_plastik' || skillId === 'utot_higante' ? 'ally' : 'enemy';
    if (this.target && wantTarget !== this.activeTargetMode) {
      this.activeTargetMode = wantTarget;
      this.applyKidLook(this.target.body, wantTarget === 'ally' ? ALLY_LOOK : ENEMY_LOOK);
    }

    const isBoxer = skillId === 'pacman_kamao';
    const wantCaster: 'normal' | 'boxer' = isBoxer ? 'boxer' : 'normal';
    if (this.caster && wantCaster !== this.activeCasterMode) {
      this.activeCasterMode = wantCaster;
      this.applyKidLook(this.caster.body, isBoxer ? boxerLook(CASTER_LOOK) : CASTER_LOOK);
    }
    for (const p of this.pacmanParts) p.visible = isBoxer;

    this.evaluateAt(this.loopTime, 0, true);
    this.renderer.render(this.scene, this.camera);
  }

  public replay(): void {
    this.loopTime = 0;
    if (this.loaded) {
      this.evaluateAt(0, 0, true);
      this.renderer.render(this.scene, this.camera);
    }
  }

  private evaluateAt(t: number, dt: number, forceClipReset = false): void {
    if (!this.loaded || !this.caster || !this.target || !this.nanay) return;
    this.hideAllProps();

    const c = this.caster;
    const trg = this.target;
    const nny = this.nanay;

    c.wrapper.visible = true;
    c.wrapper.position.set(0, 0, 0);
    c.wrapper.rotation.set(0, 0, 0);
    c.body.position.set(0, 0, 0);
    c.body.rotation.set(0, 0, 0);

    trg.wrapper.visible = true;
    trg.wrapper.position.set(0, 0, 0);
    trg.wrapper.rotation.set(0, 0, 0);
    trg.body.position.set(0, 0, 0);
    trg.body.rotation.set(0, 0, 0);

    nny.wrapper.visible = false;
    nny.wrapper.position.set(0, 0, 0);
    nny.wrapper.rotation.set(0, 0, 0);

    let kadangPose: { blend: number; lift: number; phase: number; swingL: number; swingR: number } | null = null;

    switch (this.currentSkillId) {
      case 'nanay_hanger': {
        c.wrapper.position.set(-1.85, 0, 0.1);
        c.wrapper.rotation.y = -Math.PI / 2;
        this.playClip(c, t < 0.5 ? 'Throw' : 'Idle', 1, forceClipReset);

        nny.wrapper.visible = true;
        const marchT = clamp01((t - 0.15) / 1.45);
        const nx = lerp(-1.25, 0.72, marchT);
        nny.wrapper.position.set(nx, 0, 0);
        nny.wrapper.rotation.y = -Math.PI / 2;
        nny.wrapper.scale.setScalar(0.88 * easeOutBack(clamp01(t / 0.22)));
        this.playClip(nny, t > 1.55 && t < 2.25 ? 'HangerStrike' : 'NanayMarch', 1.15, forceClipReset);

        trg.wrapper.position.set(1.55, 0, 0);
        trg.wrapper.rotation.y = Math.PI / 2;
        if (t >= 1.75) {
          this.playClip(trg, 'Stunned', 1, forceClipReset);
          this.statusStunned.visible = true;
          this.statusStunned.position.set(1.55, 2.0, 0);
          this.statusStunned.rotation.y = t * 5.0;
        } else {
          this.playClip(trg, 'Idle', 1, forceClipReset);
        }
        break;
      }

      case 'balat_saging': {
        c.wrapper.position.set(-1.85, 0, 0.15);
        c.wrapper.rotation.y = -Math.PI / 2;
        this.playClip(c, t < 0.55 ? 'Throw' : 'Idle', 1, forceClipReset);

        this.bananaProp.visible = t >= 0.2;
        if (t < 1.1) {
          const arcT = clamp01((t - 0.2) / 0.9);
          const bx = lerp(-1.45, 0.2, arcT);
          const by = 0.95 * (1 - arcT) + 0.05 * arcT + Math.sin(arcT * Math.PI) * 1.15;
          this.bananaProp.position.set(bx, by, 0);
          this.bananaProp.rotation.set(arcT * 6, arcT * 4, 0);
        } else {
          this.bananaProp.position.set(0.2, 0.04, 0);
          this.bananaProp.rotation.set(0, 0.4, 0);
        }

        trg.wrapper.rotation.y = Math.PI / 2;
        if (t < 1.8) {
          const runT = clamp01((t - 0.75) / 1.05);
          trg.wrapper.position.set(lerp(1.9, 0.25, runT), 0, 0);
          this.playClip(trg, t >= 0.75 ? 'Run' : 'Idle', 1, forceClipReset);
        } else if (t < 2.45) {
          trg.wrapper.position.set(lerp(0.25, -0.1, clamp01((t - 1.8) / 0.65)), 0, 0);
          this.playClip(trg, 'Slip', 1, forceClipReset);
        } else {
          trg.wrapper.position.set(-0.1, 0, 0);
          this.playClip(trg, 'Stunned', 1, forceClipReset);
          this.statusStunned.visible = true;
          this.statusStunned.position.set(-0.1, 2.0, 0);
          this.statusStunned.rotation.y = t * 5.0;
        }
        break;
      }

      case 'tapon_tsinelas': {
        c.wrapper.position.set(-1.85, 0, 0);
        c.wrapper.rotation.y = -Math.PI / 2;
        this.playClip(c, t < 0.55 ? 'Throw' : 'Idle', 1, forceClipReset);

        this.tsinelasProp.visible = t >= 0.22;
        if (t < 1.2) {
          const arcT = clamp01((t - 0.22) / 0.98);
          this.tsinelasProp.position.set(
            lerp(-1.45, 1.4, arcT),
            0.95 * (1 - arcT) + 1.05 * arcT + Math.sin(arcT * Math.PI) * 1.1,
            0,
          );
          this.tsinelasProp.rotation.set(t * 10, 0, t * 4);
        } else {
          const dropT = clamp01((t - 1.2) / 0.35);
          this.tsinelasProp.position.set(1.15, lerp(1.05, 0.05, dropT), 0.35 * dropT);
          this.tsinelasProp.rotation.set(0, 0.8, 0);
        }

        trg.wrapper.rotation.y = Math.PI / 2;
        if (t < 1.2) {
          trg.wrapper.position.set(1.55, 0, 0);
          this.playClip(trg, 'Idle', 1, forceClipReset);
        } else if (t < 2.25) {
          trg.wrapper.position.set(1.55, 0, 0);
          this.playClip(trg, 'Stunned', 1, forceClipReset);
          this.statusStunned.visible = true;
          this.statusStunned.position.set(1.55, 2.0, 0);
          this.statusStunned.rotation.y = t * 5.0;
        } else {
          const limpT = clamp01((t - 2.25) / 1.25);
          trg.wrapper.position.set(lerp(1.55, 0.55, limpT), 0, 0);
          this.playClip(trg, 'Limp', 1, forceClipReset);
        }
        break;
      }

      case 'tumbling_kalye': {
        trg.wrapper.rotation.y = Math.PI / 2;
        if (t < 0.9) {
          trg.wrapper.position.set(0.2, 0, 0);
          this.playClip(trg, 'Idle', 1, forceClipReset);
        } else if (t < 1.45) {
          const lt = clamp01((t - 0.9) / 0.55);
          trg.wrapper.position.set(lerp(0.2, -0.45, lt), 0, 0);
          this.playClip(trg, 'Lunge', 1, forceClipReset);
        } else {
          trg.wrapper.position.set(-0.45, 0, 0);
          this.playClip(trg, 'WhiffStun', 1, forceClipReset);
          this.statusStunned.visible = true;
          this.statusStunned.position.set(-0.45, 2.0, 0);
          this.statusStunned.rotation.y = t * 5.0;
        }

        c.wrapper.rotation.y = -Math.PI / 2;
        if (t < 0.75) {
          c.wrapper.position.set(lerp(-1.95, -0.95, clamp01(t / 0.75)), 0, 0);
          this.playClip(c, 'Run', 1, forceClipReset);
        } else if (t < 1.55) {
          const rt = clamp01((t - 0.75) / 0.8);
          c.wrapper.position.set(lerp(-0.95, 0.85, rt), Math.sin(rt * Math.PI) * 0.28, 0);
          this.playClip(c, 'Tumble', 1.1, forceClipReset);
        } else {
          c.wrapper.position.set(lerp(0.85, 1.95, clamp01((t - 1.55) / 1.1)), 0, 0);
          this.playClip(c, t < 2.65 ? 'Run' : 'Cheer', 1, forceClipReset);
        }
        break;
      }

      case 'mamang_taho': {
        c.wrapper.position.set(-1.85, 0, 0);
        c.wrapper.rotation.y = -Math.PI / 2;
        this.playClip(c, t < 0.5 ? 'Throw' : 'Idle', 1, forceClipReset);

        this.tahoProp.visible = t >= 0.25;
        if (t < 0.9) {
          const arcT = clamp01((t - 0.25) / 0.65);
          this.tahoProp.position.set(lerp(-1.45, -0.35, arcT), Math.sin(arcT * Math.PI) * 0.9, 0);
          this.tahoProp.scale.setScalar(1.45 * clamp01(arcT * 2));
        } else {
          this.tahoProp.position.set(-0.35, 0, 0);
          this.tahoProp.rotation.y = -Math.PI / 3;
          this.tahoProp.scale.setScalar(1.45 * easeOutBack(clamp01((t - 0.9) / 0.2)));
          if (this.tahoScoop) {
            this.tahoScoop.rotation.set(Math.sin(t * 7) * 0.16, Math.cos(t * 3.5) * 0.22, Math.cos(t * 7) * 0.16);
          }
        }

        trg.wrapper.rotation.y = Math.PI / 2;
        if (t < 1.1) {
          trg.wrapper.position.set(1.85, 0, 0);
          this.playClip(trg, 'Idle', 1, forceClipReset);
        } else {
          const lureT = clamp01((t - 1.1) / 1.9);
          const tx = lerp(1.85, 0.55, lureT);
          trg.wrapper.position.set(tx, 0, 0);
          this.playClip(trg, lureT < 1 ? 'PanicRun' : 'Idle', 1, forceClipReset);
          this.statusTaunt.visible = true;
          this.statusTaunt.position.set(tx, 2.1 + Math.sin(t * 5) * 0.06, 0);
          this.statusTaunt.rotation.y = t * 2.5;
        }
        break;
      }

      case 'nuno_sa_punso': {
        c.wrapper.position.set(-1.85, 0, 0);
        c.wrapper.rotation.y = -Math.PI / 2;
        this.playClip(c, t < 0.5 ? 'Throw' : 'Idle', 1, forceClipReset);

        this.nunoProp.visible = t >= 0.25;
        if (t < 0.9) {
          const arcT = clamp01((t - 0.25) / 0.65);
          this.nunoProp.position.set(lerp(-1.45, -0.35, arcT), Math.sin(arcT * Math.PI) * 0.9, 0);
          this.nunoProp.scale.setScalar(1.2 * clamp01(arcT * 2));
        } else {
          this.nunoProp.position.set(-0.35, 0, 0);
          this.nunoProp.rotation.y = -Math.PI / 2;
          this.nunoProp.scale.setScalar(1.2 * easeOutBack(clamp01((t - 0.9) / 0.2)));
        }

        const tx = t < 1.0 ? 1.65 : lerp(1.65, 1.0, clamp01((t - 1.0) / 2.2));
        trg.wrapper.position.set(tx, 0, 0);
        trg.wrapper.rotation.y = Math.PI / 2;
        this.playClip(trg, t >= 1.0 ? 'Walk' : 'Idle', 0.55, forceClipReset);

        if (t >= 1.0) {
          this.nunoBolt.visible = true;
          this.aimNunoBolt(new THREE.Vector3(-0.2, 0.72, 0), new THREE.Vector3(tx, 1.05, 0), t);
          this.statusCurseOrbs.visible = true;
          this.statusCurseOrbs.position.set(tx, 2.0, 0);
          this.statusCurseOrbs.rotation.y = t * 4.5;
          this.statusCurseRing.visible = true;
          this.statusCurseRing.position.set(tx, 0.02, 0);
          this.statusCurseRing.rotation.y = -t * 1.8;
        }
        break;
      }

      case 'palamig_plastik': {
        c.wrapper.position.set(-0.65, 0, 0.15);
        c.wrapper.rotation.y = -0.35;
        this.playClip(c, 'Idle', 1, forceClipReset);

        this.palamigBag.visible = true;
        this.palamigBag.position.set(-0.48, 1.12 + Math.sin(t * 4) * 0.04, 0.36);
        this.palamigBag.rotation.set(0.1, -0.35, Math.sin(t * 4) * 0.1);

        this.palamigRing.visible = true;
        const pop = easeOutBack(clamp01(t / 0.35));
        this.palamigRing.position.set(-0.65, 0.02, 0.15);
        this.palamigRing.scale.setScalar(2.0 * pop * (1 + Math.sin(t * 3) * 0.03));
        this.palamigRing.rotation.y = t * 0.9;

        trg.wrapper.position.set(0.75, 0, -0.1);
        trg.wrapper.rotation.y = 0.4;
        this.playClip(trg, t > 0.6 ? 'Cheer' : 'Idle', 1, forceClipReset);

        for (let i = 0; i < this.palamigSparkles.length; i++) {
          const sp = this.palamigSparkles[i];
          sp.visible = true;
          const cyc = (t * 0.8 + i * 0.17) % 1;
          const ang = i * 1.1 + t * 1.6;
          sp.position.set(
            (i % 2 === 0 ? -0.65 : 0.75) + Math.cos(ang) * 0.42,
            0.25 + cyc * 1.65,
            (i % 2 === 0 ? 0.15 : -0.1) + Math.sin(ang) * 0.42,
          );
          sp.scale.setScalar(Math.sin(cyc * Math.PI));
        }
        break;
      }

      case 'kadang_race': {
        const blend = clamp01(t / 0.25);
        const lift = 0.5 * blend;
        const phase = t * 9.0;
        const cx = lerp(-1.85, 1.85, clamp01(t / 3.1));
        c.wrapper.position.set(cx, 0, 0.12);
        c.wrapper.rotation.y = -Math.PI / 2;
        this.playClip(c, 'Walk', 1.35, forceClipReset);

        const lean = -0.07 * blend;
        const wobble = Math.sin(t * 11) * 0.012 * blend;
        c.body.rotation.set(lean, 0, wobble);
        c.body.position.set(0, lift + HIP_HEIGHT * (1 - Math.cos(lean)), -HIP_HEIGHT * Math.sin(lean));

        const swingL = Math.max(0, Math.cos(phase)) * 0.16 * blend;
        const swingR = Math.max(0, -Math.cos(phase)) * 0.16 * blend;
        const zL = -0.2 * Math.sin(phase) * blend;
        const zR = 0.2 * Math.sin(phase) * blend;

        this.stiltL.visible = blend > 0.02;
        this.stiltR.visible = blend > 0.02;
        this.stiltL.position.set(-0.13, lift + swingL, zL);
        this.stiltR.position.set(0.13, lift + swingR, zR);
        this.stiltL.rotation.set(0, 0, 0.03);
        this.stiltR.rotation.set(0, 0, -0.03);
        this.stiltL.scale.set(-1, 1, 1);
        this.stiltR.scale.set(1, 1, 1);

        kadangPose = { blend, lift, phase, swingL, swingR };

        trg.wrapper.position.set(1.55, 0, -1.05);
        trg.wrapper.rotation.y = Math.atan2(cx - 1.55, 1.17);
        this.playClip(trg, 'Idle', 1, forceClipReset);
        break;
      }

      case 'utot_higante': {
        c.wrapper.position.set(-0.6, 0, 0.15);
        c.wrapper.rotation.y = -0.35;
        this.playClip(c, 'Idle', 1, forceClipReset);

        trg.wrapper.position.set(0.7, 0, -0.1);
        trg.wrapper.rotation.y = 0.35;
        this.playClip(trg, 'Cheer', 1, forceClipReset);

        this.smokeGroup.visible = true;
        this.smokeGroup.position.set(0.05, 0, 0.05);
        for (const p of this.smokePuffs) {
          const grow = easeOutBack(clamp01((t - p.delay) / 0.55));
          const breath = 1 + 0.06 * Math.sin(t * 2.4 + p.phase);
          const r = Math.max(0.001, p.r * grow * breath);
          p.mesh.position.set(
            p.x + Math.sin(t * 1.1 + p.phase) * 0.08 * grow,
            Math.max(r, p.y * grow + Math.sin(t * 1.8 + p.phase) * 0.05 * grow),
            p.z + Math.cos(t * 0.9 + p.phase) * 0.08 * grow,
          );
          p.mesh.scale.setScalar(r);
        }
        break;
      }

      case 'pacman_kamao': {
        const cx = lerp(-1.35, -0.25, clamp01(t / 1.4));
        c.wrapper.position.set(cx, 0, 0);
        c.wrapper.rotation.y = -Math.PI / 2;
        this.playClip(c, t < 1.4 ? 'Run' : t < 2.2 ? 'Tag' : 'Cheer', 1, forceClipReset);

        this.pacmanAura.visible = true;
        this.pacmanAura.position.set(cx, 0.03, 0);
        this.pacmanAura.rotation.y = t * 2.2;
        this.pacmanAura.scale.setScalar(1.25 * easeOutBack(clamp01(t / 0.3)));

        trg.wrapper.position.set(1.65, 0, 0);
        trg.wrapper.rotation.y = Math.PI / 2;
        this.playClip(trg, t < 0.75 ? 'Throw' : 'Idle', 1, forceClipReset);

        this.enemyTsinelasProp.visible = t >= 0.45 && t < 2.2;
        if (t < 1.25) {
          const ft = clamp01((t - 0.45) / 0.8);
          this.enemyTsinelasProp.position.set(lerp(1.45, cx + 0.5, ft), 1.05 + Math.sin(ft * Math.PI) * 0.6, 0);
          this.enemyTsinelasProp.rotation.set(t * 11, 0, t * 4);
        } else if (t < 2.2) {
          const bt = clamp01((t - 1.25) / 0.95);
          this.enemyTsinelasProp.position.set(
            cx + 0.5 + bt * 0.85,
            lerp(1.05, 0.05, bt) + Math.sin(bt * Math.PI) * 0.45,
            bt * 0.85,
          );
          this.enemyTsinelasProp.rotation.set(t * 6, t * 5, 0);
        }
        break;
      }

      default:
        this.playClip(c, 'Idle', 1, forceClipReset);
        this.playClip(trg, 'Idle', 1, forceClipReset);
        break;
    }

    const step = dt > 0 ? dt : 0.016;
    c.mixer.update(step);
    trg.mixer.update(step);
    if (nny.wrapper.visible) nny.mixer.update(step);

    if (kadangPose && c.rig) {
      const { blend, lift, phase, swingL, swingR } = kadangPose;
      const toBody = (x: number, y: number, z: number) =>
        new THREE.Vector3(x / KID_SCALE, (y - lift) / KID_SCALE, z / KID_SCALE);
      const kneePole = new THREE.Vector3(0, 0, -1);

      const yL = lift + swingL;
      const zL = -0.2 * Math.sin(phase) * blend;
      const footL = toBody(-0.13, yL, zL);
      footL.y += 0.06;
      const handL = toBody(-0.13 - 0.085, yL + 0.6, zL - 0.03);
      solveLeg(c.body, c.rig, 'L', footL, kneePole, blend);
      solveArm(c.body, c.rig, 'L', handL, new THREE.Vector3(-0.4, -1, 0.5), blend);

      const yR = lift + swingR;
      const zR = 0.2 * Math.sin(phase) * blend;
      const footR = toBody(0.13, yR, zR);
      footR.y += 0.06;
      const handR = toBody(0.13 + 0.085, yR + 0.6, zR - 0.03);
      solveLeg(c.body, c.rig, 'R', footR, kneePole, blend);
      solveArm(c.body, c.rig, 'R', handR, new THREE.Vector3(0.4, -1, 0.5), blend);
    }
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
    const dist = Math.max(6.6, 2.75 / Math.max(0.15, Math.tan(horizHalfFov)));
    this.camera.position.set(0, 2.65 + (dist - 6.6) * 0.22, ARENA_ORIGIN.z + dist);
    this.camera.lookAt(0, 0.92, ARENA_ORIGIN.z);
    this.world?.skyMesh.position.copy(this.camera.position);

    const bufH = Math.max(1, this.renderer.domElement.height);
    OUTLINE_SHARED.uViewportH.value = bufH;
    OUTLINE_SHARED.uWidthPx.value = Math.min(3.8, Math.max(1.2, (2.0 * bufH) / 720));
    this.world?.updateViewport(bufH);
    if (this.loaded) this.renderer.render(this.scene, this.camera);
  }

  private onWindowResize = (): void => this.resize();

  private onVisibilityChange = (): void => {
    if (!document.hidden && this.isVisible) this.startLoop();
    else this.stopLoop();
  };

  private startLoop(): void {
    if (this.raf || this.isDisposed || !this.loaded) return;
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
    if (!this.isVisible || document.hidden || this.isDisposed || !this.loaded) return;

    const dt = Math.min(0.05, this.clock.getDelta());
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!reducedMotion) {
      const prev = this.loopTime;
      this.loopTime = (this.loopTime + dt) % LOOP_SECONDS;
      const wrapped = this.loopTime < prev;
      this.evaluateAt(this.loopTime, dt, wrapped);
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
