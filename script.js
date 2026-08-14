// ============================================
// SAMIHAN NARAYANKERI — Immersive 3D Portfolio
// Three.js Particles + GSAP ScrollTrigger + Lenis
// ============================================

(function () {
  'use strict';

  // =============================
  // 1. LENIS SMOOTH SCROLL
  // =============================
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    smoothWheel: true,
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  // =============================
  // 2. ELEMENT THEME SWITCHER
  // =============================
  const body = document.body;
  const elemBtns = document.querySelectorAll('.elem-btn');

  const elementColors = {
    water: { r: 6, g: 182, b: 212 },
    earth: { r: 16, g: 185, b: 129 },
    fire: { r: 239, g: 68, b: 68 },
    air: { r: 56, g: 189, b: 248 },
    avatar: { r: 0, g: 242, b: 254 },
  };

  let currentElement = localStorage.getItem('portfolio-element') || 'water';

  function setElement(el) {
    currentElement = el;
    body.setAttribute('data-element', el);
    localStorage.setItem('portfolio-element', el);
    elemBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.element === el);
    });
  }

  setElement(currentElement);

  elemBtns.forEach((btn) => {
    btn.addEventListener('click', () => setElement(btn.dataset.element));
  });

  // Keyboard shortcuts
  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
    const map = { '1': 'water', '2': 'earth', '3': 'fire', '4': 'air', '5': 'avatar' };
    if (map[e.key]) setElement(map[e.key]);
  });

  // =============================
  // 3. THREE.JS PARTICLE SYSTEM
  // =============================
  const canvas = document.getElementById('webgl-canvas');
  if (canvas && typeof THREE !== 'undefined') {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
    camera.position.z = 120;

    const PARTICLE_COUNT = 4000;
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const alphas = new Float32Array(PARTICLE_COUNT);

    const spread = 180;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * spread;
      positions[i3 + 1] = (Math.random() - 0.5) * spread;
      positions[i3 + 2] = (Math.random() - 0.5) * spread * 0.5;
      velocities[i3] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.01;
      sizes[i] = Math.random() * 2.5 + 0.5;
      alphas[i] = Math.random() * 0.5 + 0.2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));

    const vertexShader = `
      attribute float aSize;
      attribute float aAlpha;
      varying float vAlpha;
      uniform float uTime;
      uniform float uPixelRatio;

      void main() {
        vAlpha = aAlpha;
        vec3 pos = position;
        pos.y += sin(uTime * 0.3 + position.x * 0.01) * 2.0;
        pos.x += cos(uTime * 0.2 + position.y * 0.01) * 1.5;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = aSize * uPixelRatio * (80.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const fragmentShader = `
      varying float vAlpha;
      uniform vec3 uColor;

      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float strength = 1.0 - (d * 2.0);
        strength = pow(strength, 1.5);
        gl_FragColor = vec4(uColor, vAlpha * strength);
      }
    `;

    const colors = elementColors[currentElement];
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Vector3(colors.r / 255, colors.g / 255, colors.b / 255) },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    const mouse = { x: 0, y: 0, worldX: 0, worldY: 0 };

    window.addEventListener('mousemove', (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      mouse.worldX = mouse.x * 80;
      mouse.worldY = mouse.y * 50;
    });

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      material.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
    });

    let scrollProgress = 0;
    ScrollTrigger.create({
      trigger: 'body',
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        scrollProgress = self.progress;
      },
    });

    let targetColor = { r: colors.r / 255, g: colors.g / 255, b: colors.b / 255 };

    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();
      material.uniforms.uTime.value = elapsed;

      const ec = elementColors[currentElement];
      targetColor.r = ec.r / 255;
      targetColor.g = ec.g / 255;
      targetColor.b = ec.b / 255;

      const uc = material.uniforms.uColor.value;
      uc.x += (targetColor.r - uc.x) * 0.04;
      uc.y += (targetColor.g - uc.y) * 0.04;
      uc.z += (targetColor.b - uc.z) * 0.04;

      camera.position.x += (mouse.x * 8 - camera.position.x) * 0.03;
      camera.position.y += (mouse.y * 5 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);

      const posAttr = geometry.attributes.position;
      const posArr = posAttr.array;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;

        posArr[i3] += velocities[i3];
        posArr[i3 + 1] += velocities[i3 + 1];
        posArr[i3 + 2] += velocities[i3 + 2];

        const dx = posArr[i3] - mouse.worldX;
        const dy = posArr[i3 + 1] - mouse.worldY;
        const distSq = dx * dx + dy * dy;
        const repulseRadius = 900;
        if (distSq < repulseRadius && distSq > 0.1) {
          const dist = Math.sqrt(distSq);
          const force = (1 - dist / 30) * 0.4;
          posArr[i3] += (dx / dist) * force;
          posArr[i3 + 1] += (dy / dist) * force;
        }

        const halfSpread = spread * 0.5;
        if (posArr[i3] > halfSpread) posArr[i3] = -halfSpread;
        if (posArr[i3] < -halfSpread) posArr[i3] = halfSpread;
        if (posArr[i3 + 1] > halfSpread) posArr[i3 + 1] = -halfSpread;
        if (posArr[i3 + 1] < -halfSpread) posArr[i3 + 1] = halfSpread;
      }
      posAttr.needsUpdate = true;

      camera.position.z = 120 + scrollProgress * 30;

      renderer.render(scene, camera);
    }
    animate();
  }

  // =============================
  // 4. SIDE GRAPH NAVIGATION & SWIFT JUMP
  // =============================
  const graphNodes = document.querySelectorAll('.graph-node');
  const graphLineProgress = document.getElementById('graph-line-progress');
  const sections = document.querySelectorAll('.panel');

  graphNodes.forEach((node) => {
    node.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = node.getAttribute('href');
      if (targetId) {
        lenis.scrollTo(targetId, { duration: 1.2 });
      }
    });
  });

  ScrollTrigger.create({
    trigger: 'body',
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      if (graphLineProgress) {
        graphLineProgress.style.height = `${self.progress * 100}%`;
      }

      // Active section calculation
      let currentSecId = '';
      sections.forEach((sec) => {
        const top = sec.offsetTop - window.innerHeight * 0.35;
        const height = sec.offsetHeight;
        if (window.scrollY >= top && window.scrollY < top + height) {
          currentSecId = sec.getAttribute('id');
        }
      });

      if (currentSecId) {
        graphNodes.forEach((node) => {
          const secAttr = node.dataset.section;
          node.classList.toggle('active', secAttr === currentSecId || (currentSecId.startsWith('project') && secAttr === 'project-1'));
        });
      }
    },
  });

  // =============================
  // 5. CUSTOM CURSOR
  // =============================
  const cursorRing = document.getElementById('cursor-ring');
  const cursorDot = document.getElementById('cursor-dot');

  if (cursorRing && cursorDot && window.matchMedia('(hover: hover)').matches) {
    let cx = 0, cy = 0;
    let rx = 0, ry = 0;
    let dx = 0, dy = 0;

    window.addEventListener('mousemove', (e) => {
      cx = e.clientX;
      cy = e.clientY;
    });

    function updateCursor() {
      rx += (cx - rx) * 0.12;
      ry += (cy - ry) * 0.12;
      dx += (cx - dx) * 0.3;
      dy += (cy - dy) * 0.3;

      cursorRing.style.transform = `translate3d(${rx - 18}px, ${ry - 18}px, 0)`;
      cursorDot.style.transform = `translate3d(${dx - 2.5}px, ${dy - 2.5}px, 0)`;
      requestAnimationFrame(updateCursor);
    }
    updateCursor();

    const hoverTargets = document.querySelectorAll('a, button, .contact-link');
    hoverTargets.forEach((el) => {
      el.addEventListener('mouseenter', () => body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => body.classList.remove('cursor-hover'));
    });
  } else {
    if (cursorRing) cursorRing.style.display = 'none';
    if (cursorDot) cursorDot.style.display = 'none';
  }

  // =============================
  // 6. GSAP ANIMATIONS & REVEALS
  // =============================
  gsap.registerPlugin(ScrollTrigger);

  // -- Hero Entrance --
  const heroTl = gsap.timeline({ delay: 0.2 });
  heroTl
    .to('.hero-label', { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' })
    .to('.hero-name .line-inner', {
      y: '0%',
      duration: 1.1,
      ease: 'power4.out',
      stagger: 0.15,
    }, '<0.15')
    .to('.hero-sub', { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, '-=0.4');

  // -- Hero Fade Out / Fade Back In on Scroll Up --
  gsap.to('.hero-content-wrapper, .scroll-indicator', {
    opacity: 0,
    y: -50,
    ease: 'none',
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: '70% top',
      scrub: true,
      immediateRender: false,
    },
  });

  // -- About: Word-by-word reveal --
  const aboutText = document.getElementById('about-text');
  if (aboutText) {
    const text = aboutText.textContent.trim();
    aboutText.innerHTML = text.split(' ').map((w) => `<span class="word">${w}</span>`).join(' ');

    const words = aboutText.querySelectorAll('.word');
    ScrollTrigger.create({
      trigger: '#about',
      start: 'top 70%',
      end: 'center center',
      scrub: true,
      onUpdate: (self) => {
        const progress = self.progress;
        words.forEach((word, i) => {
          if (i / words.length < progress) {
            word.classList.add('active');
          } else {
            word.classList.remove('active');
          }
        });
      },
    });
  }

  // -- Metrics Counter --
  gsap.utils.toArray('.metric').forEach((metric) => {
    gsap.to(metric, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: metric,
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
    });

    const valEl = metric.querySelector('.metric-val');
    if (valEl) {
      const target = parseFloat(valEl.dataset.count);
      const decimals = parseInt(valEl.dataset.decimals) || 0;
      const suffix = valEl.dataset.suffix || '';
      const counter = { val: 0 };

      ScrollTrigger.create({
        trigger: metric,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          gsap.to(counter, {
            val: target,
            duration: 1.5,
            ease: 'power2.out',
            onUpdate: () => {
              valEl.textContent = counter.val.toFixed(decimals) + suffix;
            },
          });
        },
      });
    }
  });

  // -- Work Experience Vertical Graph Nodes --
  gsap.utils.toArray('.work-graph-node-item').forEach((item, i) => {
    gsap.to(item, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power2.out',
      delay: i * 0.12,
      scrollTrigger: {
        trigger: item,
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
    });
  });

  // -- Project Panels --
  gsap.utils.toArray('.project-panel').forEach((panel) => {
    const children = panel.querySelectorAll('.project-label, .project-name, .project-desc, .project-highlights, .project-tags, .project-link');
    gsap.to(children, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power2.out',
      stagger: 0.12,
      scrollTrigger: {
        trigger: panel,
        start: 'top 65%',
        toggleActions: 'play none none none',
      },
    });
  });

  // -- Skills --
  gsap.utils.toArray('.skill-group').forEach((group, i) => {
    gsap.to(group, {
      opacity: 1,
      y: 0,
      duration: 0.7,
      ease: 'power2.out',
      delay: i * 0.08,
      scrollTrigger: {
        trigger: group,
        start: 'top 88%',
        toggleActions: 'play none none none',
      },
    });
  });

  // -- Achievements --
  gsap.utils.toArray('.achieve-item').forEach((item, i) => {
    gsap.to(item, {
      opacity: 1,
      y: 0,
      duration: 0.7,
      ease: 'power2.out',
      delay: i * 0.06,
      scrollTrigger: {
        trigger: item,
        start: 'top 88%',
        toggleActions: 'play none none none',
      },
    });
  });

  // -- Contact --
  const contactEls = document.querySelectorAll('.contact-heading, .contact-sub, .contact-links');
  gsap.to(contactEls, {
    opacity: 1,
    y: 0,
    duration: 0.8,
    ease: 'power2.out',
    stagger: 0.15,
    scrollTrigger: {
      trigger: '#contact',
      start: 'top 65%',
      toggleActions: 'play none none none',
    },
  });

})();
