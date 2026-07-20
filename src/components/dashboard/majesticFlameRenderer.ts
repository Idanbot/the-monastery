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
  // wobble independently.
  float silhouette(vec2 p, float scale, float phase, float time) {
    vec2 q = p / scale;
    float ny = clamp(q.y, 0.0, 1.0);
    float sway = sin(time * 3.2 + phase + ny * 4.6) * 0.06 * ny
      + sin(time * 6.9 + phase * 1.7 + ny * 9.5) * 0.022 * ny * ny;
    float cx = q.x + sway;
    float width = mix(0.30, 0.015, pow(ny, 0.82));
    width *= 1.0 + 0.16 * sin(time * 7.3 + phase + ny * 11.0);
    float shape = 1.0 - smoothstep(width * 0.72, width, abs(cx));
    shape *= smoothstep(0.0, 0.05, ny);
    shape *= 1.0 - smoothstep(0.82, 1.0, ny);
    return shape;
  }

  void main() {
    vec2 uv = vUv;
    float time = uTime * 0.001;

    // Playful squash-and-stretch bounce around the base.
    float bounce = sin(time * 5.1);
    float stretchY = 1.0 + 0.085 * bounce;
    float squashX = 1.0 - 0.055 * bounce;
    vec2 p = vec2((uv.x - 0.5) * squashX, (uv.y - 0.07) / (0.86 * stretchY));

    // Nested silhouettes give crisp cartoon bands.
    float outer = silhouette(p, 1.0, 0.0, time);
    float mid = silhouette(p, 0.68, 1.9, time);
    float core = silhouette(p, 0.4, 3.8, time);

    vec3 ruby = vec3(0.87, 0.11, 0.02);
    vec3 ember = vec3(1.0, 0.44, 0.02);
    vec3 gold = vec3(1.0, 0.83, 0.24);
    vec3 color = ruby;
    color = mix(color, ember, clamp(mid * 1.2, 0.0, 1.0));
    color = mix(color, gold, clamp(core * 1.2, 0.0, 1.0));
    float alpha = clamp(outer * 0.98 + mid * 0.4 + core * 0.3, 0.0, 1.0);

    // Rising ember sparks.
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      float cycle = fract(time * 0.5 + fi * 0.37);
      vec2 sparkPos = vec2(
        sin(fi * 17.3 + time * (1.2 + fi * 0.35)) * 0.13 * cycle,
        0.62 + cycle * 0.34
      );
      float radius = 0.022 * (1.0 - cycle * 0.55);
      float spark = 1.0 - smoothstep(radius * 0.55, radius, distance(p, sparkPos));
      spark *= smoothstep(0.02, 0.18, cycle) * (1.0 - smoothstep(0.6, 1.0, cycle));
      color = mix(color, gold, spark * 0.9);
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
