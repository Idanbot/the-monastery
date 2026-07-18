import * as THREE from 'three';

type MajesticFlameOptions = { onReady?: () => void };

const vertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  varying vec2 vUv;

  float hash(vec2 point) {
    return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 point) {
    vec2 cell = floor(point);
    vec2 local = fract(point);
    local = local * local * (3.0 - 2.0 * local);
    return mix(
      mix(hash(cell), hash(cell + vec2(1.0, 0.0)), local.x),
      mix(hash(cell + vec2(0.0, 1.0)), hash(cell + vec2(1.0, 1.0)), local.x),
      local.y
    );
  }

  float fbm(vec2 point) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int octave = 0; octave < 4; octave++) {
      value += amplitude * noise(point);
      point = point * 2.03 + vec2(7.1, 3.7);
      amplitude *= 0.5;
    }
    return value;
  }

  float flameLobe(
    vec2 uv,
    float offset,
    float width,
    float height,
    float phase,
    float time
  ) {
    float normalizedY = clamp(uv.y / height, 0.0, 1.0);
    float turbulence = fbm(vec2((uv.x + phase) * 5.6, uv.y * 3.6 - time * 2.0 + phase));
    float sway = sin(uv.y * 8.5 + time * 2.4 + phase * 7.0) * (0.02 + normalizedY * 0.07);
    float center = (uv.x - 0.5 - offset) + sway + (turbulence - 0.5) * 0.13 * normalizedY;
    float taper = width * pow(max(0.0, 1.0 - normalizedY), 0.62);
    float edge = taper * (0.78 + turbulence * 0.34);
    float shape = 1.0 - smoothstep(edge - 0.018, edge + 0.04, abs(center));
    shape *= smoothstep(0.005, 0.075, uv.y);
    shape *= 1.0 - smoothstep(height - 0.14, height + 0.02, uv.y + turbulence * 0.055);
    return shape;
  }

  void main() {
    vec2 uv = vUv;
    float time = uTime * 0.001;
    float mainFlame = flameLobe(uv, 0.0, 0.34, 1.0, 0.0, time);
    float leftTongue = flameLobe(uv, -0.16, 0.18, 0.72, 1.7, time);
    float rightTongue = flameLobe(uv, 0.16, 0.16, 0.62, 3.1, time);
    float body = max(mainFlame, max(leftTongue * 0.92, rightTongue * 0.88));
    float middle = flameLobe(uv, 0.0, 0.245, 0.82, 0.8, time);
    float core = flameLobe(uv, -0.01, 0.125, 0.58, 2.2, time);
    float aura = flameLobe(uv, 0.0, 0.43, 1.03, 1.1, time) * 0.2;

    vec3 ruby = vec3(0.72, 0.015, 0.008);
    vec3 ember = vec3(0.98, 0.14, 0.005);
    vec3 gold = vec3(1.0, 0.55, 0.025);
    vec3 sunlight = vec3(1.0, 0.91, 0.38);
    vec3 whiteHot = vec3(1.0, 0.995, 0.86);
    vec3 color = mix(ruby, ember, clamp(body * 1.2, 0.0, 1.0));
    color = mix(color, gold, clamp(middle * 0.9, 0.0, 1.0));
    color = mix(color, sunlight, clamp(core * 0.82, 0.0, 1.0));
    color = mix(color, whiteHot, clamp(core * core * 0.72, 0.0, 1.0));

    vec2 sparkSpace = vec2(uv.x * 12.0, (uv.y + time * 0.28) * 15.0);
    vec2 sparkCell = floor(sparkSpace);
    vec2 sparkPoint = vec2(hash(sparkCell + 3.4), hash(sparkCell + 9.7));
    float spark = 1.0 - smoothstep(0.025, 0.12, distance(fract(sparkSpace), sparkPoint));
    spark *= step(0.9, hash(sparkCell + 12.6));
    spark *= smoothstep(0.3, 0.96, uv.y) * (1.0 - smoothstep(0.22, 0.48, abs(uv.x - 0.5)));
    color += vec3(1.0, 0.62, 0.08) * spark;

    float baseGlow = (1.0 - smoothstep(0.08, 0.48, distance(uv, vec2(0.5, 0.14)))) * 0.2;
    float alpha = clamp(body * 0.96 + aura + baseGlow + spark * 0.9, 0.0, 1.0);

    gl_FragColor = vec4(color, alpha);
  }
`;

export function mountMajesticFlame(canvas: HTMLCanvasElement, { onReady }: MajesticFlameOptions = {}) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'low-power',
    preserveDrawingBuffer: true
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  camera.position.z = 1;
  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending
  });
  const flame = new THREE.Mesh(geometry, material);
  scene.add(flame);

  let ready = false;
  let pageVisible = !document.hidden;
  const resize = () => {
    const bounds = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(bounds.width || 32));
    const height = Math.max(1, Math.round(bounds.height || 32));
    renderer.setDrawingBufferSize(width, height, Math.min(window.devicePixelRatio || 1, 2));
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  resize();

  const onVisibilityChange = () => {
    pageVisible = !document.hidden;
  };
  document.addEventListener('visibilitychange', onVisibilityChange);

  renderer.setAnimationLoop((time) => {
    if (!pageVisible) return;
    material.uniforms.uTime.value = time;
    renderer.render(scene, camera);
    if (!ready) {
      ready = true;
      canvas.dataset.flameReady = 'true';
      onReady?.();
    }
  });

  return {
    dispose() {
      renderer.setAnimationLoop(null);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      resizeObserver.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      delete canvas.dataset.flameReady;
    }
  };
}
