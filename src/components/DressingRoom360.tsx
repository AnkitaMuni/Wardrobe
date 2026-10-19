import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OutfitPair, Garment, ModelBodySettings } from '../types';
import { normalizeImageUrl } from '../utils/imageUtils';
import { 
  Rotate3d, 
  Sun, 
  Sparkles, 
  Sliders, 
  Layers, 
  Eye, 
  ChevronRight, 
  Maximize2, 
  Share2,
  RefreshCw,
  Camera,
  Compass,
  Shirt,
  Box,
  ShoppingBag,
  Palette,
  Check
} from 'lucide-react';

// Procedural accordion pleated skirt geometry generator (high-fashion boutique drape)
function createPleatedSkirtGeometry(
  topRadius: number,
  bottomRadius: number,
  height: number,
  pleatCount: number = 38,
  pleatDepth: number = 0.018
): THREE.BufferGeometry {
  const radialSegments = pleatCount * 2;
  const heightSegments = 24;
  const geo = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let y = 0; y <= heightSegments; y++) {
    const v = y / heightSegments;
    const currentY = (0.5 - v) * height;
    const flare = Math.pow(v, 1.15);
    const rBase = topRadius + (bottomRadius - topRadius) * flare;
    const depth = pleatDepth * (0.35 + 0.65 * v);

    for (let x = 0; x <= radialSegments; x++) {
      const u = x / radialSegments;
      const theta = u * Math.PI * 2;
      const isPeak = x % 2 === 0;
      const pleatOffset = (isPeak ? 1 : -1) * depth;
      const r = rBase + pleatOffset;

      vertices.push(Math.sin(theta) * r, currentY, Math.cos(theta) * r);
      uvs.push(u, v);
    }
  }

  for (let y = 0; y < heightSegments; y++) {
    for (let x = 0; x < radialSegments; x++) {
      const a = y * (radialSegments + 1) + x;
      const b = (y + 1) * (radialSegments + 1) + x;
      const c = (y + 1) * (radialSegments + 1) + (x + 1);
      const d = y * (radialSegments + 1) + (x + 1);
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

// Architectural Chrome/Silver Vitrine Showcase Box (Image 2 luxury boutique window)
function buildVitrineBox(group: THREE.Group, isLightVitrine: boolean) {
  while (group.children.length > 0) {
    group.remove(group.children[0]);
  }

  const width = 1.62;
  const height = 2.40;
  const depth = 1.25;
  const beamSize = 0.036;

  // Frame Material: Polished brushed chrome / platinum metal
  const frameMat = new THREE.MeshStandardMaterial({
    color: isLightVitrine ? 0xd0d5de : 0x24242e,
    metalness: 0.92,
    roughness: 0.22,
  });

  const halfW = width / 2 - beamSize / 2;
  const halfD = depth / 2 - beamSize / 2;
  const halfH = height / 2;

  // 4 Corner Vertical Pillars
  const pillarGeo = new THREE.BoxGeometry(beamSize, height, beamSize);
  [
    [-halfW, -halfD],
    [halfW, -halfD],
    [-halfW, halfD],
    [halfW, halfD],
  ].forEach(([px, pz]) => {
    const pillar = new THREE.Mesh(pillarGeo, frameMat);
    pillar.position.set(px, halfH, pz);
    pillar.castShadow = true;
    group.add(pillar);
  });

  // Top 4 Beams
  const beamXGeo = new THREE.BoxGeometry(width, beamSize, beamSize);
  const beamZGeo = new THREE.BoxGeometry(beamSize, beamSize, depth);

  const topFront = new THREE.Mesh(beamXGeo, frameMat);
  topFront.position.set(0, height - beamSize / 2, halfD);
  const topBack = new THREE.Mesh(beamXGeo, frameMat);
  topBack.position.set(0, height - beamSize / 2, -halfD);
  const topLeft = new THREE.Mesh(beamZGeo, frameMat);
  topLeft.position.set(-halfW, height - beamSize / 2, 0);
  const topRight = new THREE.Mesh(beamZGeo, frameMat);
  topRight.position.set(halfW, height - beamSize / 2, 0);

  // Bottom 4 Beams
  const bottomFront = new THREE.Mesh(beamXGeo, frameMat);
  bottomFront.position.set(0, beamSize / 2, halfD);
  const bottomBack = new THREE.Mesh(beamXGeo, frameMat);
  bottomBack.position.set(0, beamSize / 2, -halfD);
  const bottomLeft = new THREE.Mesh(beamZGeo, frameMat);
  bottomLeft.position.set(-halfW, beamSize / 2, 0);
  const bottomRight = new THREE.Mesh(beamZGeo, frameMat);
  bottomRight.position.set(halfW, beamSize / 2, 0);

  group.add(topFront, topBack, topLeft, topRight, bottomFront, bottomBack, bottomLeft, bottomRight);

  // Studio Gallery Back Wall (Soft White / Pearl)
  const wallGeo = new THREE.BoxGeometry(width - beamSize, height - beamSize * 2, 0.02);
  const wallMat = new THREE.MeshStandardMaterial({
    color: isLightVitrine ? 0xfafafc : 0x0b0b10,
    roughness: 0.9,
  });
  const wall = new THREE.Mesh(wallGeo, wallMat);
  wall.position.set(0, height / 2, -halfD);
  wall.receiveShadow = true;
  group.add(wall);

  // Floor Base
  const floorGeo = new THREE.BoxGeometry(width - beamSize, 0.04, depth - beamSize);
  const floorMat = new THREE.MeshStandardMaterial({
    color: isLightVitrine ? 0xf2f2f7 : 0x14141c,
    roughness: 0.16,
    metalness: 0.08,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.set(0, -0.02, 0);
  floor.receiveShadow = true;
  group.add(floor);

  // Vitrine Ceiling Light Panel
  const ceilingGeo = new THREE.BoxGeometry(width - beamSize * 2, 0.015, depth - beamSize * 2);
  const ceilingMat = new THREE.MeshBasicMaterial({
    color: isLightVitrine ? 0xffffff : 0x22222a,
  });
  const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
  ceiling.position.set(0, height - 0.02, 0);
  group.add(ceiling);
}

interface DressingRoom360Props {
  currentOutfit: OutfitPair | null;
  selectedGarments: {
    top?: Garment;
    bottom?: Garment;
    dress?: Garment;
    outerwear?: Garment;
    footwear?: Garment;
    accessory?: Garment;
  };
  onRemoveGarment: (category: keyof DressingRoom360Props['selectedGarments']) => void;
  onSelectAlternative: (category: string) => void;
}

export const DressingRoom360: React.FC<DressingRoom360Props> = ({
  currentOutfit,
  selectedGarments,
  onRemoveGarment,
  onSelectAlternative,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeAngle, setActiveAngle] = useState<'front' | 'three_quarter' | 'side' | 'back'>('front');
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(true);
  const [lightingPreset, setLightingPreset] = useState<'studio' | 'sunset' | 'daylight' | 'noir'>('studio');
  const [activeTab, setActiveTab] = useState<'view3d' | 'vton_photoreal'>('view3d');
  
  // Model body configuration
  const [bodySettings, setBodySettings] = useState<ModelBodySettings>({
    gender: 'female',
    height: 172,
    build: 'curvy',
    skinTone: '#E0AC69',
    lighting: 'studio',
    viewAngle: 'front',
    autoRotate: true,
    rotationSpeed: 0.005,
  });

  const [showBodyModal, setShowBodyModal] = useState<boolean>(false);
  const [rotationDegrees, setRotationDegrees] = useState<number>(0);

  // High-Fashion Vitrine & Mannequin Style States (matching Image 2)
  const [mannequinFinish, setMannequinFinish] = useState<'obsidian' | 'white' | 'chrome' | 'natural'>('obsidian');
  const [showcaseTheme, setShowcaseTheme] = useState<'vitrine' | 'noir'>('vitrine');
  const [showHandbag, setShowHandbag] = useState<boolean>(true);

  // Three.js instances ref
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const vitrineGroupRef = useRef<THREE.Group | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const keyLightRef = useRef<THREE.DirectionalLight | null>(null);
  const fillLightRef = useRef<THREE.DirectionalLight | null>(null);
  const rimLightRef = useRef<THREE.DirectionalLight | null>(null);
  const spotLightRef = useRef<THREE.SpotLight | null>(null);
  const garmentMeshesRef = useRef<{ [key: string]: THREE.Mesh[] }>({});
  const animationFrameIdRef = useRef<number | null>(null);
  const targetRotationYRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const previousMouseXRef = useRef<number>(0);

  // Active pieces resolved from either currentOutfit or selectedGarments
  const activeTop = selectedGarments.top || currentOutfit?.top;
  const activeBottom = selectedGarments.bottom || currentOutfit?.bottom;
  const activeDress = selectedGarments.dress || currentOutfit?.dress;
  const activeOuter = selectedGarments.outerwear || currentOutfit?.outerwear;
  const activeFootwear = selectedGarments.footwear || currentOutfit?.footwear;
  const activeAccessory = selectedGarments.accessory || currentOutfit?.accessory;

  // Default high-fashion teal silk pleated wrap dress inspired by designer vitrine (Image 2)
  const defaultShowcaseDress: Garment = {
    id: 'showcase-teal-pleated-dress',
    name: 'Teal Silk Accordion Pleated Wrap Dress',
    category: 'dress',
    subcategory: 'Pleated Midi Dress',
    color: 'Teal Blue',
    colorHex: '#1F6E8C',
    pattern: 'Accordion Pleated',
    material: 'Pleated Mulberry Silk',
    seasons: ['all-season'],
    occasions: ['cocktail', 'date_night', 'wedding'],
    imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80',
    source: 'manual',
    tags: ['couture', 'pleated', 'vitrine-showcase'],
    timesWorn: 0,
    isFavorite: true,
    createdAt: new Date().toISOString().split('T')[0],
  };

  const resolvedDress = activeDress || (!activeTop && !activeBottom ? defaultShowcaseDress : undefined);

  // Initialize Three.js Scene
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(showcaseTheme === 'vitrine' ? 0xf5f5f8 : 0x0c0c12);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.25, 3.4);
    camera.lookAt(0, 1.15, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    // Setup High-Fashion Showcase Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, showcaseTheme === 'vitrine' ? 0.85 : 0.45);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const keyLight = new THREE.DirectionalLight(0xffffff, showcaseTheme === 'vitrine' ? 1.7 : 1.4);
    keyLight.position.set(2.5, 3.8, 2.6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);
    keyLightRef.current = keyLight;

    const fillLight = new THREE.DirectionalLight(0xe4ecfa, showcaseTheme === 'vitrine' ? 0.85 : 0.55);
    fillLight.position.set(-2.5, 2.2, 2.0);
    scene.add(fillLight);
    fillLightRef.current = fillLight;

    // Rim light: essential for creating the crisp specular white highlight lines down the obsidian lacquer mannequin
    const rimLight = new THREE.DirectionalLight(0xffffff, showcaseTheme === 'vitrine' ? 1.6 : 2.0);
    rimLight.position.set(0, 2.8, -2.4);
    scene.add(rimLight);
    rimLightRef.current = rimLight;

    // Top Vitrine Showcase Spotlight
    const vitrineSpot = new THREE.SpotLight(0xffffff, 2.0);
    vitrineSpot.position.set(0, 3.2, 0.4);
    vitrineSpot.angle = Math.PI / 3;
    vitrineSpot.penumbra = 0.5;
    vitrineSpot.castShadow = true;
    scene.add(vitrineSpot);
    spotLightRef.current = vitrineSpot;

    // Architectural Vitrine Showcase Frame Group (stationary)
    const vitrineGroup = new THREE.Group();
    scene.add(vitrineGroup);
    vitrineGroupRef.current = vitrineGroup;
    buildVitrineBox(vitrineGroup, showcaseTheme === 'vitrine');

    // Model Group (rotating mannequin on turntable podium)
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    // Animation Loop
    let angleDegrees = 0;
    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);

      if (modelGroupRef.current) {
        if (isAutoRotating && !isDraggingRef.current) {
          modelGroupRef.current.rotation.y += 0.005;
          targetRotationYRef.current = modelGroupRef.current.rotation.y;
        } else {
          // Smooth dampening towards target rotation
          modelGroupRef.current.rotation.y += (targetRotationYRef.current - modelGroupRef.current.rotation.y) * 0.1;
        }

        angleDegrees = Math.round(((modelGroupRef.current.rotation.y % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2)) * (180 / Math.PI));
        setRotationDegrees(angleDegrees);
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Mouse / Touch Interactivity for 360 Turn
    const dom = renderer.domElement;
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMouseXRef.current = e.clientX;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - previousMouseXRef.current;
      targetRotationYRef.current += deltaX * 0.01;
      previousMouseXRef.current = e.clientX;
    };
    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.dispose();
    };
  }, []);

  // Update Vitrine Box & Lights when Showcase Theme changes
  useEffect(() => {
    if (!vitrineGroupRef.current || !sceneRef.current) return;
    const isLight = showcaseTheme === 'vitrine';
    sceneRef.current.background = new THREE.Color(isLight ? 0xf5f5f8 : 0x0c0c12);
    buildVitrineBox(vitrineGroupRef.current, isLight);

    if (ambientLightRef.current) ambientLightRef.current.intensity = isLight ? 0.85 : 0.45;
    if (keyLightRef.current) keyLightRef.current.intensity = isLight ? 1.7 : 1.4;
    if (fillLightRef.current) fillLightRef.current.intensity = isLight ? 0.85 : 0.55;
    if (rimLightRef.current) rimLightRef.current.intensity = isLight ? 1.6 : 2.0;
  }, [showcaseTheme]);

  // Update Model Geometry and Garments whenever body settings, mannequin finish, or outfit changes
  useEffect(() => {
    if (!modelGroupRef.current || !sceneRef.current) return;

    const group = modelGroupRef.current;
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }
    garmentMeshesRef.current = {};

    // Build proportions based on bodySettings
    const heightFactor = bodySettings.height / 170;
    const isSlim = bodySettings.build === 'slim';
    const isCurvy = bodySettings.build === 'curvy';
    const isAthletic = bodySettings.build === 'athletic';

    const widthScale = isSlim ? 0.88 : isCurvy ? 1.08 : isAthletic ? 1.02 : 0.96;
    const hipsScale = isCurvy ? 1.18 : isSlim ? 0.90 : 1.0;

    // --- High-Fashion Mannequin Material (Image 2 style) ---
    const mannequinColor = mannequinFinish === 'obsidian' ? 0x07070b :
      mannequinFinish === 'white' ? 0xf5f6fa :
      mannequinFinish === 'chrome' ? 0xc8d0db :
      new THREE.Color(bodySettings.skinTone);

    const mannequinMat = new THREE.MeshPhysicalMaterial({
      color: mannequinColor,
      roughness: mannequinFinish === 'natural' ? 0.6 : 0.07,
      metalness: mannequinFinish === 'chrome' ? 0.95 : 0.14,
      clearcoat: mannequinFinish === 'natural' ? 0.0 : 1.0,
      clearcoatRoughness: 0.04,
      reflectivity: 0.95,
    });

    // --- Circular Turntable Podium Base Inside Vitrine ---
    const podiumGeo = new THREE.CylinderGeometry(0.55, 0.58, 0.024, 48);
    const podiumMat = new THREE.MeshStandardMaterial({
      color: showcaseTheme === 'vitrine' ? 0x0c0c10 : 0x16161f,
      roughness: 0.22,
      metalness: 0.35,
    });
    const podium = new THREE.Mesh(podiumGeo, podiumMat);
    podium.position.y = 0.012;
    podium.receiveShadow = true;
    group.add(podium);

    const ringGeo = new THREE.RingGeometry(0.52, 0.54, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: showcaseTheme === 'vitrine' ? 0xd4af37 : 0xe0e0e8,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.025;
    group.add(ring);

    // --- MANNEQUIN BODY PARTS ---
    // Sculpted Stylized Head (Haute Couture Oval)
    const headGeo = new THREE.SphereGeometry(0.108 * heightFactor, 36, 36);
    headGeo.scale(0.82, 1.18, 0.9);
    const head = new THREE.Mesh(headGeo, mannequinMat);
    head.position.set(0, 1.98 * heightFactor, 0.01);
    head.rotation.x = -0.03;
    head.rotation.y = 0.03;
    head.castShadow = true;
    group.add(head);

    // Graceful Slender Neck
    const neckGeo = new THREE.CylinderGeometry(0.042 * widthScale, 0.052 * widthScale, 0.16, 32);
    const neck = new THREE.Mesh(neckGeo, mannequinMat);
    neck.position.y = 1.84 * heightFactor;
    neck.castShadow = true;
    group.add(neck);

    // Sculpted Collarbone / Clavicle Bar
    const clavicleGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.36 * widthScale, 16);
    const clavicle = new THREE.Mesh(clavicleGeo, mannequinMat);
    clavicle.rotation.z = Math.PI / 2;
    clavicle.position.set(0, 1.76 * heightFactor, 0.025);
    group.add(clavicle);

    // Shoulders
    const shoulderGeo = new THREE.SphereGeometry(0.046, 24, 24);
    const leftShoulder = new THREE.Mesh(shoulderGeo, mannequinMat);
    leftShoulder.position.set(-0.21 * widthScale, 1.74 * heightFactor, 0);
    leftShoulder.castShadow = true;

    const rightShoulder = new THREE.Mesh(shoulderGeo, mannequinMat);
    rightShoulder.position.set(0.21 * widthScale, 1.74 * heightFactor, 0);
    rightShoulder.castShadow = true;
    group.add(leftShoulder, rightShoulder);

    // Upper Torso Base Under Bodice
    const chestGeo = new THREE.CylinderGeometry(0.175 * widthScale, 0.145 * widthScale, 0.32, 32);
    chestGeo.scale(1, 1, 0.72);
    const chest = new THREE.Mesh(chestGeo, mannequinMat);
    chest.position.y = 1.60 * heightFactor;
    chest.castShadow = true;
    group.add(chest);

    // Waist / Pelvic Core
    const waistCoreGeo = new THREE.CylinderGeometry(0.14 * widthScale, 0.168 * hipsScale, 0.30, 32);
    waistCoreGeo.scale(1, 1, 0.74);
    const waistCore = new THREE.Mesh(waistCoreGeo, mannequinMat);
    waistCore.position.y = 1.34 * heightFactor;
    waistCore.castShadow = true;
    group.add(waistCore);

    // --- ARMS IN RUNWAY POSE ---
    // Left Arm (Relaxed Elegance)
    const leftUpperGeo = new THREE.CylinderGeometry(0.033, 0.028, 0.33, 24);
    const leftUpper = new THREE.Mesh(leftUpperGeo, mannequinMat);
    leftUpper.position.set(-0.235 * widthScale, 1.54 * heightFactor, 0.01);
    leftUpper.rotation.z = 0.08;
    leftUpper.castShadow = true;

    const elbowGeo = new THREE.SphereGeometry(0.027, 16, 16);
    const leftElbow = new THREE.Mesh(elbowGeo, mannequinMat);
    leftElbow.position.set(-0.248 * widthScale, 1.37 * heightFactor, 0.01);
    leftElbow.castShadow = true;

    const leftForearmGeo = new THREE.CylinderGeometry(0.026, 0.020, 0.32, 24);
    const leftForearm = new THREE.Mesh(leftForearmGeo, mannequinMat);
    leftForearm.position.set(-0.252 * widthScale, 1.20 * heightFactor, 0.02);
    leftForearm.rotation.z = 0.04;
    leftForearm.castShadow = true;

    const handGeo = new THREE.BoxGeometry(0.022, 0.08, 0.042);
    const leftHand = new THREE.Mesh(handGeo, mannequinMat);
    leftHand.position.set(-0.252 * widthScale, 1.02 * heightFactor, 0.02);
    leftHand.rotation.z = 0.05;
    leftHand.castShadow = true;

    group.add(leftUpper, leftElbow, leftForearm, leftHand);

    // Right Arm (Poised Runway Angle Holding Bag - exactly like Image 2!)
    const rightUpperGeo = new THREE.CylinderGeometry(0.033, 0.028, 0.33, 24);
    const rightUpper = new THREE.Mesh(rightUpperGeo, mannequinMat);
    rightUpper.position.set(0.235 * widthScale, 1.54 * heightFactor, 0.02);
    rightUpper.rotation.z = -0.16;
    rightUpper.rotation.x = 0.14;
    rightUpper.castShadow = true;

    const rightElbow = new THREE.Mesh(elbowGeo, mannequinMat);
    rightElbow.position.set(0.265 * widthScale, 1.37 * heightFactor, 0.06);
    rightElbow.castShadow = true;

    // Forearm angled forward to hold bag handle
    const rightForearmGeo = new THREE.CylinderGeometry(0.026, 0.020, 0.28, 24);
    const rightForearm = new THREE.Mesh(rightForearmGeo, mannequinMat);
    rightForearm.position.set(0.285 * widthScale, 1.24 * heightFactor, 0.16);
    rightForearm.rotation.x = 0.72;
    rightForearm.rotation.z = -0.06;
    rightForearm.castShadow = true;

    const rightHandGeo = new THREE.BoxGeometry(0.038, 0.045, 0.03);
    const rightHand = new THREE.Mesh(rightHandGeo, mannequinMat);
    rightHand.position.set(0.30 * widthScale, 1.13 * heightFactor, 0.25);
    rightHand.castShadow = true;

    group.add(rightUpper, rightElbow, rightForearm, rightHand);

    // --- LEGS & HIGH-GLOSS STILETTO HIGH HEELS ---
    const shoeMat = new THREE.MeshPhysicalMaterial({
      color: 0x060609,
      roughness: 0.03,
      metalness: 0.22,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
    });

    [-1, 1].forEach((side) => {
      const legX = side * 0.092 * widthScale;

      // Thigh
      const thighGeo = new THREE.CylinderGeometry(0.068 * hipsScale, 0.046, 0.46, 24);
      const thigh = new THREE.Mesh(thighGeo, mannequinMat);
      thigh.position.set(legX, 1.04 * heightFactor, 0);
      thigh.castShadow = true;

      // Knee
      const kneeGeo = new THREE.SphereGeometry(0.043, 20, 20);
      const knee = new THREE.Mesh(kneeGeo, mannequinMat);
      knee.position.set(legX, 0.80 * heightFactor, 0.008);
      knee.castShadow = true;

      // Sculpted Calf
      const calfGeo = new THREE.CylinderGeometry(0.044, 0.027, 0.46, 24);
      const calf = new THREE.Mesh(calfGeo, mannequinMat);
      calf.position.set(legX, 0.57 * heightFactor, 0.005);
      calf.castShadow = true;

      // Stiletto High Heel Bootie / Pump
      // Pointed toe box angled to floor
      const toeGeo = new THREE.ConeGeometry(0.038, 0.14, 16);
      toeGeo.rotateX(Math.PI / 2.2);
      toeGeo.scale(0.85, 0.65, 1.0);
      const toe = new THREE.Mesh(toeGeo, shoeMat);
      toe.position.set(legX, 0.038, 0.065);
      toe.castShadow = true;

      // Elevated Instep Arch
      const instepGeo = new THREE.BoxGeometry(0.048, 0.055, 0.08);
      instepGeo.rotateX(-0.4);
      const instep = new THREE.Mesh(instepGeo, shoeMat);
      instep.position.set(legX, 0.068, 0.01);
      instep.castShadow = true;

      // Slender Stiletto Heel Post
      const heelGeo = new THREE.CylinderGeometry(0.006, 0.004, 0.11, 16);
      const heel = new THREE.Mesh(heelGeo, shoeMat);
      heel.position.set(legX, 0.055, -0.035);
      heel.castShadow = true;

      // Heel Top Cap
      const heelCapGeo = new THREE.CylinderGeometry(0.013, 0.008, 0.02, 16);
      const heelCap = new THREE.Mesh(heelCapGeo, shoeMat);
      heelCap.position.set(legX, 0.105, -0.035);

      group.add(thigh, knee, calf, toe, instep, heel, heelCap);
    });

    // --- GARMENTS (Accordion Pleated Wrap Dress or Separates) ---
    const textureLoader = new THREE.TextureLoader();

    // Fabric Color & Material Setup
    let dressColorHex = resolvedDress?.colorHex;
    if (resolvedDress) {
      const lowerName = (resolvedDress.name + ' ' + resolvedDress.subcategory).toLowerCase();
      if (lowerName.includes('pink') && (!dressColorHex || dressColorHex === '#C5A059' || dressColorHex === '#ffffff' || dressColorHex === '#F8F6F0')) {
        dressColorHex = '#E879F9';
      } else if (lowerName.includes('black') && (!dressColorHex || dressColorHex === '#C5A059')) {
        dressColorHex = '#1E1E24';
      } else if (lowerName.includes('red') && (!dressColorHex || dressColorHex === '#C5A059')) {
        dressColorHex = '#E11D48';
      } else if (lowerName.includes('blue') && (!dressColorHex || dressColorHex === '#C5A059')) {
        dressColorHex = '#1F6E8C';
      } else if (!dressColorHex) {
        dressColorHex = '#1F6E8C'; // Gorgeous default teal blue from Image 2!
      }
    }

    let dressTexture: THREE.Texture | undefined = undefined;
    if (resolvedDress?.imageUrl && resolvedDress.imageUrl !== defaultShowcaseDress.imageUrl) {
      try {
        dressTexture = textureLoader.load(normalizeImageUrl(resolvedDress.imageUrl));
        dressTexture.wrapS = THREE.RepeatWrapping;
        dressTexture.wrapT = THREE.RepeatWrapping;
      } catch (err) {
        console.warn('Could not load dress texture', err);
      }
    }

    const dressMat = new THREE.MeshStandardMaterial({
      color: dressColorHex ? new THREE.Color(dressColorHex) : new THREE.Color(0x1F6E8C),
      map: dressTexture,
      roughness: 0.36,
      metalness: 0.08,
      side: THREE.DoubleSide,
    });

    // DRESS IS WORN (OR DEFAULT SHOWCASE ENSEMBLE)
    if (resolvedDress) {
      // 1. Crossover V-Neck Pleated Wrap Bodice (Image 2 style)
      const leftDrapeGeo = new THREE.CylinderGeometry(0.185 * widthScale, 0.155 * widthScale, 0.36, 32, 1, true);
      leftDrapeGeo.scale(1.04, 1.0, 0.82);
      const leftDrape = new THREE.Mesh(leftDrapeGeo, dressMat);
      leftDrape.position.set(0.022 * widthScale, 1.58 * heightFactor, 0.015);
      leftDrape.rotation.z = 0.11;
      leftDrape.castShadow = true;

      const rightDrapeGeo = new THREE.CylinderGeometry(0.182 * widthScale, 0.152 * widthScale, 0.36, 32, 1, true);
      rightDrapeGeo.scale(1.02, 1.0, 0.80);
      const rightDrape = new THREE.Mesh(rightDrapeGeo, dressMat);
      rightDrape.position.set(-0.022 * widthScale, 1.57 * heightFactor, 0.01);
      rightDrape.rotation.z = -0.11;
      rightDrape.castShadow = true;

      // Shoulder drape straps forming V-neck lapels
      const strapGeo = new THREE.CylinderGeometry(0.045, 0.065, 0.30, 16);
      strapGeo.scale(1.0, 1.0, 0.6);
      const leftStrap = new THREE.Mesh(strapGeo, dressMat);
      leftStrap.position.set(-0.12 * widthScale, 1.68 * heightFactor, 0.015);
      leftStrap.rotation.z = -0.18;
      leftStrap.rotation.x = 0.15;

      const rightStrap = new THREE.Mesh(strapGeo, dressMat);
      rightStrap.position.set(0.12 * widthScale, 1.68 * heightFactor, 0.015);
      rightStrap.rotation.z = 0.18;
      rightStrap.rotation.x = 0.15;

      group.add(leftDrape, rightDrape, leftStrap, rightStrap);

      // 2. Cinched Black Leather Waist Belt with Polished Metal Buckle (Image 2)
      const beltMat = new THREE.MeshStandardMaterial({
        color: 0x121216,
        roughness: 0.32,
        metalness: 0.15,
      });
      const beltGeo = new THREE.CylinderGeometry(0.156 * widthScale, 0.156 * widthScale, 0.058, 36);
      beltGeo.scale(1.0, 1.0, 0.78);
      const belt = new THREE.Mesh(beltGeo, beltMat);
      belt.position.y = 1.35 * heightFactor;
      belt.castShadow = true;

      const buckleMat = new THREE.MeshStandardMaterial({
        color: 0xe2e5ec,
        metalness: 0.95,
        roughness: 0.15,
      });
      const buckleGeo = new THREE.BoxGeometry(0.075, 0.05, 0.018);
      const buckle = new THREE.Mesh(buckleGeo, buckleMat);
      buckle.position.set(0, 1.35 * heightFactor, 0.13 * widthScale);

      const buckleProngGeo = new THREE.BoxGeometry(0.014, 0.042, 0.022);
      const buckleProng = new THREE.Mesh(buckleProngGeo, beltMat);
      buckleProng.position.set(0, 1.35 * heightFactor, 0.13 * widthScale);

      group.add(belt, buckle, buckleProng);

      // 3. Accordion Pleated Midi Skirt (Image 2)
      const skirtGeo = createPleatedSkirtGeometry(
        0.155 * widthScale,  // waist circumference
        0.46 * hipsScale,    // bottom hem flare
        0.82 * heightFactor, // length from waist to mid-calf
        40,                  // 40 distinct accordion pleats!
        0.018                // accordion pleat depth
      );
      const skirtMesh = new THREE.Mesh(skirtGeo, dressMat);
      skirtMesh.position.y = 0.94 * heightFactor;
      skirtMesh.castShadow = true;
      group.add(skirtMesh);

      // 4. Hip Drape / Sash Accent on Right Hip (Image 2)
      const sashGeo = new THREE.TorusGeometry(0.065, 0.028, 12, 24, Math.PI * 1.4);
      sashGeo.scale(1.0, 1.4, 0.8);
      const sash = new THREE.Mesh(sashGeo, dressMat);
      sash.position.set(0.18 * widthScale, 1.25 * heightFactor, 0.08);
      sash.rotation.z = -0.3;
      sash.rotation.y = 0.4;
      sash.castShadow = true;
      group.add(sash);
    } else {
      // Separates (Top + Bottom)
      let topTexture: THREE.Texture | undefined = undefined;
      if (activeTop?.imageUrl) {
        try {
          topTexture = textureLoader.load(normalizeImageUrl(activeTop.imageUrl));
        } catch (err) {
          console.warn('Could not load top texture', err);
        }
      }

      const topMat = new THREE.MeshStandardMaterial({
        color: activeTop?.colorHex ? new THREE.Color(activeTop.colorHex) : new THREE.Color(0x22222a),
        map: topTexture,
        roughness: 0.45,
        metalness: 0.05,
      });

      const topGeo = new THREE.CylinderGeometry(0.18 * widthScale, 0.145 * widthScale, 0.38, 32);
      topGeo.scale(1, 1, 0.75);
      const topMesh = new THREE.Mesh(topGeo, topMat);
      topMesh.position.y = 1.58 * heightFactor;
      topMesh.castShadow = true;
      group.add(topMesh);

      const bottomMat = new THREE.MeshStandardMaterial({
        color: activeBottom?.colorHex ? new THREE.Color(activeBottom.colorHex) : new THREE.Color(0x181822),
        roughness: 0.65,
        metalness: 0.05,
      });

      const bottomGeo = new THREE.CylinderGeometry(0.15 * widthScale, 0.19 * hipsScale, 0.28, 32);
      bottomGeo.scale(1, 1, 0.78);
      const bottomMesh = new THREE.Mesh(bottomGeo, bottomMat);
      bottomMesh.position.y = 1.32 * heightFactor;
      bottomMesh.castShadow = true;
      group.add(bottomMesh);
    }

    // Outerwear Layer (Blazer or Coat if present)
    if (activeOuter) {
      const outerGeo = new THREE.CylinderGeometry(0.22 * widthScale, 0.24 * hipsScale, 0.72, 32, 1, true);
      outerGeo.scale(1.08, 1, 0.85);
      const outerMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(activeOuter.colorHex),
        roughness: 0.65,
        metalness: 0.1,
        side: THREE.DoubleSide,
      });
      const outerMesh = new THREE.Mesh(outerGeo, outerMat);
      outerMesh.position.y = 1.46 * heightFactor;
      group.add(outerMesh);
    }

    // --- DESIGNER HANDBAG (Image 2 style) ---
    if (showHandbag) {
      const bagGroup = new THREE.Group();
      bagGroup.position.set(0.30 * widthScale, 0.88 * heightFactor, 0.23);

      const bagLeatherMat = new THREE.MeshStandardMaterial({
        color: 0x121216,
        roughness: 0.28,
        metalness: 0.15,
      });

      const goldHardwareMat = new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        metalness: 0.92,
        roughness: 0.2,
      });

      // Structured Trapezoidal Tote Body
      const bagGeo = new THREE.BoxGeometry(0.16, 0.19, 0.095);
      bagGeo.scale(1.0, 1.0, 0.85);
      const bagBody = new THREE.Mesh(bagGeo, bagLeatherMat);
      bagBody.castShadow = true;
      bagGroup.add(bagBody);

      // Flap
      const flapGeo = new THREE.BoxGeometry(0.164, 0.09, 0.02);
      const flap = new THREE.Mesh(flapGeo, bagLeatherMat);
      flap.position.set(0, 0.035, 0.045);
      bagGroup.add(flap);

      // Gold Clasp Lock
      const lockGeo = new THREE.BoxGeometry(0.024, 0.022, 0.015);
      const lock = new THREE.Mesh(lockGeo, goldHardwareMat);
      lock.position.set(0, -0.015, 0.055);
      bagGroup.add(lock);

      // Gold Chain Attachment Rings
      const attachRingGeo = new THREE.TorusGeometry(0.015, 0.004, 8, 16);
      const leftRing = new THREE.Mesh(attachRingGeo, goldHardwareMat);
      leftRing.position.set(-0.055, 0.095, 0);
      const rightRing = new THREE.Mesh(attachRingGeo, goldHardwareMat);
      rightRing.position.set(0.055, 0.095, 0);
      bagGroup.add(leftRing, rightRing);

      // Tubular Leather Handle going up into the hand
      const handleGeo = new THREE.TorusGeometry(0.065, 0.009, 12, 24, Math.PI);
      handleGeo.scale(0.85, 1.6, 1.0);
      const handle = new THREE.Mesh(handleGeo, bagLeatherMat);
      handle.position.set(0, 0.14, 0);
      bagGroup.add(handle);

      group.add(bagGroup);
    }

  }, [activeTop, activeBottom, activeDress, activeOuter, activeFootwear, activeAccessory, bodySettings, mannequinFinish, showcaseTheme, showHandbag, resolvedDress]);

  // Handle Preset Angle Clicks
  const setCameraAngle = (angle: 'front' | 'three_quarter' | 'side' | 'back') => {
    setActiveAngle(angle);
    setIsAutoRotating(false);
    if (!modelGroupRef.current) return;

    let targetRadian = 0;
    switch (angle) {
      case 'front': targetRadian = 0; break;
      case 'three_quarter': targetRadian = Math.PI / 4; break;
      case 'side': targetRadian = Math.PI / 2; break;
      case 'back': targetRadian = Math.PI; break;
    }
    targetRotationYRef.current = targetRadian;
  };

  return (
    <div className="relative w-full h-[750px] lg:h-[820px] rounded-3xl overflow-hidden bg-gradient-to-b from-[#14141B] via-[#0E0E14] to-[#0A0A0E] border border-white/10 shadow-2xl flex flex-col">
      {/* Top Bar: Dressing Room Header & Controls */}
      <div className="relative z-20 px-6 py-4 border-b border-white/10 bg-black/40 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Rotate3d className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-lg font-bold text-white tracking-wide">
                Virtual 360° Atelier
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Interactive Multi-Angle VTON
              </span>
            </div>
            <p className="text-xs text-stone-400">
              Drag anywhere on the model to rotate 360° & inspect fabric drape from all angles
            </p>
          </div>
        </div>

        {/* View Switcher (3D Canvas vs Photoreal VTON) */}
        <div className="flex items-center gap-2 bg-stone-900/80 p-1 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveTab('view3d')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'view3d'
                ? 'bg-amber-500 text-black shadow-lg font-bold'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            <Rotate3d className="w-3.5 h-3.5" />
            3D Turntable (360°)
          </button>
          <button
            onClick={() => setActiveTab('vton_photoreal')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'vton_photoreal'
                ? 'bg-amber-500 text-black shadow-lg font-bold'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Studio VTON Render
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBodyModal(!showBodyModal)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 text-stone-200 border border-white/10 flex items-center gap-1.5 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Customize Figure ({bodySettings.height}cm, {bodySettings.build})</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side: 3D Turntable or Photoreal Render View */}
        <div className="relative flex-1 h-full flex flex-col">
          {activeTab === 'view3d' ? (
            <div className="relative w-full h-full cursor-grab active:cursor-grabbing">
              {/* Three.js canvas container */}
              <div ref={mountRef} className="w-full h-full" />

              {/* Floating Angle Presets Navigation */}
              <div className="absolute top-4 left-6 z-10 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/10 shadow-lg">
                <Compass className="w-4 h-4 text-amber-400" />
                <span className="text-[11px] text-stone-300 font-mono pr-2 border-r border-white/10">
                  {rotationDegrees}°
                </span>

                <button
                  onClick={() => setCameraAngle('front')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    activeAngle === 'front' && !isAutoRotating
                      ? 'bg-amber-500 text-black font-semibold'
                      : 'text-stone-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Front
                </button>
                <button
                  onClick={() => setCameraAngle('three_quarter')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    activeAngle === 'three_quarter' && !isAutoRotating
                      ? 'bg-amber-500 text-black font-semibold'
                      : 'text-stone-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  3/4 Angle
                </button>
                <button
                  onClick={() => setCameraAngle('side')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    activeAngle === 'side' && !isAutoRotating
                      ? 'bg-amber-500 text-black font-semibold'
                      : 'text-stone-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Profile
                </button>
                <button
                  onClick={() => setCameraAngle('back')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    activeAngle === 'back' && !isAutoRotating
                      ? 'bg-amber-500 text-black font-semibold'
                      : 'text-stone-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Back View
                </button>

                <div className="h-4 w-px bg-white/10 mx-1" />

                <button
                  onClick={() => setIsAutoRotating(!isAutoRotating)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                    isAutoRotating
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <RefreshCw className={`w-3 h-3 ${isAutoRotating ? 'animate-spin' : ''}`} />
                  360° Spin
                </button>
              </div>

              {/* Floating Haute Vitrine Styling Controls (Image 2 Reference Customizer) */}
              <div className="absolute top-4 right-6 z-10 flex flex-wrap items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/10 shadow-lg">
                {/* Mannequin Finish */}
                <div className="flex items-center gap-1.5 pr-2 border-r border-white/10">
                  <span className="text-[11px] text-stone-400 font-medium hidden sm:inline">Finish:</span>
                  <button
                    onClick={() => setMannequinFinish('obsidian')}
                    title="Obsidian Gloss (Image 2 Reference)"
                    className={`px-2 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                      mannequinFinish === 'obsidian'
                        ? 'bg-amber-500 text-black font-bold shadow'
                        : 'text-stone-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-black border border-white/40 shadow-sm" />
                    <span>Obsidian</span>
                  </button>
                  <button
                    onClick={() => setMannequinFinish('white')}
                    title="Museum White"
                    className={`px-2 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                      mannequinFinish === 'white'
                        ? 'bg-amber-500 text-black font-bold shadow'
                        : 'text-stone-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-white border border-stone-400 shadow-sm" />
                    <span>White</span>
                  </button>
                  <button
                    onClick={() => setMannequinFinish('chrome')}
                    title="Liquid Chrome"
                    className={`px-2 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                      mannequinFinish === 'chrome'
                        ? 'bg-amber-500 text-black font-bold shadow'
                        : 'text-stone-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-stone-300 border border-white shadow-sm" />
                    <span>Chrome</span>
                  </button>
                </div>

                {/* Vitrine Showcase Frame Toggle */}
                <button
                  onClick={() => setShowcaseTheme(showcaseTheme === 'vitrine' ? 'noir' : 'vitrine')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    showcaseTheme === 'vitrine'
                      ? 'bg-white/20 text-white font-semibold border border-white/30'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                  title="Toggle Boutique Vitrine Showcase Box (Image 2)"
                >
                  <Box className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Vitrine Frame</span>
                </button>

                {/* Handbag Toggle */}
                <button
                  onClick={() => setShowHandbag(!showHandbag)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    showHandbag
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                  title="Toggle Designer Handbag (Image 2)"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Handbag</span>
                </button>
              </div>

              {/* Lighting Preset Buttons */}
              <div className="absolute bottom-6 left-6 z-10 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] text-stone-400 font-medium mr-1">Studio Light:</span>
                {(['studio', 'sunset', 'daylight', 'noir'] as const).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setLightingPreset(preset)}
                    className={`px-2 py-0.5 text-[11px] rounded-md capitalize transition-colors ${
                      lightingPreset === preset
                        ? 'bg-white/20 text-white font-semibold'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Photorealistic High-End VTON Render Studio */
            <div className="relative w-full h-full p-8 flex items-center justify-center bg-[#0F0F14]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl h-full items-center">
                {/* Front Angle VTON Card */}
                <div className="relative h-[540px] rounded-2xl overflow-hidden border border-white/15 bg-black/50 shadow-2xl flex flex-col group">
                  <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/80 text-black">
                    Front View (0°)
                  </div>
                  <div className="relative flex-1 w-full bg-stone-900/60 overflow-hidden flex items-center justify-center">
                    {/* Model Base Silhouette with Active Outfits composed */}
                    <img
                      src={
                        activeDress
                          ? normalizeImageUrl(activeDress.imageUrl)
                          : activeTop
                          ? normalizeImageUrl(activeTop.imageUrl)
                          : 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80'
                      }
                      alt="Front Angle Virtual Try-on"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                  </div>
                  <div className="p-3 bg-black/70 border-t border-white/10 text-xs">
                    <p className="font-medium text-white truncate">
                      {activeDress?.name || activeTop?.name || 'Curated Ensemble'}
                    </p>
                    <p className="text-[11px] text-stone-400">Front drape & chest silhouette</p>
                  </div>
                </div>

                {/* 3/4 Perspective VTON Card */}
                <div className="relative h-[540px] rounded-2xl overflow-hidden border border-amber-500/40 bg-black/50 shadow-2xl flex flex-col group ring-1 ring-amber-500/20">
                  <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500 text-black">
                    3/4 Angle (Hero View)
                  </div>
                  <div className="relative flex-1 w-full bg-stone-900/60 overflow-hidden flex items-center justify-center">
                    <img
                      src={
                        activeBottom
                          ? normalizeImageUrl(activeBottom.imageUrl)
                          : activeDress
                          ? normalizeImageUrl(activeDress.imageUrl)
                          : 'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?auto=format&fit=crop&w=600&q=80'
                      }
                      alt="Three quarter angle try on"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                  </div>
                  <div className="p-3 bg-black/70 border-t border-white/10 text-xs">
                    <p className="font-medium text-amber-300 truncate">
                      {activeBottom?.name || 'Tonal Pairing'}
                    </p>
                    <p className="text-[11px] text-stone-400">Natural posture, hips & movement</p>
                  </div>
                </div>

                {/* Back Silhouette VTON Card */}
                <div className="relative h-[540px] rounded-2xl overflow-hidden border border-white/15 bg-black/50 shadow-2xl flex flex-col group">
                  <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-[10px] font-bold bg-stone-800 text-stone-300 border border-white/20">
                    Back Profile (180°)
                  </div>
                  <div className="relative flex-1 w-full bg-stone-900/60 overflow-hidden flex items-center justify-center">
                    <img
                      src={
                        activeOuter
                          ? normalizeImageUrl(activeOuter.imageUrl)
                          : activeDress
                          ? normalizeImageUrl(activeDress.imageUrl)
                          : 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=600&q=80'
                      }
                      alt="Back profile try on"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                  </div>
                  <div className="p-3 bg-black/70 border-t border-white/10 text-xs">
                    <p className="font-medium text-white truncate">
                      {activeOuter?.name || 'Back Shoulder Line'}
                    </p>
                    <p className="text-[11px] text-stone-400">Back drape, hem & shoulder seam</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Active Garments In This Look & Live Styling Notes */}
        <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-white/10 bg-[#111117]/95 p-6 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <h3 className="font-serif text-sm font-bold text-white tracking-wide uppercase">
                  Worn Layers ({[activeTop, activeBottom, activeDress, activeOuter, activeFootwear, activeAccessory].filter(Boolean).length})
                </h3>
              </div>
              {currentOutfit && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {currentOutfit.matchScore}% Match
                </span>
              )}
            </div>

            {/* Garment Cards being worn */}
            <div className="space-y-3">
              {/* TOP */}
              {activeTop && (
                <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/30 transition-colors">
                  <img
                    src={normalizeImageUrl(activeTop.imageUrl)}
                    alt={activeTop.name}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-xl object-cover border border-white/10"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-amber-400">Top</span>
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-white/20"
                        style={{ backgroundColor: activeTop.colorHex }}
                      />
                    </div>
                    <p className="text-xs font-semibold text-white truncate">{activeTop.name}</p>
                    <p className="text-[11px] text-stone-400 truncate">{activeTop.material}</p>
                  </div>
                  <button
                    onClick={() => onRemoveGarment('top')}
                    className="text-stone-500 hover:text-rose-400 text-xs px-2 py-1"
                    title="Remove top"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* BOTTOM */}
              {activeBottom && (
                <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/30 transition-colors">
                  <img
                    src={normalizeImageUrl(activeBottom.imageUrl)}
                    alt={activeBottom.name}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-xl object-cover border border-white/10"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-amber-400">Bottom</span>
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-white/20"
                        style={{ backgroundColor: activeBottom.colorHex }}
                      />
                    </div>
                    <p className="text-xs font-semibold text-white truncate">{activeBottom.name}</p>
                    <p className="text-[11px] text-stone-400 truncate">{activeBottom.material}</p>
                  </div>
                  <button
                    onClick={() => onRemoveGarment('bottom')}
                    className="text-stone-500 hover:text-rose-400 text-xs px-2 py-1"
                    title="Remove bottom"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* DRESS */}
              {activeDress && (
                <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/30 transition-colors">
                  <img
                    src={normalizeImageUrl(activeDress.imageUrl)}
                    alt={activeDress.name}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-xl object-cover border border-white/10"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-amber-400">Dress</span>
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-white/20"
                        style={{ backgroundColor: activeDress.colorHex }}
                      />
                    </div>
                    <p className="text-xs font-semibold text-white truncate">{activeDress.name}</p>
                    <p className="text-[11px] text-stone-400 truncate">{activeDress.material}</p>
                  </div>
                  <button
                    onClick={() => onRemoveGarment('dress')}
                    className="text-stone-500 hover:text-rose-400 text-xs px-2 py-1"
                    title="Remove dress"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* OUTERWEAR */}
              {activeOuter && (
                <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/30 transition-colors">
                  <img
                    src={normalizeImageUrl(activeOuter.imageUrl)}
                    alt={activeOuter.name}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-xl object-cover border border-white/10"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-amber-400">Outerwear</span>
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-white/20"
                        style={{ backgroundColor: activeOuter.colorHex }}
                      />
                    </div>
                    <p className="text-xs font-semibold text-white truncate">{activeOuter.name}</p>
                    <p className="text-[11px] text-stone-400 truncate">{activeOuter.material}</p>
                  </div>
                  <button
                    onClick={() => onRemoveGarment('outerwear')}
                    className="text-stone-500 hover:text-rose-400 text-xs px-2 py-1"
                    title="Remove outerwear"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* FOOTWEAR */}
              {activeFootwear && (
                <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/30 transition-colors">
                  <img
                    src={normalizeImageUrl(activeFootwear.imageUrl)}
                    alt={activeFootwear.name}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-xl object-cover border border-white/10"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-amber-400">Footwear</span>
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-white/20"
                        style={{ backgroundColor: activeFootwear.colorHex }}
                      />
                    </div>
                    <p className="text-xs font-semibold text-white truncate">{activeFootwear.name}</p>
                    <p className="text-[11px] text-stone-400 truncate">{activeFootwear.subcategory}</p>
                  </div>
                  <button
                    onClick={() => onRemoveGarment('footwear')}
                    className="text-stone-500 hover:text-rose-400 text-xs px-2 py-1"
                    title="Remove footwear"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* ACCESSORY */}
              {activeAccessory && (
                <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/30 transition-colors">
                  <img
                    src={normalizeImageUrl(activeAccessory.imageUrl)}
                    alt={activeAccessory.name}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-xl object-cover border border-white/10"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-amber-400">Accessory</span>
                    </div>
                    <p className="text-xs font-semibold text-white truncate">{activeAccessory.name}</p>
                    <p className="text-[11px] text-stone-400 truncate">{activeAccessory.subcategory}</p>
                  </div>
                  <button
                    onClick={() => onRemoveGarment('accessory')}
                    className="text-stone-500 hover:text-rose-400 text-xs px-2 py-1"
                    title="Remove accessory"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Reference Showcase Ensemble Callout (Image 2 look active) */}
              {[activeTop, activeBottom, activeDress, activeOuter, activeFootwear, activeAccessory].filter(Boolean).length === 0 && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-stone-900/60 to-black/80 border border-amber-500/30 text-left space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Reference Look (Image 2)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                      Haute Boutique
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Teal Silk Pleated Wrap Dress</h4>
                    <p className="text-[11px] text-stone-300 leading-relaxed mt-0.5">
                      Styled with crossover V-neck bodice, 40 accordion pleats, cinched black leather belt, stiletto heels, and designer handbag.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-stone-400">Ready to style your own?</span>
                    <button
                      onClick={() => onSelectAlternative('wardrobe')}
                      className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-bold uppercase tracking-wider transition-colors shrink-0"
                    >
                      Browse Wardrobe
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Stylist Rationale Box */}
            {currentOutfit?.stylistNote && (
              <div className="mt-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Stylist Assessment
                </div>
                <p className="text-stone-300 leading-relaxed text-[11px]">
                  {currentOutfit.stylistNote}
                </p>
                {currentOutfit.weatherAppropriate && (
                  <p className="mt-2 text-[10px] text-amber-300/80 font-medium">
                    ☀️ {currentOutfit.weatherAppropriate}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs text-stone-400 font-mono">Real-time 3D Shader</span>
            <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Draper Engine
            </div>
          </div>
        </div>
      </div>

      {/* Customize Body Modal Popover */}
      {showBodyModal && (
        <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#161620] border border-white/15 rounded-3xl p-6 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif text-base font-bold text-white">Your Figure & Proportions</h3>
              </div>
              <button
                onClick={() => setShowBodyModal(false)}
                className="text-stone-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 my-5">
              {/* Build Type */}
              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-2">Body Silhouette</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['slim', 'athletic', 'curvy', 'regular'] as const).map((build) => (
                    <button
                      key={build}
                      onClick={() => setBodySettings({ ...bodySettings, build })}
                      className={`py-2 rounded-xl text-xs capitalize font-medium border transition-all ${
                        bodySettings.build === build
                          ? 'bg-amber-500 text-black font-bold border-amber-400'
                          : 'bg-white/5 text-stone-300 border-white/10 hover:border-white/20'
                      }`}
                    >
                      {build}
                    </button>
                  ))}
                </div>
              </div>

              {/* Height Slider */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-stone-300 mb-1.5">
                  <span>Height</span>
                  <span className="text-amber-400 font-mono">{bodySettings.height} cm</span>
                </div>
                <input
                  type="range"
                  min="150"
                  max="195"
                  value={bodySettings.height}
                  onChange={(e) => setBodySettings({ ...bodySettings, height: Number(e.target.value) })}
                  className="w-full accent-amber-500 bg-stone-800 rounded-lg h-2 cursor-pointer"
                />
              </div>

              {/* Skin Tone */}
              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-2">Skin Complexion</label>
                <div className="flex items-center gap-2.5">
                  {[
                    { hex: '#FAD8C0', label: 'Fair' },
                    { hex: '#E0AC69', label: 'Warm Honey' },
                    { hex: '#C68642', label: 'Golden Olive' },
                    { hex: '#8D5524', label: 'Rich Bronze' },
                    { hex: '#3B2219', label: 'Deep Espresso' },
                  ].map((tone) => (
                    <button
                      key={tone.hex}
                      onClick={() => setBodySettings({ ...bodySettings, skinTone: tone.hex })}
                      title={tone.label}
                      className={`w-9 h-9 rounded-full border-2 transition-transform ${
                        bodySettings.skinTone === tone.hex
                          ? 'border-amber-400 scale-110 shadow-lg'
                          : 'border-white/20 hover:scale-105'
                      }`}
                      style={{ backgroundColor: tone.hex }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowBodyModal(false)}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider transition-colors shadow-lg"
            >
              Apply Body Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
