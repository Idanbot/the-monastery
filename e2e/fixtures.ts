import { spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { rm } from 'node:fs/promises';
import { createServer } from 'node:net';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { expect, test as base } from '@playwright/test';

type WorkerServers = {
  apiUrl: string;
  webUrl: string;
  logs: string[];
};

const repositoryRoot = process.cwd();
const delay = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const freePort = () =>
  new Promise<number>((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });

const captureProcess = (label: string, args: string[], env: NodeJS.ProcessEnv, logs: string[]) => {
  const executable = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const childEnv = { ...process.env, ...env };
  delete childEnv.NO_COLOR;
  delete childEnv.FORCE_COLOR;
  const child = spawn(executable, args, {
    cwd: repositoryRoot,
    env: childEnv,
    detached: process.platform !== 'win32',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  const capture = (chunk: Buffer) => {
    logs.push(`[${label}] ${chunk.toString()}`);
    if (logs.length > 2_000) logs.splice(0, logs.length - 2_000);
  };
  child.stdout?.on('data', capture);
  child.stderr?.on('data', capture);
  child.once('exit', (code, signal) => logs.push(`[${label}] exited code=${code} signal=${signal}\n`));
  return child;
};

const waitForUrl = async (url: string, child: ChildProcess, logs: string[]) => {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Server exited before ${url} became ready.\n${logs.slice(-30).join('')}`);
    }
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // The process is still starting.
    }
    await delay(200);
  }
  throw new Error(`Timed out waiting for ${url}.\n${logs.slice(-30).join('')}`);
};

const stopProcess = async (child: ChildProcess | undefined) => {
  if (!child || child.exitCode !== null || !child.pid) return;
  const signal = (name: NodeJS.Signals) => {
    try {
      if (process.platform === 'win32') child.kill(name);
      else process.kill(-child.pid!, name);
    } catch {
      // The process may have exited between checks.
    }
  };
  signal('SIGTERM');
  await Promise.race([once(child, 'exit'), delay(5_000)]);
  if (child.exitCode === null) signal('SIGKILL');
};

export const test = base.extend<{ attachWorkerLogs: void }, { workerServers: WorkerServers }>({
  workerServers: [
    async ({ browserName }, use, workerInfo) => {
      const logs: string[] = [];
      const [apiPort, webPort] = await Promise.all([freePort(), freePort()]);
      const apiUrl = `http://127.0.0.1:${apiPort}`;
      const webUrl = `http://127.0.0.1:${webPort}`;
      const databasePath = join(
        tmpdir(),
        `the-monastery-e2e-${browserName}-${process.pid}-${workerInfo.parallelIndex}.sqlite`
      );
      const databaseFiles = [databasePath, `${databasePath}-shm`, `${databasePath}-wal`];
      await Promise.all(databaseFiles.map((file) => rm(file, { force: true })));

      let apiProcess: ChildProcess | undefined;
      let webProcess: ChildProcess | undefined;
      try {
        apiProcess = captureProcess(
          'api',
          ['run', 'dev:api'],
          {
            HOST: '127.0.0.1',
            PORT: String(apiPort),
            THE_MONASTERY_DB_PATH: databasePath,
            THE_MONASTERY_API_RATE_LIMIT_MAX: '1000000'
          },
          logs
        );
        await waitForUrl(`${apiUrl}/api/health`, apiProcess, logs);

        webProcess = captureProcess(
          'web',
          ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(webPort), '--strictPort'],
          { THE_MONASTERY_API_URL: apiUrl },
          logs
        );
        await waitForUrl(webUrl, webProcess, logs);
        process.env.THE_MONASTERY_E2E_API_URL = apiUrl;
        await use({ apiUrl, webUrl, logs });
      } finally {
        delete process.env.THE_MONASTERY_E2E_API_URL;
        await Promise.all([stopProcess(webProcess), stopProcess(apiProcess)]);
        await Promise.all(databaseFiles.map((file) => rm(file, { force: true })));
      }
    },
    { scope: 'worker', timeout: 150_000 }
  ],
  baseURL: async ({ workerServers }, use) => {
    await use(workerServers.webUrl);
  },
  attachWorkerLogs: [
    async ({ workerServers }, use, testInfo) => {
      await use();
      if (testInfo.status !== testInfo.expectedStatus) {
        await testInfo.attach('worker-servers.log', {
          body: Buffer.from(workerServers.logs.join('')),
          contentType: 'text/plain'
        });
      }
    },
    { auto: true }
  ]
});

export { expect };
