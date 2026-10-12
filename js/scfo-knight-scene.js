/**
 * Asharq Al Awsat Group — SCFO-Inspired 3D Knight & Luminous Emblem Engine
 * 
 * Inspired by https://scfo.de/#start:
 * - Real-time WebGL 3D chess knight (assets/knight.glb)
 * - Glowing Asharq Al Awsat calligraphy emblem in the background with neon tube shader
 * - Living physics-based idle breathing, levitation, and dynamic studio rim lighting ("just moving")
 * - Mouse cursor tracking with spring-damped parallax look-at
 * - Interactive 360° drag-to-spin controls
 * - Multi-section scroll choreography synced with Lenis/GSAP ScrollTrigger
 * - Luxury material finish switcher (Obsidian Noir, Or Impérial 24K, Marbre Blanc)
 */

(function () {
  'use strict';

  // Wait for Three.js and GLTFLoader to be ready
  function initScene() {
    if (typeof THREE === 'undefined' || typeof THREE.GLTFLoader === 'undefined') {
      console.warn('Three.js or GLTFLoader not loaded yet, retrying...');
      setTimeout(initScene, 80);
      return;
    }

    const container = document.getElementById('scfo-3d-container');
    if (!container) {
      console.warn('scfo-3d-container element not found');
      return;
    }

    // 1. Scene & Renderer Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050607, 0.045);

    const camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 5.8);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const canvas = renderer.domElement;
    canvas.id = 'scfo-webgl-canvas';
    canvas.className = 'scfo-webgl-canvas';
    container.innerHTML = '';
    container.appendChild(canvas);

    // 2. Lighting System (Cinematic Studio Chiaroscuro + Colored Rim Lights)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambientLight);

    // Key front light (soft warm white)
    const keyLight = new THREE.DirectionalLight(0xfff5ea, 2.2);
    keyLight.position.set(-2.5, 3.5, 4.0);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    // Specular Rim Light 1 (Cool silver-blue rim from top-right)
    const rimLight1 = new THREE.DirectionalLight(0xd8e6ff, 3.8);
    rimLight1.position.set(3.2, 2.8, -2.5);
    scene.add(rimLight1);

    // Specular Rim Light 2 (Warm champagne gold rim from left-back)
    const rimLight2 = new THREE.DirectionalLight(0xffdfa8, 3.2);
    rimLight2.position.set(-3.5, -1.2, -2.8);
    scene.add(rimLight2);

    // Dynamic backlight from the logo onto the knight
    const logoBacklight = new THREE.PointLight(0xffeedd, 3.5, 8, 2);
    logoBacklight.position.set(0, 0.2, -0.4);
    scene.add(logoBacklight);

    // Moving orbiting light for living specular glints
    const glintLight = new THREE.PointLight(0xffffff, 1.8, 6, 2);
    glintLight.position.set(0, 2.0, 2.5);
    scene.add(glintLight);

    // 3. Background Luminous Emblem (Asharq Al Awsat Calligraphy Halo)
    const emblemGroup = new THREE.Group();
    scene.add(emblemGroup);
    emblemGroup.position.set(0, 0.05, -0.85);

    // Load Asharq Al Awsat emblem texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('assets/emblem_white.png', (texture) => {
      texture.encoding = THREE.sRGBEncoding;

      // Inner calligraphy glowing disc
      const discGeo = new THREE.PlaneGeometry(2.35, 2.35);
      const discMat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.92,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const discMesh = new THREE.Mesh(discGeo, discMat);
      discMesh.name = 'emblemDisc';
      emblemGroup.add(discMesh);

      // Outer luminous halo circle
      const haloGeo = new THREE.RingGeometry(1.22, 1.34, 64);
      const haloMat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(0xF0E4D2) },
          uOpacity: { value: 0.85 }
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform vec3 uColor;
          uniform float uOpacity;
          varying vec2 vUv;
          float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
          void main() {
            float flicker = 1.0 + (hash(vec2(floor(uTime * 22.0), 4.2)) - 0.5) * 0.035;
            float pulse = 0.95 + 0.08 * sin(uTime * 2.4);
            gl_FragColor = vec4(uColor * flicker * pulse, uOpacity);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      haloMesh.name = 'haloRing';
      emblemGroup.add(haloMesh);

      // Soft ambient radial glow sprite
      const glowGeo = new THREE.PlaneGeometry(4.2, 4.2);
      const canvasGlow = document.createElement('canvas');
      canvasGlow.width = 128;
      canvasGlow.height = 128;
      const ctxGlow = canvasGlow.getContext('2d');
      const radGrad = ctxGlow.createRadialGradient(64, 64, 0, 64, 64, 64);
      radGrad.addColorStop(0, 'rgba(255, 245, 230, 0.45)');
      radGrad.addColorStop(0.35, 'rgba(220, 195, 160, 0.18)');
      radGrad.addColorStop(0.7, 'rgba(180, 160, 140, 0.05)');
      radGrad.addColorStop(1, 'transparent');
      ctxGlow.fillStyle = radGrad;
      ctxGlow.fillRect(0, 0, 128, 128);

      const glowTex = new THREE.CanvasTexture(canvasGlow);
      const glowMat = new THREE.MeshBasicMaterial({
        map: glowTex,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      glowMesh.position.z = -0.05;
      emblemGroup.add(glowMesh);
    });

    // 4. Exclusive Obsidian Noir Material (SCFO Authentic Luxury Finish)
    const obsidianMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x101215),
      metalness: 0.90,
      roughness: 0.30,
      envMapIntensity: 1.0
    });

    // Secret Easter Egg: Adam Doukali Luxury Seal Medallion for Chess Knight Base
    function createAdamDoukaliSealTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      const cx = 512;
      const cy = 512;

      // 1. Deep Imperial Burgundy Base Disc
      const bgGrad = ctx.createRadialGradient(cx, cy, 40, cx, cy, 510);
      bgGrad.addColorStop(0, '#24080f');
      bgGrad.addColorStop(0.55, '#120306');
      bgGrad.addColorStop(1, '#050102');
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 510, 0, Math.PI * 2);
      ctx.fill();

      // 2. Royal Burgundy & Rose-Platinum Gradients
      const burgundyGrad = ctx.createLinearGradient(120, 120, 900, 900);
      burgundyGrad.addColorStop(0, '#f5bac5');
      burgundyGrad.addColorStop(0.25, '#c42340');
      burgundyGrad.addColorStop(0.5, '#7d0e1e');
      burgundyGrad.addColorStop(0.75, '#9e1b32');
      burgundyGrad.addColorStop(1, '#4a050d');

      const burgundyShine = ctx.createLinearGradient(0, 0, 1024, 0);
      burgundyShine.addColorStop(0, '#c42340');
      burgundyShine.addColorStop(0.5, '#ffe6ec');
      burgundyShine.addColorStop(1, '#6b0b17');

      // Outer Solid Bezel Ring
      ctx.strokeStyle = burgundyGrad;
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.arc(cx, cy, 492, 0, Math.PI * 2);
      ctx.stroke();

      // Milled Guilloché Teeth (144 notches)
      ctx.strokeStyle = 'rgba(196, 35, 64, 0.55)';
      ctx.lineWidth = 2.5;
      const teethCount = 144;
      for (let i = 0; i < teethCount; i++) {
        const a = (i / teethCount) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * 468, cy + Math.sin(a) * 468);
        ctx.lineTo(cx + Math.cos(a) * 484, cy + Math.sin(a) * 484);
        ctx.stroke();
      }

      // High-Polish Burgundy Ring
      ctx.strokeStyle = burgundyShine;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(cx, cy, 458, 0, Math.PI * 2);
      ctx.stroke();

      // Dotted Rose Pearl Ring (96 pearls)
      ctx.fillStyle = '#fad2dc';
      const pearlCount = 96;
      for (let i = 0; i < pearlCount; i++) {
        const a = (i / pearlCount) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * 440, cy + Math.sin(a) * 440, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Inner Border Ring for Text Track
      ctx.strokeStyle = 'rgba(196, 35, 64, 0.70)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 418, 0, Math.PI * 2);
      ctx.stroke();

      // Inner Text Boundary Ring
      ctx.beginPath();
      ctx.arc(cx, cy, 320, 0, Math.PI * 2);
      ctx.stroke();

      // Arc Typography: Top Arc (reads clockwise left-to-right at top)
      ctx.font = 'bold 26px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = burgundyShine;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      function drawTopArc(text, radius, spacing) {
        const chars = text.split('');
        const totalAngle = (chars.length - 1) * spacing;
        const startAngle = -Math.PI / 2 - (totalAngle / 2);
        chars.forEach((c, i) => {
          const angle = startAngle + i * spacing;
          const x = cx + Math.cos(angle) * radius;
          const y = cy + Math.sin(angle) * radius;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angle + Math.PI / 2);
          ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
          ctx.shadowBlur = 4;
          ctx.fillText(c, 0, 0);
          ctx.restore();
        });
      }

      // Arc Typography: Bottom Arc (reads left-to-right upright along bottom)
      function drawBottomArc(text, radius, spacing) {
        const chars = text.split('');
        const totalAngle = (chars.length - 1) * spacing;
        const startAngle = Math.PI / 2 + (totalAngle / 2);
        chars.forEach((c, i) => {
          const angle = startAngle - i * spacing;
          const x = cx + Math.cos(angle) * radius;
          const y = cy + Math.sin(angle) * radius;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angle - Math.PI / 2);
          ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
          ctx.shadowBlur = 4;
          ctx.fillText(c, 0, 0);
          ctx.restore();
        });
      }

      drawTopArc('★ MADE BY CLARODIG ★ CLARODIGI.COM ★', 368, 0.045);
      drawBottomArc('★ DESIGNED BY ADAM DOUKALI ★ 2026 ★', 368, 0.046);

      // Inner Medallion Circle
      ctx.strokeStyle = burgundyGrad;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, 302, 0, Math.PI * 2);
      ctx.stroke();

      function drawMedallionCenter(logoImage) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, 298, 0, Math.PI * 2);
        ctx.clip();

        // Dark rich burgundy radial fill
        const centerFill = ctx.createRadialGradient(cx, cy, 20, cx, cy, 298);
        centerFill.addColorStop(0, '#2b0912');
        centerFill.addColorStop(0.65, '#150307');
        centerFill.addColorStop(1, '#0a0103');
        ctx.fillStyle = centerFill;
        ctx.fill();

        // Redraw Sunburst Rays
        ctx.strokeStyle = 'rgba(196, 35, 64, 0.24)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 48; i++) {
          const a = (i / 48) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(a) * 65, cy + Math.sin(a) * 65);
          ctx.lineTo(cx + Math.cos(a) * 285, cy + Math.sin(a) * 285);
          ctx.stroke();
        }

        // Medallion Ambient Glow
        const logoGlow = ctx.createRadialGradient(cx, cy - 90, 10, cx, cy - 90, 160);
        logoGlow.addColorStop(0, 'rgba(196, 35, 64, 0.50)');
        logoGlow.addColorStop(0.5, 'rgba(158, 27, 50, 0.22)');
        logoGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = logoGlow;
        ctx.beginPath();
        ctx.arc(cx, cy - 90, 160, 0, Math.PI * 2);
        ctx.fill();

        // If official ClaroDigi brand logo loaded, render it
        if (logoImage && logoImage.complete && logoImage.naturalWidth > 0) {
          const logoW = 140;
          const logoH = 134;
          ctx.save();
          ctx.shadowColor = 'rgba(196, 35, 64, 0.95)';
          ctx.shadowBlur = 28;
          ctx.drawImage(logoImage, cx - logoW / 2, cy - 165, logoW, logoH);
          ctx.restore();
        } else {
          // Fallback monogram
          ctx.save();
          ctx.font = 'bold 88px "Cinzel", "Playfair Display", serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = burgundyGrad;
          ctx.shadowColor = 'rgba(196, 35, 64, 0.85)';
          ctx.shadowBlur = 24;
          ctx.fillText('CD', cx, cy - 95);
          ctx.restore();
        }

        // Divider Line with diamond
        ctx.strokeStyle = burgundyGrad;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx - 160, cy - 15);
        ctx.lineTo(cx + 160, cy - 15);
        ctx.stroke();

        ctx.fillStyle = '#f5bac5';
        ctx.font = '14px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('◆', cx, cy - 15);

        // Prominent Title: "CLARODIG"
        ctx.save();
        ctx.font = '900 52px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
        ctx.shadowBlur = 14;
        ctx.fillText('CLARODIG', cx, cy + 32);
        ctx.restore();

        // Subtitle: "DESIGNED BY ADAM DOUKALI"
        ctx.save();
        ctx.font = 'bold 21px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#f5bac5';
        ctx.fillText('DESIGNED BY ADAM DOUKALI', cx, cy + 78);
        ctx.restore();

        // Clickable Pill Button on 3D Base: "CLARODIGI.COM ↗"
        const btnW = 280;
        const btnH = 44;
        const btnX = cx - btnW / 2;
        const btnY = cy + 112;
        const r = 22;
        ctx.save();
        ctx.fillStyle = 'rgba(158, 27, 50, 0.70)';
        ctx.strokeStyle = '#c42340';
        ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(196, 35, 64, 0.75)';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.moveTo(btnX + r, btnY);
        ctx.lineTo(btnX + btnW - r, btnY);
        ctx.arcTo(btnX + btnW, btnY, btnX + btnW, btnY + r, r);
        ctx.lineTo(btnX + btnW, btnY + btnH - r);
        ctx.arcTo(btnX + btnW, btnY + btnH, btnX + btnW - r, btnY + btnH, r);
        ctx.lineTo(btnX + r, btnY + btnH);
        ctx.arcTo(btnX, btnY + btnH, btnX, btnY + btnH - r, r);
        ctx.lineTo(btnX, btnY + r);
        ctx.arcTo(btnX, btnY, btnX + r, btnY, r);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.font = '800 20px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 6;
        ctx.fillText('CLARODIGI.COM  ↗', cx, btnY + btnH / 2);
        ctx.restore();

        // Secret Seal Badge
        ctx.save();
        ctx.font = '700 14px "Plus Jakarta Sans", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(245, 186, 197, 0.92)';
        ctx.fillText('✦ OFFICIAL CREATIVE DIGITAL SEAL ✦', cx, cy + 182);
        ctx.restore();

        // Bottom Stars
        ctx.font = '18px serif';
        ctx.fillStyle = '#c42340';
        ctx.textAlign = 'center';
        ctx.fillText('★   ★   ★', cx, cy + 218);

        ctx.restore();
      }

      drawMedallionCenter(null);

      const texture = new THREE.CanvasTexture(canvas);
      texture.encoding = THREE.sRGBEncoding;
      texture.anisotropy = 8;

      // Asynchronously load official ClaroDigi brand logo
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      logoImg.onload = () => {
        drawMedallionCenter(logoImg);
        texture.needsUpdate = true;
      };
      logoImg.src = 'assets/clarodigi/favicon-tight.png';

      return texture;
    }

    let knightMesh = null;
    const knightPivot = new THREE.Group();
    scene.add(knightPivot);

    // 5. Load the 3D Chess Knight (assets/knight.glb)
    const gltfLoader = new THREE.GLTFLoader();
    if (typeof MeshoptDecoder !== 'undefined') {
      gltfLoader.setMeshoptDecoder(MeshoptDecoder);
    }
    gltfLoader.load(
      'assets/knight.glb',
      (gltf) => {
        const root = gltf.scene;

        // Auto-center bounding box to (0, 0, 0)
        const bbox = new THREE.Box3().setFromObject(root);
        const center = bbox.getCenter(new THREE.Vector3());
        const size = bbox.getSize(new THREE.Vector3());
        const targetHeight = 2.45;
        const scaleFactor = targetHeight / size.y;

        root.position.set(-center.x, -center.y, -center.z);

        // Apply our luxury Obsidian Noir material & shadow casting
        root.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.frustumCulled = false;
            child.material = obsidianMaterial;
          }
        });

        const wrapper = new THREE.Group();
        wrapper.add(root);

        // 5.1 Secret Easter Egg: Attach Adam Doukali Luxury Seal Medallion to Chess Knight Base
        const sealGeo = new THREE.CircleGeometry(0.485, 64);
        const sealTexture = createAdamDoukaliSealTexture();
        const sealMat = new THREE.MeshStandardMaterial({
          map: sealTexture,
          emissiveMap: sealTexture,
          emissive: new THREE.Color(0xffffff),
          emissiveIntensity: 0.82,
          roughness: 0.35,
          metalness: 0.45,
          side: THREE.DoubleSide
        });
        const sealMesh = new THREE.Mesh(sealGeo, sealMat);
        sealMesh.name = 'adamDoukaliSeal';
        sealMesh.position.set(0, -(size.y / 2) - 0.003, 0);
        sealMesh.rotation.x = Math.PI / 2;
        wrapper.add(sealMesh);

        wrapper.scale.setScalar(scaleFactor);

        knightPivot.add(wrapper);
        knightMesh = wrapper;


        // Reveal smoothly
        gsap.fromTo(knightPivot.scale, 
          { x: 0.001, y: 0.001, z: 0.001 },
          { x: 1, y: 1, z: 1, duration: 1.4, ease: 'power3.out' }
        );

        // Notify UI that model is loaded
        const loaderBadge = document.getElementById('scfo-loader-badge');
        if (loaderBadge) loaderBadge.classList.add('loaded');
      },
      undefined,
      (err) => {
        console.error('Error loading knight.glb:', err);
      }
    );

    // Responsive calculation for placement in Hero (Mobile: elevated upper-half stage; Desktop: elegant right side)
    const isMobileDevice = () => window.innerWidth < 820 || (('ontouchstart' in window) && window.innerWidth <= 1024);

    const getHeroPlacement = () => {
      if (isMobileDevice()) {
        return {
          posX: 0.0,
          posY: 0.52,
          scale: 0.68,
          emblemX: 0.0,
          emblemY: 0.52,
          emblemOpacity: 0.95
        };
      }
      return {
        posX: 1.22,
        posY: 0.04,
        scale: 1.05,
        emblemX: -0.22,
        emblemY: 0.12,
        emblemOpacity: 0.95
      };
    };

    const initialHero = getHeroPlacement();

    // 6. Interactive Physics & Dynamics State
    const state = {
      // Base choreographed targets: START ACCORDING TO SCREEN SIZE
      posX: initialHero.posX,
      posY: initialHero.posY,
      posZ: 0,
      rotX: 0.04,
      rotY: -0.38, // Facing slightly left toward the center logo
      rotZ: 0,
      scale: initialHero.scale,

      // Emblem targets
      emblemX: initialHero.emblemX,
      emblemY: initialHero.emblemY,
      emblemScale: 1,
      emblemOpacity: initialHero.emblemOpacity,

      // Current damped values
      currentX: initialHero.posX,
      currentY: initialHero.posY,
      currentZ: 0,
      currentRotX: 0.04,
      currentRotY: -0.38,
      currentRotZ: 0,
      currentScale: initialHero.scale,
      currentEmblemX: initialHero.emblemX,
      currentEmblemY: initialHero.emblemY,
      currentEmblemOpacity: initialHero.emblemOpacity,

      // User mouse look-at tracking
      mouseNormX: 0,
      mouseNormY: 0,
      mouseLagX: 0,
      mouseLagY: 0,

      // User drag-to-spin interaction
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0,
      dragDeltaYaw: 0,
      dragDeltaPitch: 0,
      dragVelYaw: 0,
      dragVelPitch: 0
    };
    window.__scfoState = state;
    window.__scfoKnightPivot = knightPivot;

    // 7. Mouse & Touch Interaction (Parallax Look-At & Drag-to-Spin)
    window.addEventListener('mousemove', (e) => {
      // Normalized from -1 to 1 across viewport
      state.mouseNormX = (e.clientX / window.innerWidth) * 2 - 1;
      state.mouseNormY = -(e.clientY / window.innerHeight) * 2 + 1;

      if (state.isDragging) {
        const deltaX = (e.clientX - state.dragStartX) * 0.008;
        const deltaY = (e.clientY - state.dragStartY) * 0.008;
        state.dragDeltaYaw += deltaX;
        state.dragDeltaPitch += deltaY;
        state.dragVelYaw = deltaX;
        state.dragVelPitch = deltaY;
        state.dragStartX = e.clientX;
        state.dragStartY = e.clientY;
      }
    });

    // Click & Drag Detection for 3D Knight & Clickable Seal
    let clickStartX = 0;
    let clickStartY = 0;
    let clickStartTime = 0;
    let isSealFacingCamera = false;

    // Drag start
    window.addEventListener('mousedown', (e) => {
      clickStartX = e.clientX;
      clickStartY = e.clientY;
      clickStartTime = performance.now();
      if (e.target.closest('#hero-fullscreen') || e.target.closest('#scfo-3d-container') || e.target === canvas) {
        state.isDragging = true;
        state.dragStartX = e.clientX;
        state.dragStartY = e.clientY;
        canvas.style.cursor = 'grabbing';
      }
    });

    window.addEventListener('mouseup', (e) => {
      const clickDist = Math.hypot(e.clientX - clickStartX, e.clientY - clickStartY);
      const clickDuration = performance.now() - clickStartTime;

      if (state.isDragging) {
        state.isDragging = false;
        canvas.style.cursor = isSealFacingCamera ? 'pointer' : 'grab';
      }

      // If clicked without dragging while secret seal is facing camera -> Redirect to CLARODIGI.COM!
      if (clickDist < 8 && clickDuration < 450 && isSealFacingCamera) {
        if (e.target.closest('#hero-fullscreen') || e.target.closest('#scfo-3d-container') || e.target === canvas) {
          window.open('https://clarodigi.com', '_blank', 'noopener,noreferrer');
        }
      }
    });

    // Hover cursor feedback when secret seal is revealed
    window.addEventListener('mousemove', (e) => {
      if (!state.isDragging) {
        if (isSealFacingCamera && (e.target === canvas || e.target.closest('#hero-fullscreen'))) {
          canvas.style.cursor = 'pointer';
          canvas.title = 'Visiter CLARODIGI.COM (Made by ClaroDiG)';
        } else if (!state.isDragging) {
          canvas.style.cursor = 'grab';
          canvas.title = '';
        }
      }
    }, { passive: true });

    // Touch support for mobile dragging & tap redirection
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    window.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        const t = e.touches[0];
        touchStartX = t.clientX;
        touchStartY = t.clientY;
        touchStartTime = performance.now();
        if (e.target.closest('#hero-fullscreen') || e.target.closest('#scfo-3d-container') || e.target === canvas) {
          state.isDragging = true;
          state.dragStartX = t.clientX;
          state.dragStartY = t.clientY;
        }
        state.mouseNormX = (t.clientX / window.innerWidth) * 2 - 1;
        state.mouseNormY = -(t.clientY / window.innerHeight) * 2 + 1;
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        const t = e.touches[0];
        state.mouseNormX = (t.clientX / window.innerWidth) * 2 - 1;
        state.mouseNormY = -(t.clientY / window.innerHeight) * 2 + 1;

        if (state.isDragging) {
          const deltaX = (t.clientX - state.dragStartX) * 0.009;
          const deltaY = (t.clientY - state.dragStartY) * 0.009;
          state.dragDeltaYaw += deltaX;
          state.dragDeltaPitch += deltaY;
          state.dragStartX = t.clientX;
          state.dragStartY = t.clientY;
        }
      }
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      state.isDragging = false;
      if (e.changedTouches && e.changedTouches.length > 0) {
        const t = e.changedTouches[0];
        const dist = Math.hypot(t.clientX - touchStartX, t.clientY - touchStartY);
        const duration = performance.now() - touchStartTime;
        if (dist < 12 && duration < 400 && isSealFacingCamera) {
          window.open('https://clarodigi.com', '_blank', 'noopener,noreferrer');
        }
      }
    }, { passive: true });

    // Double-click or programmatic trigger: Smooth inspection flip to reveal secret seal
    let isInspectingSeal = false;
    function inspectSecretSeal() {
      if (isInspectingSeal || typeof gsap === 'undefined') return;
      isInspectingSeal = true;
      const easterEggPill = document.getElementById('secret-easter-egg-pill');
      if (easterEggPill) easterEggPill.classList.add('visible');

      gsap.timeline({
        onComplete: () => {
          isInspectingSeal = false;
          if (easterEggPill) {
            setTimeout(() => { easterEggPill.classList.remove('visible'); }, 2000);
          }
        }
      })
      .to(state, {
        dragDeltaPitch: -Math.PI / 1.85,
        dragDeltaYaw: state.dragDeltaYaw + Math.PI * 2,
        duration: 1.5,
        ease: 'power2.inOut'
      })
      .to(state, {
        dragDeltaPitch: 0,
        duration: 1.2,
        delay: 2.2,
        ease: 'power2.out'
      });
    }
    window.__inspectSecretSeal = inspectSecretSeal;
    window.__scfoState = state;

    window.addEventListener('dblclick', (e) => {
      if (e.target.closest('#hero-fullscreen') || e.target.closest('#scfo-3d-container') || e.target === canvas) {
        inspectSecretSeal();
      }
    });

    // 8. Dedicated Discrete Page-Transition Engine with Delay & 3D Flight Physics
    function transitionToPage(targetIndex, instant = false) {
      if (typeof gsap === 'undefined') return;
      const heroPos = getHeroPlacement();
      const pageConfigs = [
        // Slide 0: Hero
        { posX: heroPos.posX, posY: heroPos.posY, rotX: 0.04, rotY: -0.38, scale: heroPos.scale, emblemX: heroPos.emblemX, emblemY: heroPos.emblemY, emblemOpacity: 0.95 },
        // Slide 1: Le Mot de Notre Famille — Left (-1.65), facing right (+0.52) towards family editorial
        { posX: -1.65, posY: 0.02, rotX: 0.04, rotY: 0.52, scale: 0.88, emblemX: -1.65, emblemY: 0.12, emblemOpacity: 0.38 },
        // Slide 2: Asharq Al Awsat Cars — Right (+1.65), facing left (-0.52) towards rental fleet
        { posX: 1.65, posY: -0.04, rotX: 0.04, rotY: -0.52, scale: 0.88, emblemX: 1.65, emblemY: 0.12, emblemOpacity: 0.40 },
        // Slide 3: الشرق الأوسط Immobilier — Left (-1.65), facing right (+0.52) towards real estate chips
        { posX: -1.65, posY: 0.02, rotX: 0.06, rotY: 0.52, scale: 0.88, emblemX: -1.65, emblemY: 0.12, emblemOpacity: 0.38 },
        // Slide 4: Contact & Siège Social — Right (+1.25), facing left (-0.35) towards directory
        { posX: 1.25, posY: -0.10, rotX: 0.04, rotY: -0.35, scale: 0.82, emblemX: 0.95, emblemY: 0.12, emblemOpacity: 0.30 }
      ];

      const target = pageConfigs[targetIndex] || pageConfigs[0];

      if (instant) {
        gsap.killTweensOf(state);
        Object.assign(state, target);
        state.posZ = 0;
        state.rotZ = 0;
        state.currentX = target.posX;
        state.currentY = target.posY;
        state.currentRotY = target.rotY;
        state.currentEmblemX = target.emblemX;
        state.currentEmblemOpacity = target.emblemOpacity;
        return;
      }

      gsap.killTweensOf(state);

      // Determine travel direction to add dynamic 3D banking / roll
      const deltaX = target.posX - state.posX;
      const bankRoll = deltaX > 0 ? -0.14 : 0.14; // Dynamic 3D bank into the turn

      // 1. Staggered Delay (0.10s): The page scroll begins first, then the knight swoops across!
      gsap.to(state, {
        posX: target.posX,
        posY: target.posY,
        rotX: target.rotX,
        rotY: target.rotY,
        scale: target.scale,
        emblemX: target.emblemX,
        emblemOpacity: target.emblemOpacity,
        duration: 1.30,
        delay: 0.10, // Organic delayed start
        ease: 'power3.out'
      });

      // 2. Dynamic 3D depth arc (lifts forward in 3D space during flight, then settles back)
      gsap.timeline({ delay: 0.10 })
        .to(state, {
          posZ: 0.32,
          rotZ: bankRoll,
          duration: 0.52,
          ease: 'power2.out'
        })
        .to(state, {
          posZ: 0,
          rotZ: 0,
          duration: 0.78,
          ease: 'power2.inOut'
        });
    }
    window.__scfoTransitionToPage = transitionToPage;

    // 9. Deterministic Multi-Section Alternating Scroll Choreography (Fallback for free scroll)
    function updateScrollChoreography() {
      // If discrete page navigation is active, let GSAP drive the delayed 3D swooping animation
      if (window.isPageScrolling) return;

      const family = document.getElementById('family-word');
      const rental = document.getElementById('rental-company');
      const estate = document.getElementById('real-estate-company');
      const contact = document.getElementById('contact');
      if (!family || !rental || !estate) return;

      const scrollY = window.scrollY || (window.lenis ? window.lenis.scroll : 0);
      const vh = window.innerHeight;

      const familyTop = family.offsetTop;
      const rentalTop = rental.offsetTop;
      const estateTop = estate.offsetTop;
      const heroPos = getHeroPlacement();
      const rightX = heroPos.posX;
      const leftX = -1.65;
      const farRightX = 1.65;

      // 1. Hero -> Family Word transition (RIGHT to LEFT)
      if (scrollY < familyTop - vh * 0.15) {
        const start = vh * 0.15;
        const end = familyTop - vh * 0.15;
        const t = Math.max(0, Math.min(1, (scrollY - start) / (end - start)));
        state.posX = gsap.utils.interpolate(heroPos.posX, leftX, t);
        state.posY = gsap.utils.interpolate(heroPos.posY, 0.02, t);
        state.rotY = gsap.utils.interpolate(-0.38, 0.50, t);
        state.scale = gsap.utils.interpolate(heroPos.scale, 0.88, t);
        state.emblemX = gsap.utils.interpolate(heroPos.emblemX, -1.65, t);
        state.emblemY = gsap.utils.interpolate(heroPos.emblemY, 0.12, t);
        state.emblemOpacity = gsap.utils.interpolate(heroPos.emblemOpacity, 0.40, t);
      }
      // 2. Family Word -> Rental Auto transition (LEFT to RIGHT)
      else if (scrollY < rentalTop - vh * 0.15) {
        const start = familyTop + vh * 0.15;
        const end = rentalTop - vh * 0.15;
        const t = Math.max(0, Math.min(1, (scrollY - start) / (end - start)));
        state.posX = gsap.utils.interpolate(leftX, farRightX, t);
        state.posY = gsap.utils.interpolate(0.02, -0.04, t);
        state.rotY = gsap.utils.interpolate(0.50, -0.52, t);
        state.scale = 0.88;
        state.emblemX = gsap.utils.interpolate(-1.65, 1.65, t);
        state.emblemOpacity = gsap.utils.interpolate(0.40, 0.42, t);
      }
      // 3. Rental Auto -> Real Estate transition (RIGHT to LEFT)
      else if (scrollY < estateTop - vh * 0.15) {
        const start = rentalTop + vh * 0.15;
        const end = estateTop - vh * 0.15;
        const t = Math.max(0, Math.min(1, (scrollY - start) / (end - start)));
        state.posX = gsap.utils.interpolate(farRightX, leftX, t);
        state.posY = gsap.utils.interpolate(-0.04, 0.04, t);
        state.rotY = gsap.utils.interpolate(-0.52, 0.50, t);
        state.rotX = gsap.utils.interpolate(0.04, 0.06, t);
        state.scale = 0.88;
        state.emblemX = gsap.utils.interpolate(1.65, -1.65, t);
        state.emblemOpacity = gsap.utils.interpolate(0.42, 0.40, t);
      }
      // 4. Real Estate -> Contact transition (LEFT to RIGHT)
      else {
        const start = estateTop + vh * 0.15;
        const end = contactTop;
        const t = Math.max(0, Math.min(1, (scrollY - start) / (end - start)));
        state.posX = gsap.utils.interpolate(leftX, 1.25, t);
        state.posY = gsap.utils.interpolate(0.04, -0.10, t);
        state.rotY = gsap.utils.interpolate(0.50, -0.35, t);
        state.scale = gsap.utils.interpolate(0.88, 0.82, t);
        state.emblemX = gsap.utils.interpolate(-1.65, 0.95, t);
        state.emblemOpacity = gsap.utils.interpolate(0.40, 0.35, t);
      }
    }

    // 10. The Main 60FPS Animation Loop ("Continuous Living Motion / Just Moving")
    let clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);

      // Scroll Choreography fallback
      updateScrollChoreography();

      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // 10.1 Physics Damping for Mouse Look-At (Lerp with spring feel)
      const lookSensitivityX = 0.35;
      const lookSensitivityY = 0.25;
      state.mouseLagX += (state.mouseNormX - state.mouseLagX) * 0.055;
      state.mouseLagY += (state.mouseNormY - state.mouseLagY) * 0.055;

      // Inertia recoil for user drag (paused during inspection flip)
      if (!state.isDragging && !isInspectingSeal) {
        state.dragDeltaYaw *= 0.96; // silky damp back to center stance
        state.dragDeltaPitch *= 0.96;
      }

      // 10.2 Continuous Multi-Axis Organic Breathing & Idle Levitation ("just moving")
      const breathPitch = Math.sin(time * 0.85) * 0.038 + Math.cos(time * 1.7) * 0.012;
      const breathYaw   = Math.cos(time * 0.62) * 0.052 + Math.sin(time * 1.25) * 0.018;
      const breathRoll  = Math.sin(time * 0.74) * 0.024;
      const levitateY   = Math.sin(time * 1.28) * 0.055 + Math.cos(time * 0.5) * 0.02;

      // 10.3 Spring Damping with Delay (Organic living follow-through)
      const prevX = state.currentX;
      const lerpFactor = 0.055; // Silky smooth physics damping

      state.currentX += (state.posX - state.currentX) * lerpFactor;
      state.currentY += (state.posY - state.currentY) * lerpFactor;
      state.currentZ += (state.posZ - state.currentZ) * lerpFactor;
      state.currentRotX += (state.rotX - state.currentRotX) * (lerpFactor * 0.95);
      state.currentRotY += (state.rotY - state.currentRotY) * (lerpFactor * 0.88);
      state.currentRotZ += (state.rotZ - state.currentRotZ) * lerpFactor;
      state.currentScale += (state.scale - state.currentScale) * lerpFactor;

      // Dynamic flight banking based on velocity
      const velX = state.currentX - prevX;
      const dynamicBank = -velX * 3.2;

      // Emblem also lags with physics delay
      state.currentEmblemX += (state.emblemX - state.currentEmblemX) * (lerpFactor * 0.85);
      state.currentEmblemY += (state.emblemY - state.currentEmblemY) * (lerpFactor * 0.85);
      state.currentEmblemOpacity += (state.emblemOpacity - state.currentEmblemOpacity) * lerpFactor;

      // 10.4 Apply to 3D Knight Pivot
      if (knightPivot) {
        knightPivot.position.x = state.currentX;
        knightPivot.position.y = state.currentY + levitateY;
        knightPivot.position.z = state.currentZ;

        // Combine base rotation + mouse look-at gaze + organic breathing + dynamic flight banking + drag delta
        knightPivot.rotation.x = state.currentRotX - (state.mouseLagY * lookSensitivityY) + breathPitch + state.dragDeltaPitch;
        knightPivot.rotation.y = state.currentRotY + (state.mouseLagX * lookSensitivityX) + breathYaw + state.dragDeltaYaw;
        knightPivot.rotation.z = state.currentRotZ + dynamicBank + breathRoll;

        knightPivot.scale.setScalar(state.currentScale);

        // Check if secret seal on base is facing the camera
        const sealNormal = new THREE.Vector3(0, -1, 0).applyEuler(knightPivot.rotation);
        isSealFacingCamera = (sealNormal.z > 0.35 || isInspectingSeal);
        const easterEggPill = document.getElementById('secret-easter-egg-pill');
        if (easterEggPill) {
          if (isSealFacingCamera) {
            easterEggPill.classList.add('visible');
          } else if (!state.isDragging && !isInspectingSeal) {
            easterEggPill.classList.remove('visible');
          }
        }
      }

      // 10.5 Apply to Background Luminous Emblem
      if (emblemGroup) {
        emblemGroup.position.x = state.currentEmblemX - (state.mouseLagX * 0.12);
        emblemGroup.position.y = state.currentEmblemY - (state.mouseLagY * 0.08);

        // Update shader uniforms
        const halo = emblemGroup.getObjectByName('haloRing');
        if (halo && halo.material.uniforms) {
          halo.material.uniforms.uTime.value = time;
          halo.material.uniforms.uOpacity.value = state.currentEmblemOpacity;
        }

        const disc = emblemGroup.getObjectByName('emblemDisc');
        if (disc) {
          disc.material.opacity = state.currentEmblemOpacity;
        }
      }

      // 10.6 Dynamic Living Studio Lights
      // Orbiting specular glint light
      glintLight.position.x = Math.sin(time * 0.7) * 2.8 + state.mouseLagX * 1.5;
      glintLight.position.y = 1.8 + Math.cos(time * 0.9) * 1.2;
      glintLight.position.z = 2.4 + Math.sin(time * 0.5) * 1.0;

      // Rim lights shift subtly with cursor for dynamic highlights
      rimLight1.position.x = 3.2 + state.mouseLagX * 0.8;
      rimLight1.position.y = 2.8 - state.mouseLagY * 0.6;

      renderer.render(scene, camera);
    }

    animate();

    // 11. Responsive Viewport Resize
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

      if (window.currentPageIndex === 0 || typeof window.currentPageIndex === 'undefined') {
        const hp = getHeroPlacement();
        state.posX = hp.posX;
        state.posY = hp.posY;
        state.scale = hp.scale;
        state.emblemX = hp.emblemX;
        state.emblemY = hp.emblemY;
      }
    });
  }

  // Self-initialize on DOMContentLoaded or immediate if already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScene);
  } else {
    initScene();
  }

})();
