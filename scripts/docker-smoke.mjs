import { spawnSync } from 'node:child_process';

const image = process.argv[2];

if (!image) {
  console.error('Usage: npm run docker:smoke -- <image>');
  process.exit(2);
}

const name = `the-monastery-smoke-${Date.now()}`;

const run = (args, options = {}) => {
  const result = spawnSync('docker', args, { encoding: 'utf8', ...options });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `docker ${args.join(' ')} failed`);
  }
  return (result.stdout || '').trim();
};

const waitForJson = async (url, predicate, timeoutMs = 30_000) => {
  const startedAt = Date.now();
  let lastError;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      const body = await response.json();
      if (response.ok && predicate(body)) return body;
      lastError = new Error(`${response.status} ${JSON.stringify(body)}`);
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, 750));
  }

  throw lastError || new Error(`Timed out waiting for ${url}`);
};

let failed = false;

try {
  run(['rm', '-f', name], { stdio: 'ignore' });
  run([
    'run',
    '--rm',
    '-d',
    '--name',
    name,
    '-p',
    '127.0.0.1::3000',
    '-e',
    'NODE_ENV=production',
    '-e',
    'HOST=0.0.0.0',
    '-e',
    'PORT=3000',
    '-e',
    'LOG_LEVEL=warn',
    image
  ]);

  const portLine = run(['port', name, '3000/tcp']);
  const port = portLine.match(/:(\d+)$/)?.[1];
  if (!port) throw new Error(`Could not resolve mapped port from: ${portLine}`);

  const baseUrl = `http://127.0.0.1:${port}`;
  await waitForJson(`${baseUrl}/api/health`, (body) => body.ok === true && typeof body.version === 'string');
  await waitForJson(`${baseUrl}/api/profiles`, (body) => Array.isArray(body.profiles));
  console.log(`Docker smoke passed for ${image}`);
} catch (error) {
  failed = true;
  console.error(error instanceof Error ? error.message : error);
  try {
    run(['logs', name], { stdio: 'inherit' });
  } catch {
    // Container may not have started.
  }
} finally {
  try {
    run(['rm', '-f', name], { stdio: 'ignore' });
  } catch {
    // Best-effort cleanup.
  }
}

process.exit(failed ? 1 : 0);
