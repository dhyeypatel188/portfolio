import { useEffect, useRef } from 'react';

// Where the camera is at each point of the page scroll (0 -> 1).
// lat/lon = point on Earth we look straight down at, dist = camera distance,
// x/y = where the globe sits on screen in NDC (so it moves clear of the text).
const VIEWS = [
  { p: 0.0, lat: 18, lon: 72, dist: 3.2, x: 0, y: -1.6 },   // India, rising over the horizon
  { p: 0.25, lat: 32, lon: 12, dist: 3.4, x: 0.9, y: -0.1 },  // Europe / Africa, globe on the right
  { p: 0.5, lat: 8, lon: -72, dist: 3.4, x: -0.9, y: 0 },     // the Americas, globe on the left
  { p: 0.75, lat: 70, lon: 100, dist: 3.4, x: 0.9, y: 0 },    // looking down on the north pole
  { p: 1.0, lat: 23, lon: 72.6, dist: 2.35, x: 0, y: -0.25 },  // back home to Ahmedabad
];

const D = Math.PI / 180;
const smooth = (t) => t * t * (3 - 2 * t);

function view(p) {
  let i = 0;
  while (i < VIEWS.length - 2 && p > VIEWS[i + 1].p) i++;
  const a = VIEWS[i], b = VIEWS[i + 1];
  const t = smooth(Math.min(1, Math.max(0, (p - a.p) / (b.p - a.p))));
  const m = (k) => a[k] + (b[k] - a[k]) * t;
  return { lat: m('lat'), lon: m('lon'), dist: m('dist'), x: m('x'), y: m('y') };
}

const DAY_NIGHT = {
  vertex: `
    varying vec2 vUv; varying vec3 vN; varying vec3 vW;
    void main() {
      vUv = uv;
      vN = normalize(mat3(modelMatrix) * normal);
      vec4 w = modelMatrix * vec4(position, 1.0);
      vW = w.xyz;
      gl_Position = projectionMatrix * viewMatrix * w;
    }`,
  fragment: `
    uniform sampler2D dayMap; uniform sampler2D nightMap; uniform sampler2D waterMap; uniform sampler2D topoMap; uniform vec3 sun;
    varying vec2 vUv; varying vec3 vN; varying vec3 vW;
    void main() {
      vec3 n0 = normalize(vN);
      vec3 v = normalize(cameraPosition - vW);
      // terrain relief: bend the normal by the slope of the elevation map
      vec3 east = normalize(cross(vec3(0.0, 1.0, 0.0), n0));
      vec3 north = cross(n0, east);
      vec2 px = vec2(1.0 / 2048.0, 1.0 / 1024.0);
      float dhx = texture2D(topoMap, vUv + vec2(px.x, 0.0)).r - texture2D(topoMap, vUv - vec2(px.x, 0.0)).r;
      float dhy = texture2D(topoMap, vUv + vec2(0.0, px.y)).r - texture2D(topoMap, vUv - vec2(0.0, px.y)).r;
      vec3 n = normalize(n0 - 5.0 * (dhx * east * -1.0 + dhy * north));
      float d0 = dot(n0, sun);
      float d = dot(n, sun);
      float water = texture2D(waterMap, vUv).r;                // ocean mask
      float day = smoothstep(-0.12, 0.25, d0);
      vec3 albedo = texture2D(dayMap, vUv).rgb;
      vec3 dayC = albedo * (0.05 + 1.2 * max(d, 0.0));
      // sun glint on the oceans
      vec3 r = reflect(-sun, n0);
      float spec = pow(max(dot(r, v), 0.0), 90.0) * water * smoothstep(0.0, 0.3, d0);
      dayC += vec3(1.0, 0.92, 0.8) * spec * 1.4;
      vec3 nightC = texture2D(nightMap, vUv).rgb * vec3(1.6, 1.25, 0.8);
      vec3 c = mix(nightC, dayC, day);
      // sunset glow along the terminator and blue scattering toward the limb
      c += vec3(1.0, 0.42, 0.18) * smoothstep(0.18, 0.0, abs(d0)) * 0.06;
      float rim = pow(1.0 - max(dot(n0, v), 0.0), 3.0);
      c += vec3(0.25, 0.5, 1.0) * rim * (0.2 + 0.9 * smoothstep(-0.3, 0.5, d0));
      gl_FragColor = vec4(c, 1.0);
      #include <colorspace_fragment>
    }`,
};

// procedural clouds: sharp at any zoom, drifting slowly, lit by the same sun
const CLOUDS = {
  vertex: `
    varying vec3 vP; varying vec3 vN;
    void main() {
      vP = position;
      vN = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
    }`,
  fragment: `
    uniform vec3 sun; uniform float time;
    varying vec3 vP; varying vec3 vN;
    float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
    float noise(vec3 x) {
      vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                 mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
    }
    float fbm(vec3 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 6; i++) { s += a * noise(p); p *= 2.07; a *= 0.5; } return s; }
    void main() {
      vec3 p = normalize(vP);
      float a = time * 0.004;
      p = vec3(p.x * cos(a) - p.z * sin(a), p.y, p.x * sin(a) + p.z * cos(a));
      // stretch along latitude a little so cloud bands look like weather systems
      float f = fbm(p * vec3(3.2, 5.0, 3.2) + 7.0);
      float cover = smoothstep(0.5, 0.72, f);
      float d = dot(normalize(vN), sun);
      float lit = 0.06 + 1.1 * smoothstep(-0.15, 0.5, d);
      gl_FragColor = vec4(vec3(lit), cover * 0.85);
      #include <colorspace_fragment>
    }`,
};

const GLOW = {
  vertex: `
    varying vec3 vN;
    void main() {
      vN = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragment: `
    varying vec3 vN;
    void main() {
      float i = pow(max(0.0, 0.74 - dot(vN, vec3(0.0, 0.0, 1.0))), 3.2);
      gl_FragColor = vec4(0.3, 0.58, 1.0, 1.0) * i * 2.2;
    }`,
};

export default function Earth() {
  const ref = useRef(null);

  useEffect(() => {
    const host = ref.current;
    let dead = false, raf = 0, cleanup = () => {};

    import('three').then((THREE) => {
      if (dead) return;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
      const globe = new THREE.Group();
      scene.add(globe);

      const loader = new THREE.TextureLoader();
      const tex = (url, srgb = true) => {
        const t = loader.load(url);
        if (srgb) t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 8;
        return t;
      };
      const sun = new THREE.Vector3(1, 0.3, 0.6).normalize();

      const earth = new THREE.Mesh(
        new THREE.SphereGeometry(1, 96, 96),
        new THREE.ShaderMaterial({
          vertexShader: DAY_NIGHT.vertex, fragmentShader: DAY_NIGHT.fragment,
          uniforms: { dayMap: { value: tex('/earth/earth-blue-marble.jpg') }, nightMap: { value: tex('/earth/earth-night.jpg') }, waterMap: { value: tex('/earth/water.png', false) }, topoMap: { value: tex('/earth/topo.png', false) }, sun: { value: sun } },
        }),
      );
      globe.add(earth);

      const cloudMat = new THREE.ShaderMaterial({ vertexShader: CLOUDS.vertex, fragmentShader: CLOUDS.fragment, transparent: true, depthWrite: false, uniforms: { sun: { value: sun }, time: { value: 0 } } });
      globe.add(new THREE.Mesh(new THREE.SphereGeometry(1.014, 96, 96), cloudMat));

      globe.add(new THREE.Mesh(
        new THREE.SphereGeometry(1.16, 64, 64),
        new THREE.ShaderMaterial({ vertexShader: GLOW.vertex, fragmentShader: GLOW.fragment, side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }),
      ));

      // stars
      const N = 2600, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = Math.sqrt(1 - u * u);
        pos.set([r * Math.cos(a) * 60, u * 60, r * Math.sin(a) * 60], i * 3);
        const b = 0.35 + Math.random() * 0.65, warm = Math.random();
        col.set([b * (0.8 + warm * 0.2), b * 0.9, b * (1 - warm * 0.25)], i * 3);
      }
      const sg = new THREE.BufferGeometry();
      sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      sg.setAttribute('color', new THREE.BufferAttribute(col, 3));
      scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ size: 1.4, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.9 })));

      let w = 0, h = 0;
      let scroll = 0, target = 0, mx = 0, my = 0, tmx = 0, tmy = 0;
      const resize = () => {
        w = window.innerWidth; h = window.innerHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      const onScroll = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        target = max > 0 ? window.scrollY / max : 0;
      };
      const onMove = (e) => { tmx = e.clientX / w - 0.5; tmy = e.clientY / h - 0.5; };

      const ll = (lat, lon) => {
        const phi = (90 - lat) * D, th = (lon + 180) * D;
        return new THREE.Vector3(-Math.sin(phi) * Math.cos(th), Math.cos(phi), Math.sin(phi) * Math.sin(th));
      };
      const fwd = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3();

      const frame = (t) => {
        scroll += (target - scroll) * 0.05;
        mx += (tmx - mx) * 0.04; my += (tmy - my) * 0.04;
        const v = view(scroll);
        const narrow = camera.aspect < 0.9;

        const drift = reduce ? 0 : t * 0.0009;      // slow spin even when idle
        const lat = Math.max(-80, Math.min(80, v.lat - my * 6));
        const lon = v.lon + drift - mx * 8;
        const dist = v.dist * (narrow ? 1.35 : 1);
        camera.position.copy(ll(lat, lon)).multiplyScalar(dist);
        camera.up.set(0, 1, 0);
        camera.lookAt(0, 0, 0);

        // slide the globe around the screen with a view offset (NDC -> px)
        const sx = narrow ? v.x * 0.3 : v.x, sy = v.y;
        camera.setViewOffset(w, h, -sx * w / 2, sy * h / 2, w, h);

        // keep the sun on the camera's right so a lit crescent shows from every angle
        fwd.copy(camera.position).negate().normalize();
        right.crossVectors(fwd, camera.up).normalize();
        up.crossVectors(right, fwd);
        sun.set(0, 0, 0).addScaledVector(fwd, -0.85).addScaledVector(right, 0.55).addScaledVector(up, 0.25).normalize();

        // dim the globe when it sits behind centred text so the copy stays readable
        const k = (1 - Math.min(1, Math.abs(v.x))) * Math.min(1, Math.max(0, (v.y + 1.6) / 1.2));
        host.style.filter = `brightness(${1 - 0.55 * k})`;

        cloudMat.uniforms.time.value = reduce ? 0 : t * 0.001;
        renderer.render(scene, camera);
        raf = requestAnimationFrame(frame);
      };

      resize(); onScroll();
      raf = requestAnimationFrame(frame);
      window.addEventListener('resize', resize);
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('pointermove', onMove);
      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', resize);
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('pointermove', onMove);
        renderer.dispose();
        renderer.domElement.remove();
      };
    });

    return () => { dead = true; cleanup(); };
  }, []);

  return <div ref={ref} className="galaxy" aria-hidden="true" />;
}
