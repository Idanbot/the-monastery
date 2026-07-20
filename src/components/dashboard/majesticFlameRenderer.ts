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

  // Cartoon flame silhouette in flame-local space: base at y = 0, tip near
  // y = 1, centered on x = 0. Scale and phase vary per ring so the cel bands
  // wobble independently. The tip curls into a licking fork and the edges are
  // anti-aliased so the flame reads organic instead of stamped.
  float silhouette(vec2 p, float scale, float phase, float time) {
    vec2 q = p / scale;
    float ny = clamp(q.y, 0.0, 1.0);
    float sway = sin(time * 3.2 + phase + ny * 4.6) * 0.055 * ny
      + sin(time * 6.9 + phase * 1.7 + ny * 9.5) * 0.02 * ny * ny;
    // Forked licking tip: the crest drifts sideways and splits.
    float curl = sin(time * 2.6 + phase * 2.3) * 0.05 * pow(ny, 2.5);
    float cx = q.x + sway + curl;
    float width = mix(0.30, 0.012, pow(ny, 0.78));
    width *= 1.0 + 0.13 * sin(time * 7.3 + phase + ny * 11.0);
    // Second lick gives the crest an organic fork.
    float lick = 1.0 - smoothstep(0.0, 0.028, abs(abs(cx) - width * 0.62) + (ny - 0.86) * 0.12);
    float shape = 1.0 - smoothstep(width - 0.012, width + 0.008, abs(cx));
    shape = max(shape, lick * smoothstep(0.68, 0.86, ny));
    shape *= smoothstep(0.0, 0.04, ny);
    shape *= 1.0 - smoothstep(0.86, 1.0, ny);
    return shape;
  }

  void main() {
    vec2 uv = vUv;
    float time = uTime * 0.001;

    // Playful squash-and-stretch bounce around the base.
    float bounce = sin(time * 5.1);
    float stretchY = 1.0 + 0.08 * bounce;
    float squashX = 1.0 - 0.05 * bounce;
    vec2 p = vec2((uv.x - 0.5) * squashX, (uv.y - 0.07) / (0.86 * stretchY));

    // Nested silhouettes give crisp cartoon bands.
    float outer = silhouette(p, 1.0, 0.0, time);
    float mid = silhouette(p, 0.68, 1.9, time);
    float core = silhouette(p, 0.42, 3.8, time);
    float heart = silhouette(p, 0.22, 5.1, time);

    vec3 ruby = vec3(0.82, 0.10, 0.02);
    vec3 ember = vec3(1.0, 0.42, 0.02);
    vec3 gold = vec3(1.0, 0.80, 0.22);
    vec3 white = vec3(1.0, 0.96, 0.78);
    vec3 color = ruby;
    color = mix(color, ember, clamp(mid * 1.25, 0.0, 1.0));
    color = mix(color, gold, clamp(core * 1.25, 0.0, 1.0));
    color = mix(color, white, clamp(heart * 1.3, 0.0, 1.0));
    // Heat rises: brighten the upper half a touch.
    color *= 1.0 + 0.12 * clamp(p.y, 0.0, 1.0);
    // Gentle global flicker.
    color *= 0.96 + 0.05 * sin(time * 9.1) * sin(time * 3.7 + 1.3);
    float alpha = clamp(outer * 0.98 + mid * 0.4 + core * 0.3, 0.0, 1.0);

    // Soft luminous halo hugging the flame body.
    float glowDist = length(vec2(p.x * 1.5, (p.y - 0.34) * 1.1));
    float glow = exp(-glowDist * glowDist * 5.5) * 0.5;
    glow *= 0.9 + 0.1 * sin(time * 6.3);
    color = mix(color, ember, glow * (1.0 - alpha) * 0.9);
    alpha = clamp(alpha + glow * (1.0 - alpha), 0.0, 1.0);

    // Warm pool of light at the base.
    float baseGlow = exp(-pow(length(vec2(p.x * 2.2, (p.y + 0.03) * 3.0)), 2.0) * 4.0) * 0.35;
    color = mix(color, gold, baseGlow * (1.0 - alpha) * 0.7);
    alpha = clamp(alpha + baseGlow * (1.0 - alpha), 0.0, 1.0);

    // Rising ember sparks.
    for (int i = 0; i < 4; i++) {
      float fi = float(i);
      float speed = 0.42 + fi * 0.06;
      float cycle = fract(time * speed + fi * 0.29);
      vec2 sparkPos = vec2(
        sin(fi * 17.3 + time * (1.2 + fi * 0.35)) * (0.06 + 0.1 * cycle),
        0.5 + cycle * 0.46
      );
      float radius = 0.02 * (1.0 - cycle * 0.6);
      float spark = 1.0 - smoothstep(radius * 0.4, radius, distance(p, sparkPos));
      spark *= smoothstep(0.02, 0.16, cycle) * (1.0 - smoothstep(0.55, 1.0, cycle));
      color = mix(color, white, spark * 0.85);
      alpha = clamp(alpha + spark, 0.0, 1.0);
    }

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
