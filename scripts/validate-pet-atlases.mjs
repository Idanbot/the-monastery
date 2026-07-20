import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath, URL } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const manifestDir = join(root, 'src/domain/generated');
const expectedAnimations = new Set([
  'idle_breathe',
  'idle_blink',
  'look_left_right',
  'idle_fidget',
  'yawn',
  'sleep',
  'wake_up',
  'streak_lost',
  'ready_bounce',
  'focused_idle',
  'energized_bounce',
  'small_success',
  'big_success',
  'power_up',
  'powered_idle',
  'celebrate'
]);
const maxAtlasBytes = 2.25 * 1024 * 1024;

const fail = (pet, message) => {
  throw new Error(`${pet}: ${message}`);
};

function readWebpDimensions(buffer, pet) {
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') {
    fail(pet, 'atlas is not a WebP RIFF file');
  }
  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const type = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const data = offset + 8;
    if (type === 'VP8X' && size >= 10) {
      return {
        width: 1 + buffer.readUIntLE(data + 4, 3),
        height: 1 + buffer.readUIntLE(data + 7, 3)
      };
    }
    if (type === 'VP8L' && size >= 5 && buffer[data] === 0x2f) {
      const bits = buffer.readUInt32LE(data + 1);
      return {
        width: 1 + (bits & 0x3fff),
        height: 1 + ((bits >>> 14) & 0x3fff)
      };
    }
    offset = data + size + (size % 2);
  }
  fail(pet, 'atlas has no supported VP8X/VP8L dimensions');
}

export function validatePetAtlas(pet, manifest, atlas) {
  const expectedSize = manifest.frameWidth * manifest.columns;
  const dimensions = readWebpDimensions(atlas, pet);
  if (manifest.format !== 'webp') fail(pet, `manifest format is ${manifest.format || 'missing'}`);
  if (manifest.frameWidth !== 128 || manifest.frameHeight !== 128) fail(pet, 'frames must be 128x128');
  if (manifest.columns !== 16 || manifest.rows !== 16) fail(pet, 'atlas grid must be 16x16');
  if (dimensions.width !== expectedSize || dimensions.height !== manifest.frameHeight * manifest.rows) {
    fail(pet, `atlas is ${dimensions.width}x${dimensions.height}, expected ${expectedSize}x${expectedSize}`);
  }
  if (atlas.length > maxAtlasBytes) fail(pet, `atlas exceeds 2.25 MiB (${atlas.length} bytes)`);

  const hash = createHash('sha256').update(atlas).digest('hex').slice(0, 12);
  if (hash !== manifest.version) fail(pet, `manifest hash ${manifest.version} does not match ${hash}`);

  const animationNames = Object.keys(manifest.animations || {});
  const missing = [...expectedAnimations].filter((name) => !animationNames.includes(name));
  const extra = animationNames.filter((name) => !expectedAnimations.has(name));
  if (missing.length || extra.length) fail(pet, `animation mismatch; missing=${missing}, extra=${extra}`);
  for (const [name, animation] of Object.entries(manifest.animations)) {
    if (animation.row < 0 || animation.row >= 16) fail(pet, `${name} has invalid row ${animation.row}`);
    if (animation.frameCount < 1 || animation.frameCount > 16) {
      fail(pet, `${name} has invalid frame count ${animation.frameCount}`);
    }
  }

  const validation = manifest.validation || {};
  if (!validation.transparentCorners) fail(pet, 'atlas corners must be transparent');
  if (validation.opaqueFrames !== validation.expectedFrames) {
    fail(pet, `only ${validation.opaqueFrames}/${validation.expectedFrames} frames contain a sprite`);
  }
  if (validation.maxCentroidDrift > 4) {
    fail(pet, `centroid drift ${validation.maxCentroidDrift}px exceeds 4px`);
  }
  if (validation.maxBaselineDrift > 2) {
    fail(pet, `baseline drift ${validation.maxBaselineDrift}px exceeds 2px`);
  }
  return { bytes: atlas.length, dimensions };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const manifests = readdirSync(manifestDir)
    .filter((name) => name.endsWith('Atlas.json'))
    .sort();
  if (!manifests.length) throw new Error('No pet atlas manifests found');
  for (const name of manifests) {
    const pet = basename(name, 'Atlas.json');
    const manifest = JSON.parse(readFileSync(join(manifestDir, name), 'utf8'));
    const atlasPath = join(root, 'public/pets', pet, `${pet}-spritesheet.${manifest.format || 'webp'}`);
    const result = validatePetAtlas(pet, manifest, readFileSync(atlasPath));
    console.log(`PASS ${pet}: ${result.dimensions.width}x${result.dimensions.height}, ${result.bytes} bytes`);
  }
}
