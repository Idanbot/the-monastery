import { spawnSync } from 'node:child_process';

const dockerfile = process.argv[2] || 'Dockerfile';
const image = process.env.HADOLINT_IMAGE || 'hadolint/hadolint:latest-alpine';

const run = (command, args, options = {}) =>
  spawnSync(command, args, {
    stdio: 'inherit',
    ...options
  });

const localResult = run('hadolint', [dockerfile], { stdio: 'ignore' });

if (localResult.error?.code !== 'ENOENT') {
  const result = run('hadolint', [dockerfile]);
  process.exit(result.status ?? 1);
}

const dockerResult = run('docker', [
  'run',
  '--rm',
  '-v',
  `${process.cwd()}:/work:ro`,
  '-w',
  '/work',
  image,
  'hadolint',
  dockerfile
]);
process.exit(dockerResult.status ?? 1);
