import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OutfitPair, Garment, ModelBodySettings } from '../types';
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
  Shirt
} from 'lucide-react';

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

  // Three.js instances ref
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
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

  // Initialize Three.js Scene
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0e0e14);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.4, 3.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    // Setup Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff6e8, 1.4);
    keyLight.position.set(3, 4, 3);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xb4c6e7, 0.7);
    fillLight.position.set(-3, 2, 2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xd4af37, 1.2);
    rimLight.position.set(0, 3, -3);
    scene.add(rimLight);

    // Platform / Runway turntable
    const platformGeo = new THREE.CylinderGeometry(1.2, 1.25, 0.08, 64);
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0x181822,
      roughness: 0.3,
      metalness: 0.8,
    });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.y = -0.04;
    platform.receiveShadow = true;
    scene.add(platform);

    // Glowing rim for turntable
    const ringGeo = new THREE.RingGeometry(1.18, 1.21, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xd4af37, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.002;
    scene.add(ring);

    // Model Group
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    // Animation Loop
    let angleDegrees = 0;
    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);

      if (modelGroupRef.current) {
        if (isAutoRotating && !isDraggingRef.current) {
          modelGroupRef.current.rotation.y += 0.006;
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

  // Update Model Geometry and Garments whenever body settings or outfit changes
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

    const widthScale = isSlim ? 0.9 : isCurvy ? 1.15 : isAthletic ? 1.08 : 1.0;
    const hipsScale = isCurvy ? 1.25 : isSlim ? 0.92 : 1.05;

    // Skin Material
    const skinMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(bodySettings.skinTone),
      roughness: 0.65,
      metalness: 0.05,
    });

    // --- MANNEQUIN BODY PARTS ---
    // Head
    const headGeo = new THREE.SphereGeometry(0.12 * heightFactor, 32, 32);
    headGeo.scale(0.85, 1.1, 0.9);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.95 * heightFactor;
    head.castShadow = true;
    group.add(head);

    // Neck
    const neckGeo = new THREE.CylinderGeometry(0.045, 0.055, 0.12, 24);
    const neck = new THREE.Mesh(neckGeo, skinMat);
    neck.position.y = 1.82 * heightFactor;
    group.add(neck);

    // Texture Loader for real fabric mapping
    const textureLoader = new THREE.TextureLoader();

    // Determine Dress properties
    let dressTexture: THREE.Texture | undefined = undefined;
    if (activeDress?.imageUrl) {
      try {
        dressTexture = textureLoader.load(activeDress.imageUrl);
        dressTexture.wrapS = THREE.RepeatWrapping;
        dressTexture.wrapT = THREE.RepeatWrapping;
      } catch (err) {
        console.warn('Could not load dress texture', err);
      }
    }

    let dressColorHex = activeDress?.colorHex;
    // Smart fallback if dress name contains explicit color
    if (activeDress) {
      const lowerName = (activeDress.name + ' ' + activeDress.subcategory).toLowerCase();
      if (lowerName.includes('pink') && (!dressColorHex || dressColorHex === '#C5A059' || dressColorHex === '#ffffff' || dressColorHex === '#F8F6F0')) {
        dressColorHex = '#E879F9';
      } else if (lowerName.includes('black') && (!dressColorHex || dressColorHex === '#C5A059')) {
        dressColorHex = '#1E1E24';
      } else if (lowerName.includes('red') && (!dressColorHex || dressColorHex === '#C5A059')) {
        dressColorHex = '#E11D48';
      } else if (lowerName.includes('blue') && (!dressColorHex || dressColorHex === '#C5A059')) {
        dressColorHex = '#2563EB';
      } else if (!dressColorHex) {
        dressColorHex = '#E88B9E';
      }
    }

    const dressMat = new THREE.MeshStandardMaterial({
      color: dressColorHex ? new THREE.Color(dressColorHex) : new THREE.Color(0xE879F9),
      map: dressTexture,
      roughness: activeDress?.material.includes('Silk') ? 0.25 : 0.55,
      metalness: 0.08,
      side: THREE.DoubleSide,
    });

    // Determine Top properties
    let topTexture: THREE.Texture | undefined = undefined;
    if (activeTop?.imageUrl) {
      try {
        topTexture = textureLoader.load(activeTop.imageUrl);
        topTexture.wrapS = THREE.RepeatWrapping;
        topTexture.wrapT = THREE.RepeatWrapping;
      } catch (err) {
        console.warn('Could not load top texture', err);
      }
    }

    let topColor = activeTop?.colorHex;
    const topMat = activeDress
      ? dressMat
      : topColor
      ? new THREE.MeshStandardMaterial({
          color: new THREE.Color(topColor),
          map: topTexture,
          roughness: activeTop?.material.includes('Silk') ? 0.25 : 0.7,
          metalness: 0.05,
        })
      : new THREE.MeshStandardMaterial({
          color: new THREE.Color(0x22222A),
          roughness: 0.8,
        });

    // Torso / Chest
    const chestGeo = new THREE.CylinderGeometry(0.18 * widthScale, 0.14 * widthScale, 0.35, 32);
    chestGeo.scale(1, 1, 0.75);

    const chest = new THREE.Mesh(chestGeo, activeDress ? dressMat : topMat);
    chest.position.y = 1.6 * heightFactor;
    chest.castShadow = true;
    group.add(chest);

    // Shoulders & Arms
    const shoulderGeo = new THREE.SphereGeometry(0.07, 16, 16);
    const leftShoulder = new THREE.Mesh(shoulderGeo, activeDress ? dressMat : topMat);
    leftShoulder.position.set(0.24 * widthScale, 1.72 * heightFactor, 0);
    const rightShoulder = new THREE.Mesh(shoulderGeo, activeDress ? dressMat : topMat);
    rightShoulder.position.set(-0.24 * widthScale, 1.72 * heightFactor, 0);
    group.add(leftShoulder, rightShoulder);

    // Upper Arms
    const upperArmGeo = new THREE.CylinderGeometry(0.04, 0.038, 0.32, 16);
    const leftArm = new THREE.Mesh(upperArmGeo, activeDress ? dressMat : topMat);
    leftArm.position.set(0.27 * widthScale, 1.5 * heightFactor, 0);
    leftArm.rotation.z = -0.12;
    const rightArm = new THREE.Mesh(upperArmGeo, activeDress ? dressMat : topMat);
    rightArm.position.set(-0.27 * widthScale, 1.5 * heightFactor, 0);
    rightArm.rotation.z = 0.12;
    group.add(leftArm, rightArm);

    // Lower Arms (Forearm with Skin)
    const forearmGeo = new THREE.CylinderGeometry(0.035, 0.03, 0.3, 16);
    const leftForearm = new THREE.Mesh(forearmGeo, skinMat);
    leftForearm.position.set(0.32 * widthScale, 1.22 * heightFactor, 0.02);
    const rightForearm = new THREE.Mesh(forearmGeo, skinMat);
    rightForearm.position.set(-0.32 * widthScale, 1.22 * heightFactor, 0.02);
    group.add(leftForearm, rightForearm);

    // Waist / Pelvis
    const waistGeo = new THREE.CylinderGeometry(0.14 * widthScale, 0.19 * hipsScale, 0.28, 32);
    waistGeo.scale(1, 1, 0.8);

    // Bottom Garment Material
    let bottomColor = activeBottom?.colorHex;
    const bottomMat = activeDress
      ? dressMat
      : bottomColor
      ? new THREE.MeshStandardMaterial({
          color: new THREE.Color(bottomColor),
          roughness: 0.7,
          metalness: 0.05,
        })
      : new THREE.MeshStandardMaterial({
          color: new THREE.Color(0x1B1B22),
          roughness: 0.8,
        });

    const waist = new THREE.Mesh(waistGeo, activeDress ? dressMat : bottomMat);
    waist.position.y = 1.32 * heightFactor;
    waist.castShadow = true;
    group.add(waist);

    // If Dress is worn: Check if Bodycon vs Flared A-Line
    if (activeDress) {
      const lowerName = (activeDress.name + ' ' + activeDress.subcategory).toLowerCase();
      const isBodycon = lowerName.includes('bodycon') || lowerName.includes('fitted') || lowerName.includes('tight') || lowerName.includes('slip') || lowerName.includes('sheath');

      if (isBodycon) {
        // Fitted bodycon dress: curves around hips & hugs thighs down to knees!
        const bodyconGeo = new THREE.CylinderGeometry(
          0.18 * hipsScale,
          0.16 * widthScale,
          0.85 * heightFactor,
          32,
          1,
          true
        );
        bodyconGeo.scale(1.05, 1, 0.88);
        const bodyconMesh = new THREE.Mesh(bodyconGeo, dressMat);
        bodyconMesh.position.y = 1.05 * heightFactor;
        bodyconMesh.castShadow = true;
        group.add(bodyconMesh);
      } else {
        // Flared A-line silhouette
        const dressGeo = new THREE.ConeGeometry(0.44 * hipsScale, 0.85 * heightFactor, 32, 1, true);
        const dressMesh = new THREE.Mesh(dressGeo, dressMat);
        dressMesh.position.y = 0.95 * heightFactor;
        dressMesh.castShadow = true;
        group.add(dressMesh);
      }
    }

    // Legs / Pants (visible under dress hem or as pants)
    const legGeo = new THREE.CylinderGeometry(
      0.08 * hipsScale,
      0.06,
      0.85 * heightFactor,
      24
    );

    const legMat = activeDress ? skinMat : bottomMat;
    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(0.11 * widthScale, 0.78 * heightFactor, 0);
    leftLeg.castShadow = true;

    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(-0.11 * widthScale, 0.78 * heightFactor, 0);
    rightLeg.castShadow = true;
    group.add(leftLeg, rightLeg);

    // Outerwear Layer (Blazer or Coat if present)
    if (activeOuter) {
      const outerGeo = new THREE.CylinderGeometry(0.22 * widthScale, 0.24 * hipsScale, 0.7, 32, 1, true);
      outerGeo.scale(1.08, 1, 0.85);
      const outerMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(activeOuter.colorHex),
        roughness: 0.7,
        metalness: 0.1,
        side: THREE.DoubleSide,
      });
      const outerMesh = new THREE.Mesh(outerGeo, outerMat);
      outerMesh.position.y = 1.45 * heightFactor;
      group.add(outerMesh);
    }

    // Footwear / Shoes
    const shoeColor = activeFootwear?.colorHex || '#1C1C1E';
    const shoeMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(shoeColor),
      roughness: 0.4,
      metalness: 0.3,
    });
    const shoeGeo = new THREE.BoxGeometry(0.09, 0.08, 0.22);

    const leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
    leftShoe.position.set(0.11 * widthScale, 0.04, 0.03);
    leftShoe.castShadow = true;

    const rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
    rightShoe.position.set(-0.11 * widthScale, 0.04, 0.03);
    rightShoe.castShadow = true;
    group.add(leftShoe, rightShoe);

  }, [activeTop, activeBottom, activeDress, activeOuter, activeFootwear, bodySettings]);

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
                          ? activeDress.imageUrl
                          : activeTop
                          ? activeTop.imageUrl
                          : 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80'
                      }
                      alt="Front Angle Virtual Try-on"
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
                          ? activeBottom.imageUrl
                          : activeDress
                          ? activeDress.imageUrl
                          : 'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?auto=format&fit=crop&w=600&q=80'
                      }
                      alt="Three quarter angle try on"
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
                          ? activeOuter.imageUrl
                          : activeDress
                          ? activeDress.imageUrl
                          : 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=600&q=80'
                      }
                      alt="Back profile try on"
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
                    src={activeTop.imageUrl}
                    alt={activeTop.name}
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
                    src={activeBottom.imageUrl}
                    alt={activeBottom.name}
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
                    src={activeDress.imageUrl}
                    alt={activeDress.name}
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
                    src={activeOuter.imageUrl}
                    alt={activeOuter.name}
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
                    src={activeFootwear.imageUrl}
                    alt={activeFootwear.name}
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
                    src={activeAccessory.imageUrl}
                    alt={activeAccessory.name}
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

              {/* Empty Layers Callout */}
              {[activeTop, activeBottom, activeDress, activeOuter, activeFootwear, activeAccessory].filter(Boolean).length === 0 && (
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center space-y-2.5">
                  <Shirt className="w-8 h-8 text-amber-400/60 mx-auto" />
                  <p className="text-xs font-semibold text-white">Mannequin Ready to Style</p>
                  <p className="text-[11px] text-stone-400 leading-relaxed">
                    Select any piece or outfit from your Wardrobe to dress the 3D figure and view in 360°.
                  </p>
                  <button
                    onClick={() => onSelectAlternative('wardrobe')}
                    className="mt-2 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-bold uppercase tracking-wider transition-colors"
                  >
                    Browse Wardrobe
                  </button>
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
