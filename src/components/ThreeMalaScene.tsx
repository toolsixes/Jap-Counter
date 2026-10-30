import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ensureSafeContext } from '../services/webglPolyfill';

import { BeadMaterial } from '../types/jaap';

interface ThreeMalaSceneProps {
  currentBead: number; // 0 to 108
  totalChants: number;
  onTapBead?: () => void;
  accentColor?: string;
  isCompleted?: boolean;
  beadMaterial?: BeadMaterial;
  colorTheme?: string;
}

/**
 * Procedural texture generator for authentic carved Rudraksha / Sandalwood finish.
 * Zero external 404 dependencies!
 */
function createProceduralBeadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#6E381A';
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 300; i++) {
    const y = Math.random() * 256;
    const h = 1 + Math.random() * 3;
    const alpha = 0.08 + Math.random() * 0.18;
    ctx.fillStyle = Math.random() > 0.5 ? `rgba(40, 18, 8, ${alpha})` : `rgba(145, 80, 40, ${alpha})`;
    ctx.fillRect(0, y, 256, h);
  }

  for (let m = 0; m < 5; m++) {
    const x = (m * (256 / 5)) + 12;
    ctx.fillStyle = 'rgba(25, 10, 5, 0.45)';
    ctx.fillRect(x - 2, 0, 4, 256);
    ctx.fillStyle = 'rgba(180, 105, 55, 0.25)';
    ctx.fillRect(x + 2, 0, 2, 256);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Procedural radial contact shadow texture
 */
function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
  gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.25)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  return new THREE.CanvasTexture(canvas);
}

/**
 * 2D Tactile Procedural Japamala Strand Fallback
 * Used when WebGL is disabled or unsupported.
 * Renders ONLY the 108 rotating beads, golden spacer markers, and Sumeru Guru tassel.
 * Keeps the center (r < 80px) 100% empty so the overlaid center counter badge displays cleanly.
 */
const Tactile2DMalaFallback: React.FC<{
  currentBead: number;
  onTapBead?: () => void;
  isCompleted?: boolean;
  beadMaterial?: BeadMaterial;
}> = ({ currentBead, onTapBead, isCompleted, beadMaterial = 'rudraksha' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentAngleRef = useRef(0);
  const targetAngleRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId = 0;
    let lastTime = performance.now();

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = 340;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const animate = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const activeIdx = Math.max(0, (currentBead - 1) % 108);
      targetAngleRef.current = -(activeIdx / 108) * Math.PI * 2;

      const blend = 1 - Math.exp(-6 * dt);
      currentAngleRef.current += (targetAngleRef.current - currentAngleRef.current) * blend;
      if (isCompleted) {
        currentAngleRef.current += 0.02;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

      const centerX = size / 2;
      const centerY = size / 2;
      const radiusX = 135;
      const radiusY = 125;

      // Continuous sacred thread loop
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.strokeStyle = '#83280B';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // 108 Beads
      for (let i = 0; i < 108; i++) {
        const angle = (i / 108) * Math.PI * 2 + Math.PI / 2 + currentAngleRef.current;
        const x = centerX + Math.cos(angle) * radiusX;
        const y = centerY + Math.sin(angle) * radiusY;

        const isQuarter = (i + 1) % 27 === 0;
        const isActive = i === activeIdx && currentBead > 0;

        ctx.beginPath();
        if (isActive) {
          // Glowing active bead
          ctx.arc(x, y, 7.5, 0, Math.PI * 2);
          ctx.fillStyle = '#FFA726';
          ctx.shadowColor = '#FF9800';
          ctx.shadowBlur = 12;
          ctx.fill();
          ctx.shadowBlur = 0;

          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#FFF8E1';
          ctx.fill();
        } else if (isQuarter) {
          // Golden spacer bead
          ctx.arc(x, y, 5.5, 0, Math.PI * 2);
          ctx.fillStyle = '#F59E0B';
          ctx.shadowColor = '#D97706';
          ctx.shadowBlur = 4;
          ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          // Dynamic bead material color
          const beadColor =
            beadMaterial === 'tulsi' ? '#3A2B1D' :
            beadMaterial === 'sandalwood' ? '#D4A066' :
            beadMaterial === 'sphatik' ? '#E2E8F0' :
            beadMaterial === 'gold' ? '#F59E0B' : '#6D381A';

          ctx.arc(x, y, 4.2, 0, Math.PI * 2);
          ctx.fillStyle = beadColor;
          ctx.fill();
          ctx.strokeStyle = '#2A1509';
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      // Sumeru Guru Bead at the bottom
      const guruAngle = Math.PI / 2 + currentAngleRef.current;
      const gx = centerX + Math.cos(guruAngle) * (radiusX + 4);
      const gy = centerY + Math.sin(guruAngle) * (radiusY + 4);

      // Large Sumeru bead
      ctx.beginPath();
      ctx.arc(gx, gy, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#5A2D14';
      ctx.fill();
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Golden Calyx cap
      ctx.beginPath();
      ctx.arc(gx, gy + 3, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#F59E0B';
      ctx.fill();

      // Saffron Tassel
      ctx.beginPath();
      ctx.moveTo(gx - 3, gy + 8);
      ctx.lineTo(gx + 3, gy + 8);
      ctx.lineTo(gx + 6, gy + 26);
      ctx.lineTo(gx - 6, gy + 26);
      ctx.closePath();
      ctx.fillStyle = '#EA580C';
      ctx.fill();

      ctx.restore();
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [currentBead, isCompleted]);

  return (
    <div
      onClick={onTapBead}
      className="relative w-full h-full flex items-center justify-center cursor-pointer select-none touch-manipulation"
      title="Tap anywhere to chant"
    >
      <canvas ref={canvasRef} className="block pointer-events-none" />
    </div>
  );
};

export const ThreeMalaScene: React.FC<ThreeMalaSceneProps> = ({
  currentBead,
  totalChants,
  onTapBead,
  accentColor = '#F59E0B',
  isCompleted = false,
  beadMaterial = 'rudraksha',
  colorTheme = '#F59E0B',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const beadCountRef = useRef(currentBead);
  const totalChantsRef = useRef(totalChants);
  const isCompletedRef = useRef(isCompleted);
  const [hasGlError, setHasGlError] = useState(false);

  beadCountRef.current = currentBead;
  totalChantsRef.current = totalChants;
  isCompletedRef.current = isCompleted;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect and initialize WebGL safely
    const canvas = document.createElement('canvas');
    let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;

    try {
      gl = (canvas.getContext('webgl2', { alpha: true, antialias: true }) ||
            canvas.getContext('webgl', { alpha: true, antialias: true }) ||
            canvas.getContext('experimental-webgl', { alpha: true })) as any;
    } catch {
      gl = null;
    }

    if (!gl) {
      setHasGlError(true);
      return;
    }

    // Apply safe precision override directly to context instance
    ensureSafeContext(gl);

    let isSoftwareGl = false;
    try {
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } catch {
      isSoftwareGl = false;
    }

    const width = container.clientWidth || 340;
    const height = container.clientHeight || 340;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 5.2, 5.8);
    camera.lookAt(0, -0.2, 0);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        context: gl,
        alpha: true,
        antialias: !isSoftwareGl,
        powerPreference: 'default',
        precision: 'mediump',
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.25;
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height);
      renderer.shadowMap.enabled = !isSoftwareGl;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(canvas);
    } catch (glInitErr) {
      console.warn('WebGL init failed on device, using procedural fallback:', glInitErr);
      setHasGlError(true);
      return;
    }

    // Studio 3-Point Lighting Rig (Warm Devotional Temple Glow)
    const keyLight = new THREE.DirectionalLight('#FFF3DC', 3.0);
    keyLight.position.set(3.5, 6.0, 3.0);
    keyLight.castShadow = !isSoftwareGl;
    if (keyLight.shadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight('#FFECC4', '#0F121C', 1.3);
    scene.add(hemiLight);

    const rimLight = new THREE.PointLight('#FBBF24', 2.4, 10);
    rimLight.position.set(-3.0, 3.5, -2.5);
    scene.add(rimLight);

    // Contact Shadow Grounding
    const shadowTex = createContactShadowTexture();
    const shadowGeo = new THREE.PlaneGeometry(6.2, 6.2);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.55,
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.68;
    scene.add(shadowPlane);

    // ROOT JAPAMALA GROUP
    const malaRoot = new THREE.Group();
    scene.add(malaRoot);

    const beadTexture = createProceduralBeadTexture();
    beadTexture.anisotropy = renderer.capabilities?.getMaxAnisotropy?.() || 1;

    // Bead material tailored to selected Mala track
    let primaryBeadMat: THREE.Material;
    if (beadMaterial === 'tulsi') {
      primaryBeadMat = new THREE.MeshStandardMaterial({
        color: 0x3A2B1D,
        map: beadTexture,
        roughness: 0.55,
        metalness: 0.08,
      });
    } else if (beadMaterial === 'sandalwood') {
      primaryBeadMat = new THREE.MeshStandardMaterial({
        color: 0xD4A066,
        roughness: 0.42,
        metalness: 0.05,
      });
    } else if (beadMaterial === 'sphatik') {
      primaryBeadMat = new THREE.MeshStandardMaterial({
        color: 0xE2E8F0,
        roughness: 0.15,
        metalness: 0.35,
      });
    } else if (beadMaterial === 'gold') {
      primaryBeadMat = new THREE.MeshStandardMaterial({
        color: 0xF59E0B,
        roughness: 0.22,
        metalness: 0.88,
      });
    } else {
      primaryBeadMat = new THREE.MeshStandardMaterial({
        map: beadTexture,
        roughness: 0.65,
        metalness: 0.12,
        bumpMap: beadTexture,
        bumpScale: 0.04,
      });
    }

    // Gold spacer material for quarterly beads (27, 54, 81, 108)
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xF59E0B,
      roughness: 0.22,
      metalness: 0.88,
    });

    // Active bead glowing accent material
    const activeBeadMat = new THREE.MeshStandardMaterial({
      color: 0xFF9F1C,
      emissive: 0xEA580C,
      emissiveIntensity: 0.85,
      roughness: 0.35,
      metalness: 0.4,
    });

    // Silk thread material
    const threadMat = new THREE.MeshStandardMaterial({
      color: 0xC2410C,
      roughness: 0.85,
      metalness: 0.05,
    });

    // 1. Rosary Loop Geometry (108 beads)
    const BEAD_COUNT = 108;
    const RADIUS_X = 2.05;
    const RADIUS_Z = 1.95;

    const beadMeshes: THREE.Mesh[] = [];
    const beadGeometry = new THREE.SphereGeometry(0.088, 16, 14);
    beadGeometry.scale(1.0, 0.86, 1.0);

    const spacerGeometry = new THREE.CylinderGeometry(0.055, 0.055, 0.04, 12);

    for (let i = 0; i < BEAD_COUNT; i++) {
      const angle = (i / BEAD_COUNT) * Math.PI * 2 + Math.PI / 2;
      const x = Math.cos(angle) * RADIUS_X;
      const z = Math.sin(angle) * RADIUS_Z;
      const y = Math.sin(angle * 2) * 0.08;

      const isQuarter = (i + 1) % 27 === 0;
      const bead = new THREE.Mesh(beadGeometry, isQuarter ? goldMat : primaryBeadMat);
      bead.position.set(x, y, z);
      bead.castShadow = !isSoftwareGl;
      bead.receiveShadow = !isSoftwareGl;

      const spacer = new THREE.Mesh(spacerGeometry, goldMat);
      spacer.position.set(x, y, z);
      spacer.lookAt(0, y, 0);

      malaRoot.add(bead);
      beadMeshes.push(bead);
    }

    // 2. Continuous sacred thread running through the beads
    const curvePoints: THREE.Vector3[] = [];
    for (let i = 0; i <= BEAD_COUNT; i++) {
      const angle = (i / BEAD_COUNT) * Math.PI * 2 + Math.PI / 2;
      curvePoints.push(
        new THREE.Vector3(
          Math.cos(angle) * RADIUS_X,
          Math.sin(angle * 2) * 0.08,
          Math.sin(angle) * RADIUS_Z
        )
      );
    }
    const threadCurve = new THREE.CatmullRomCurve3(curvePoints, true);
    const threadGeo = new THREE.TubeGeometry(threadCurve, 120, 0.012, 6, true);
    const threadMesh = new THREE.Mesh(threadGeo, threadMat);
    malaRoot.add(threadMesh);

    // 3. Guru Bead (Sumeru) & Sacred Tassel Assembly
    const guruGroup = new THREE.Group();
    guruGroup.position.set(0, 0.08, RADIUS_Z + 0.12);

    const meruGeo = new THREE.SphereGeometry(0.14, 20, 18);
    meruGeo.scale(1.0, 0.9, 1.0);
    const meruBead = new THREE.Mesh(meruGeo, primaryBeadMat);
    meruBead.castShadow = !isSoftwareGl;
    guruGroup.add(meruBead);

    const crownGeo = new THREE.ConeGeometry(0.11, 0.14, 16);
    crownGeo.rotateX(Math.PI);
    crownGeo.translate(0, 0.14, 0);
    const crownMesh = new THREE.Mesh(crownGeo, goldMat);
    crownMesh.castShadow = !isSoftwareGl;
    guruGroup.add(crownMesh);

    const ringGeo = new THREE.TorusGeometry(0.07, 0.02, 12, 24);
    ringGeo.rotateX(Math.PI / 2);
    ringGeo.translate(0, 0.22, 0);
    const ringMesh = new THREE.Mesh(ringGeo, goldMat);
    guruGroup.add(ringMesh);

    const tasselConeGeo = new THREE.ConeGeometry(0.09, 0.35, 14);
    tasselConeGeo.translate(0, 0.38, 0);
    const tasselMat = new THREE.MeshStandardMaterial({
      color: 0xEA580C,
      roughness: 0.75,
      metalness: 0.1,
    });
    const tasselMesh = new THREE.Mesh(tasselConeGeo, tasselMat);
    guruGroup.add(tasselMesh);

    const tasselBandGeo = new THREE.CylinderGeometry(0.085, 0.085, 0.03, 16);
    tasselBandGeo.translate(0, 0.28, 0);
    const tasselBand = new THREE.Mesh(tasselBandGeo, goldMat);
    guruGroup.add(tasselBand);

    guruGroup.rotation.x = Math.PI * 0.45;
    malaRoot.add(guruGroup);

    // 4. Subtle ambient sacred floating dust particles
    const particleCount = isSoftwareGl ? 20 : 50;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let p = 0; p < particleCount; p++) {
      particlePositions[p * 3] = (Math.random() - 0.5) * 6;
      particlePositions[p * 3 + 1] = Math.random() * 3 - 0.5;
      particlePositions[p * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xFBBF24,
      size: 0.035,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Drag to rotate mala
    let isDragging = false;
    let prevPointerX = 0;
    let targetRotationY = 0;
    let currentRotationY = 0;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      isDragging = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      prevPointerX = clientX;
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const deltaX = clientX - prevPointerX;
      prevPointerX = clientX;
      targetRotationY += deltaX * 0.008;
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    canvas.addEventListener('mousedown', onPointerDown);
    canvas.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    canvas.addEventListener('touchstart', onPointerDown, { passive: true });
    canvas.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 340;
      const h = container.clientHeight || 340;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    let frameId = 0;
    let lastTime = performance.now();
    let prevBeadIndex = -1;

    const animate = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const currentBeadVal = beadCountRef.current;
      const activeIdx = Math.max(0, (currentBeadVal - 1) % BEAD_COUNT);

      if (activeIdx !== prevBeadIndex) {
        if (prevBeadIndex >= 0 && prevBeadIndex < BEAD_COUNT && beadMeshes[prevBeadIndex]) {
          const wasQuarter = (prevBeadIndex + 1) % 27 === 0;
          beadMeshes[prevBeadIndex].material = wasQuarter ? goldMat : primaryBeadMat;
          beadMeshes[prevBeadIndex].scale.set(1.0, 0.86, 1.0);
        }

        if (currentBeadVal > 0 && activeIdx < BEAD_COUNT && beadMeshes[activeIdx]) {
          beadMeshes[activeIdx].material = activeBeadMat;
          beadMeshes[activeIdx].scale.set(1.22, 1.08, 1.22);
        }
        prevBeadIndex = activeIdx;

        if (!isDragging) {
          targetRotationY = -(activeIdx / BEAD_COUNT) * Math.PI * 2;
        }
      }

      const blend = 1 - Math.exp(-6.0 * dt);
      currentRotationY += (targetRotationY - currentRotationY) * blend;
      malaRoot.rotation.y = currentRotationY;

      // Meditative breathing oscillation
      const breathTime = currentTime * 0.001;
      malaRoot.rotation.x = Math.sin(breathTime * 0.8) * 0.035;
      malaRoot.position.y = Math.sin(breathTime * 1.2) * 0.02;

      if (isCompletedRef.current) {
        malaRoot.rotation.y += 0.015;
      }

      if (particleGeo.attributes.position) {
        const positions = particleGeo.attributes.position.array as Float32Array;
        for (let p = 0; p < particleCount; p++) {
          positions[p * 3 + 1] += 0.0015;
          if (positions[p * 3 + 1] > 2.5) {
            positions[p * 3 + 1] = -0.5;
          }
        }
        particleGeo.attributes.position.needsUpdate = true;
      }

      try {
        renderer.render(scene, camera);
      } catch {
        // safe catch
      }

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();

      canvas.removeEventListener('mousedown', onPointerDown);
      canvas.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      canvas.removeEventListener('touchstart', onPointerDown);
      canvas.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);

      beadGeometry.dispose();
      spacerGeometry.dispose();
      threadGeo.dispose();
      meruGeo.dispose();
      crownGeo.dispose();
      ringGeo.dispose();
      tasselConeGeo.dispose();
      tasselBandGeo.dispose();
      shadowGeo.dispose();
      particleGeo.dispose();

      beadTexture.dispose();
      shadowTex.dispose();
      primaryBeadMat.dispose();
      goldMat.dispose();
      activeBeadMat.dispose();
      threadMat.dispose();
      tasselMat.dispose();
      shadowMat.dispose();
      particleMat.dispose();

      renderer.dispose();
      if (container.contains(canvas)) {
        container.removeChild(canvas);
      }
    };
  }, []);

  if (hasGlError) {
    return (
      <Tactile2DMalaFallback
        currentBead={currentBead}
        onTapBead={onTapBead}
        isCompleted={isCompleted}
        beadMaterial={beadMaterial}
      />
    );
  }

  return (
    <div
      ref={mountRef}
      onClick={onTapBead}
      className="relative w-full h-full flex items-center justify-center cursor-pointer select-none touch-manipulation"
      title="Tap to advance bead or drag to rotate mala"
    />
  );
};
