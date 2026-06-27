#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { access, mkdtemp, rm } from 'node:fs/promises';
import { constants } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const baseUrl = (process.env.AUDIT_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const chromeCandidates = [
  process.env.CHROME_BIN,
  '/snap/bin/chromium',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
].filter(Boolean);

async function findChrome() {
  for (const candidate of chromeCandidates) {
    try {
      await access(candidate, constants.X_OK);
      return candidate;
    } catch {
      // try next candidate
    }
  }
  throw new Error(`No Chromium binary found. Set CHROME_BIN to run the browser audit.`);
}

async function fetchJson(url, timeoutMs = 8000) {
  const started = Date.now();
  let lastError;
  while (Date.now() - started < timeoutMs) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (response.ok) return response.json();
      lastError = new Error(`${response.status} ${response.statusText}`);
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timeout);
    }
    await sleep(200);
  }
  throw lastError ?? new Error(`Timed out fetching ${url}`);
}

async function createPageTarget(port) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);
  try {
    const response = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, {
      method: 'PUT',
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.nextId = 1;
    this.pending = new Map();
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', reject, { once: true });
      this.ws.addEventListener('message', (event) => {
        const message = JSON.parse(event.data);
        if (!message.id || !this.pending.has(message.id)) return;
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(`${message.error.message}: ${message.error.data ?? ''}`));
        else resolve(message.result ?? {});
      });
    });
  }

  send(method, params = {}, sessionId, timeoutMs = 20000) {
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    this.ws.send(JSON.stringify(payload));
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP command timed out: ${method}`));
      }, timeoutMs);
      this.pending.set(id, {
        resolve: (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        },
      });
    });
  }

  close() {
    this.ws?.close();
  }
}

function seedLocalStorageSource() {
  const user = {
    id: 1,
    username: 'ops_audit',
    displayName: 'Ops Audit',
    name: 'Ops Audit',
    avatar: 'cat',
    level: 9,
    totalXp: 3600,
    role: 'user',
    title: 'Ops Auditor',
    country: 'US',
    bio: '',
    createdAt: '2026-06-27T00:00:00.000Z',
  };
  const targetUser = {
    id: 2,
    username: 'audit_target',
    displayName: 'Audit Target',
    name: 'Audit Target',
    avatar: 'cat',
    level: 4,
    totalXp: 900,
    role: 'user',
    title: 'Practice Rival',
    country: 'US',
    bio: '',
    createdAt: '2026-06-27T00:00:00.000Z',
  };
  return `
    (() => {
      const user = ${JSON.stringify(user)};
      const targetUser = ${JSON.stringify(targetUser)};
      localStorage.setItem('cyberpaw_current_user', JSON.stringify(user));
      localStorage.setItem('cyberpaw_users', JSON.stringify({
        ops_audit: { passwordHash: 'audit', user },
        audit_target: { passwordHash: 'audit', user: targetUser }
      }));
      localStorage.setItem('cyberpaw_inventory', JSON.stringify(Array.from({ length: 120 }, (_, index) => index + 1)));
      localStorage.setItem('cyberpaw_defenses', JSON.stringify({
        firewallLevel: 1,
        idsLevel: 1,
        honeypotLevel: 0,
        encryptionLevel: 1,
        backupLevel: 0,
        antiVirusLevel: 1,
        wafLevel: 0,
        totalDefensePower: 35
      }));
      localStorage.setItem('cyberpaw_defenses_2', JSON.stringify({
        firewallLevel: 1,
        idsLevel: 1,
        honeypotLevel: 0,
        encryptionLevel: 1,
        backupLevel: 0,
        antiVirusLevel: 1,
        wafLevel: 0,
        totalDefensePower: 18
      }));
      return Boolean(localStorage.getItem('cyberpaw_current_user'));
    })();
  `;
}

async function main() {
  const chrome = await findChrome();
  const profileDir = await mkdtemp(join(tmpdir(), 'fokimini-ops-audit-'));
  const port = 9300 + Math.floor(Math.random() * 500);
  const chromeArgs = [
    '--headless=new',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1440,1100',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    'about:blank',
  ];
  if (process.env.CHROME_NO_SANDBOX !== '1') chromeArgs.splice(1, 0, '--no-sandbox');

  const browser = spawn(chrome, chromeArgs, { stdio: ['ignore', 'pipe', 'pipe'] });
  const stderr = [];
  browser.stderr.on('data', (chunk) => stderr.push(chunk.toString()));
  console.error(`[audit] launched ${chrome} on CDP port ${port}`);

  let cdp;
  try {
    console.error('[audit] waiting for Chromium CDP endpoint');
    await fetchJson(`http://127.0.0.1:${port}/json/version`, 30000);
    const target = await createPageTarget(port);
    cdp = new CdpClient(target.webSocketDebuggerUrl);
    await cdp.connect();
    console.error('[audit] connected to Chromium');

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    async function evaluate(expression, awaitPromise = false) {
      let lastError;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const result = await cdp.send('Runtime.evaluate', {
            expression,
            awaitPromise,
            returnByValue: true,
            userGesture: true,
          });
          if (result.exceptionDetails) {
            throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
          }
          return result.result?.value;
        } catch (error) {
          lastError = error;
          if (!String(error.message).includes('CDP command timed out') || attempt > 0) break;
          await sleep(500);
        }
      }
      throw lastError;
    }

    async function waitFor(description, expression, timeoutMs = 12000) {
      const started = Date.now();
      while (Date.now() - started < timeoutMs) {
        if (await evaluate(expression).catch(() => false)) return;
        await sleep(250);
      }
      const snapshot = await pageSnapshot(evaluate);
      throw new Error(`Timed out waiting for ${description}.\n${snapshot}`);
    }

    async function clickByText(text, exact = false) {
      const clicked = await evaluate(`
        (() => {
          const expected = ${JSON.stringify(text)};
          const exact = ${JSON.stringify(exact)};
          const nodes = [...document.querySelectorAll('button, a')];
          const node = nodes.find((item) => {
            const label = (item.innerText || item.textContent || '').replace(/\\s+/g, ' ').trim();
            return exact ? label === expected : label.includes(expected);
          });
          if (!node) return false;
          node.scrollIntoView({ block: 'center', inline: 'center' });
          node.click();
          return true;
        })()
      `);
      if (!clicked) {
        const snapshot = await pageSnapshot(evaluate);
        throw new Error(`Could not click text "${text}".\n${snapshot}`);
      }
    }

    async function openQueuedTool(expectedText) {
      const opened = await evaluate(`
        (() => {
          const expected = ${JSON.stringify(expectedText)};
          const buttons = [...document.querySelectorAll('button')].filter((button) => button.innerText.includes('PLAY GUI'));
          const button = buttons.find((candidate) => candidate.innerText.includes(expected)) ?? buttons[0];
          if (!button) return null;
          const label = button.innerText.replace(/\\s+/g, ' ').trim();
          button.scrollIntoView({ block: 'center' });
          button.click();
          return label;
        })()
      `);
      if (!opened || !opened.toUpperCase().includes(expectedText.toUpperCase())) {
        const snapshot = await pageSnapshot(evaluate);
        throw new Error(`Expected queued tool "${expectedText}", got ${opened ?? 'nothing'}.\n${snapshot}`);
      }
      console.error(`[audit] opened ${opened}`);
      return opened;
    }

    async function readModalState(openedTool) {
      return evaluate(`
        (() => {
          const text = document.body.innerText;
          const gateStart = text.indexOf('Step Gate');
          const gateEnd = text.indexOf('Counter Stack');
          const gateText = gateStart >= 0
            ? text.slice(gateStart, gateEnd > gateStart ? gateEnd : gateStart + 700)
            : text;
          const scoreMatch = gateText.match(/(\\d+)\\/100/);
          const commit = [...document.querySelectorAll('button')].find((button) => /Commit Segment|Complete VS Step/.test(button.innerText));
          return {
            openedTool: ${JSON.stringify(openedTool)},
            score: scoreMatch ? Number(scoreMatch[1]) : null,
            commitText: commit ? commit.innerText.replace(/\\s+/g, ' ').trim() : null,
            commitDisabled: commit ? Boolean(commit.disabled) : null,
            fallbackVisible: text.includes('Ops Circuit'),
            modalVisible: text.includes('Play the simuletool GUI'),
          };
        })()
      `);
    }

    async function assertSubmittable(state, label, expectedSubmit = 'Complete VS Step') {
      if (
        !state.modalVisible ||
        state.fallbackVisible ||
        state.commitText !== expectedSubmit ||
        state.commitDisabled ||
        (state.score !== null && state.score < 50)
      ) {
        const snapshot = await pageSnapshot(evaluate);
        throw new Error(`${label} modal did not become submittable: ${JSON.stringify(state)}\n${snapshot}`);
      }
      console.error(`[audit] ${label} modal is submittable`);
    }

    async function submitStep() {
      await evaluate(`
        (() => {
          const button = [...document.querySelectorAll('button')].find((item) => /Complete VS Step/.test(item.innerText));
          button?.click();
          return true;
        })()
      `);
    }

    async function fillFirstVisibleInput(value, type = '') {
      const filled = await evaluate(`
        (() => {
          const expectedType = ${JSON.stringify(type)};
          const value = ${JSON.stringify(value)};
          const inputs = [...document.querySelectorAll('input')];
          const input = inputs.find((candidate) => {
            const rect = candidate.getBoundingClientRect();
            const visible = rect.width > 0 && rect.height > 0;
            return visible && (!expectedType || candidate.type === expectedType);
          });
          if (!input) return false;
          input.scrollIntoView({ block: 'center' });
          const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
          setter?.call(input, value);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        })()
      `);
      if (!filled) {
        const snapshot = await pageSnapshot(evaluate);
        throw new Error(`Could not fill visible input with "${value}".\n${snapshot}`);
      }
    }

    console.error(`[audit] runtime sanity: ${await evaluate('location.href')}`);
    console.error(`[audit] priming origin ${baseUrl}/fokimini/`);
    await cdp.send('Page.navigate', { url: `${baseUrl}/fokimini/` });
    await waitFor('origin document ready', `document.readyState === 'interactive' || document.readyState === 'complete'`, 18000);
    const seeded = await evaluate(seedLocalStorageSource());
    if (!seeded) {
      const snapshot = await pageSnapshot(evaluate);
      throw new Error(`Could not seed audit user into localStorage.\n${snapshot}`);
    }
    console.error('[audit] audit user seeded in localStorage');

    console.error(`[audit] navigating to ${baseUrl}/fokimini/vs`);
    await cdp.send('Page.navigate', { url: `${baseUrl}/fokimini/vs` });
    await waitFor('VS target selector', `[...document.querySelectorAll('button')].some((button) => button.innerText.includes('Audit Target') && button.innerText.includes('Start Timed Ops'))`, 18000);
    console.error('[audit] target selector ready');
    await clickByText('Audit Target');
    await waitFor('ops queue', `Boolean(document.body?.innerText.includes('Simuletool Queue') && document.body?.innerText.includes('DNS Lookup GUI'))`);
    await evaluate('Math.random = () => 0.99');
    console.error('[audit] ops queue ready');

    const openedTool = await evaluate(`
      (() => {
        const buttons = [...document.querySelectorAll('button')].filter((button) => button.innerText.includes('PLAY GUI'));
        if (!buttons[0]) return null;
        const label = buttons[0].innerText.replace(/\\s+/g, ' ').trim();
        buttons[0].scrollIntoView({ block: 'center' });
        buttons[0].click();
        return label;
      })()
    `);
    if (!openedTool) throw new Error('No PLAY GUI button was available in the active ops queue.');
    console.error(`[audit] opened ${openedTool}`);

    await waitFor('DNS lookup modal', `Boolean(document.body?.innerText.includes('DNS Lookup Tool') && document.body?.innerText.includes('Counter Stack'))`);
    console.error('[audit] modal ready');
    await clickByText('Shape traffic through the allowed service lane', true);
    await clickByText('Correlate timestamps before taking the next action', true);
    await clickByText('cyberpaws.kids');
    await waitFor('trace button', `Boolean(document.body?.innerText.includes('DNS Resolution Path') && document.body?.innerText.includes('Trace Path'))`);
    for (let trace = 1; trace <= 4; trace++) {
      await clickByText('Trace Path');
      console.error(`[audit] DNS trace ${trace}/4 running`);
      await sleep(4300);
    }

    const modalState = await evaluate(`
      (() => {
        const text = document.body.innerText;
        const gateStart = text.indexOf('Step Gate');
        const gateEnd = text.indexOf('Counter Stack');
        const gateText = gateStart >= 0
          ? text.slice(gateStart, gateEnd > gateStart ? gateEnd : gateStart + 700)
          : text;
        const scoreMatch = gateText.match(/(\\d+)\\/100/);
        const commit = [...document.querySelectorAll('button')].find((button) => /Commit Segment|Complete VS Step/.test(button.innerText));
        return {
          openedTool: ${JSON.stringify(openedTool)},
          score: scoreMatch ? Number(scoreMatch[1]) : null,
          commitText: commit ? commit.innerText.replace(/\\s+/g, ' ').trim() : null,
          commitDisabled: commit ? Boolean(commit.disabled) : null,
          fallbackVisible: text.includes('Ops Circuit'),
          modalVisible: text.includes('Play the simuletool GUI'),
        };
      })()
    `);

    if (
      !modalState.modalVisible ||
      modalState.fallbackVisible ||
      modalState.commitDisabled ||
      (modalState.score !== null && modalState.score < 50)
    ) {
      const snapshot = await pageSnapshot(evaluate);
      throw new Error(`Ops modal did not become submittable: ${JSON.stringify(modalState)}\n${snapshot}`);
    }
    console.error('[audit] modal is submittable');

    await evaluate(`
      (() => {
        const button = [...document.querySelectorAll('button')].find((item) => /Commit Segment|Complete VS Step/.test(item.innerText));
        button?.click();
        return true;
      })()
    `);
    await waitFor('chain segment feed', `Boolean(document.body?.innerText.includes('completed chain segment 1/2') && document.body?.innerText.includes('Advanced Port Scan'))`);
    console.error('[audit] segment committed and next chain segment visible');

    const openedSecondTool = await evaluate(`
      (() => {
        const buttons = [...document.querySelectorAll('button')].filter((button) => button.innerText.includes('PLAY GUI'));
        if (!buttons[0]) return null;
        const label = buttons[0].innerText.replace(/\\s+/g, ' ').trim();
        buttons[0].scrollIntoView({ block: 'center' });
        buttons[0].click();
        return label;
      })()
    `);
    if (!openedSecondTool || !openedSecondTool.includes('Advanced Port Scan')) {
      throw new Error(`Expected Advanced Port Scan as second chain segment, got ${openedSecondTool ?? 'nothing'}.`);
    }
    console.error(`[audit] opened ${openedSecondTool}`);

    await waitFor('Nmap port scanner modal', `Boolean(document.body?.innerText.includes('Nmap Port Scanner') && document.body?.innerText.includes('Counter Stack'))`);
    console.error('[audit] Nmap modal ready');
    await clickByText('Shape traffic through the allowed service lane', true);
    await clickByText('Correlate timestamps before taking the next action', true);
    await clickByText('Bank Server');
    await clickByText('Full Scan');
    await clickByText('LAUNCH SCAN');
    console.error('[audit] Nmap full scan running');
    await waitFor('Nmap full scan completion', `Boolean(document.body?.innerText.includes('Scans: 1') || document.body?.innerText.includes('OS Guess'))`, 45000);

    const nmapModalState = await evaluate(`
      (() => {
        const text = document.body.innerText;
        const gateStart = text.indexOf('Step Gate');
        const gateEnd = text.indexOf('Counter Stack');
        const gateText = gateStart >= 0
          ? text.slice(gateStart, gateEnd > gateStart ? gateEnd : gateStart + 700)
          : text;
        const scoreMatch = gateText.match(/(\\d+)\\/100/);
        const commit = [...document.querySelectorAll('button')].find((button) => /Commit Segment|Complete VS Step/.test(button.innerText));
        return {
          openedTool: ${JSON.stringify(openedSecondTool)},
          score: scoreMatch ? Number(scoreMatch[1]) : null,
          commitText: commit ? commit.innerText.replace(/\\s+/g, ' ').trim() : null,
          commitDisabled: commit ? Boolean(commit.disabled) : null,
          fallbackVisible: text.includes('Ops Circuit'),
          modalVisible: text.includes('Play the simuletool GUI'),
        };
      })()
    `);

    if (
      !nmapModalState.modalVisible ||
      nmapModalState.fallbackVisible ||
      nmapModalState.commitText !== 'Complete VS Step' ||
      nmapModalState.commitDisabled ||
      (nmapModalState.score !== null && nmapModalState.score < 50)
    ) {
      const snapshot = await pageSnapshot(evaluate);
      throw new Error(`Nmap modal did not become submittable: ${JSON.stringify(nmapModalState)}\n${snapshot}`);
    }
    console.error('[audit] Nmap modal is submittable');

    await evaluate(`
      (() => {
        const button = [...document.querySelectorAll('button')].find((item) => /Complete VS Step/.test(item.innerText));
        button?.click();
        return true;
      })()
    `);
    await waitFor('first VS step completion', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('STEPS 1/44') &&
          text.includes('STEP 2 · WEB ANALYSIS ACTIVE') &&
          text.toUpperCase().includes('SQL SAFARI');
      })()
    `, 12000);
    console.error('[audit] first VS step completed and next ordered step visible');

    const openedSqlSafari = await openQueuedTool('SQL Safari');
    await waitFor('SQL Safari modal', `Boolean(document.body?.innerText.includes('SQL Safari') && document.body?.innerText.includes('Counter Stack'))`);
    await clickByText('Use a narrow app-layer test and respect blocked patterns', true);
    await clickByText('Pick the smallest scoped fix path before retrying', true);
    await clickByText('The Sneaky Quote');
    await waitFor('SQL Safari level ready', `Boolean(document.body?.innerText.includes('Payloads:') && document.body?.innerText.includes('Set Input'))`);
    await clickByText("' OR '1'='1");
    await waitFor('SQL Safari payload selected', `Boolean(document.body?.innerText.includes('Run Query'))`);
    await clickByText('Run Query');
    await waitFor('SQL Safari score ready', `Boolean(document.body?.innerText.includes('Injection Detected!') && document.body?.innerText.includes('Operation run is strong enough'))`);
    const sqlSafariState = await readModalState(openedSqlSafari);
    await assertSubmittable(sqlSafariState, 'SQL Safari');
    await submitStep();
    await waitFor('second VS step completion', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('STEPS 2/44') &&
          text.includes('STEP 3 · ACCESS ACTIVE') &&
          text.toUpperCase().includes('SQL INJECTOR GUI');
      })()
    `, 12000);
    console.error('[audit] second VS step completed and SQL Injector is next');

    const openedSqlInjector = await openQueuedTool('SQL Injector GUI');
    await waitFor('SQL Injector modal', `Boolean(document.body?.innerText.includes('SQL Injector') && document.body?.innerText.includes('Counter Stack'))`);
    await clickByText('Use a narrow app-layer test and respect blocked patterns', true);
    await clickByText('Pick the smallest scoped fix path before retrying', true);
    await clickByText('Correlate timestamps before taking the next action', true);
    await clickByText('Classic OR 1=1');
    await waitFor('SQL Injector vulnerable result', `Boolean(document.body?.innerText.includes('VULNERABLE!') && document.body?.innerText.includes('Operation run is strong enough'))`, 12000);
    const sqlInjectorState = await readModalState(openedSqlInjector);
    await assertSubmittable(sqlInjectorState, 'SQL Injector');
    await submitStep();
    await waitFor('third VS step completion', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('STEPS 3/44') &&
          text.includes('STEP 4 · OBJECTIVE ACTIVE') &&
          text.toUpperCase().includes('ENCRYPTION PIPELINE');
      })()
    `, 12000);
    console.error('[audit] third VS step completed and Encryption Pipeline is next');

    const openedEncryption = await openQueuedTool('Encryption Pipeline');
    await waitFor('Encryption Pipeline modal', `Boolean(document.body?.innerText.includes('Encryption Pipeline') && document.body?.innerText.includes('Counter Stack'))`);
    await clickByText('Verify the clean snapshot before touching live data', true);
    await clickByText('Correlate timestamps before taking the next action', true);
    await clickByText('Start Pipeline');
    await waitFor('Encryption Pipeline game ready', `Boolean(document.body?.innerText.includes('Level 1: Caesar Cipher'))`);
    await clickByText('HELLO', true);
    await fillFirstVisibleInput('3', 'number');
    await clickByText('Encrypt & Decrypt');
    await waitFor('Encryption Pipeline level 1 output', `Boolean(document.body?.innerText.includes('Success! Decrypted correctly') && document.body?.innerText.includes('Next Level'))`, 12000);
    await clickByText('Next Level');
    await waitFor('Encryption Pipeline level 2 ready', `Boolean(document.body?.innerText.includes('Level 2: XOR Encryption'))`);
    await clickByText('CYBER', true);
    await fillFirstVisibleInput('SECRET', 'text');
    await clickByText('Encrypt & Decrypt');
    await waitFor('Encryption Pipeline score ready', `Boolean(document.body?.innerText.includes('Score: 40') && document.body?.innerText.includes('Operation run is strong enough'))`, 12000);
    const encryptionState = await readModalState(openedEncryption);
    await assertSubmittable(encryptionState, 'Encryption Pipeline');
    await submitStep();
    await waitFor('Database Leak objective completion', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('OBJECTIVES 1/14') &&
          text.includes('STEPS 4/44') &&
          text.includes('Database Leak 4/4');
      })()
    `, 12000);
    console.error('[audit] Database Leak objective completed through ordered GUI chain');

    const summary = await evaluate(`
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return {
          url: location.href,
          feedHasChain: text.includes('completed chain segment 1/2'),
          completedFirstStep: text.includes('STEPS 4/44') && text.includes('Database Leak 4/4'),
          completedObjective: text.includes('OBJECTIVES 1/14'),
          nextStepVisible: text.includes('Database proof captured') || text.includes('Database Leak 4/4'),
          nextSegmentVisible: /ENCRYPTION PIPELINE/i.test(text),
          queueVisible: text.includes('Simuletool Queue')
        };
      })()
    `);
    if (!summary.feedHasChain || !summary.completedFirstStep || !summary.completedObjective || !summary.nextStepVisible || !summary.nextSegmentVisible || !summary.queueVisible) {
      const snapshot = await pageSnapshot(evaluate);
      throw new Error(`Completed VS step summary was incomplete: ${JSON.stringify(summary)}\n${snapshot}`);
    }
    console.log(JSON.stringify({
      ok: true,
      baseUrl,
      openedTool,
      modalState,
      openedSecondTool,
      nmapModalState,
      openedSqlSafari,
      sqlSafariState,
      openedSqlInjector,
      sqlInjectorState,
      openedEncryption,
      encryptionState,
      summary,
    }, null, 2));
  } catch (error) {
    console.error(error.stack || error.message);
    if (stderr.length) console.error(stderr.join('').slice(-2000));
    process.exitCode = 1;
  } finally {
    cdp?.close();
    browser.kill('SIGTERM');
    await sleep(300);
    await rm(profileDir, { recursive: true, force: true });
  }
}

async function pageSnapshot(evaluate) {
  const text = await evaluate(`
    (() => {
      const fullText = document.body?.innerText?.replace(/\\s+/g, ' ').trim() || '';
      const modalIndex = Math.max(
        fullText.indexOf('Play the simuletool GUI'),
        fullText.indexOf('Nmap Port Scanner'),
        fullText.indexOf('DNS Lookup Tool'),
        fullText.indexOf('SQL Safari'),
        fullText.indexOf('SQL Injector'),
        fullText.indexOf('Encryption Pipeline')
      );
      const modalText = modalIndex >= 0 ? fullText.slice(modalIndex, modalIndex + 1600) : '';
      const bodyText = fullText.slice(0, 1800);
      const html = document.documentElement?.outerHTML?.replace(/\\s+/g, ' ').trim().slice(0, 900) || '';
      return JSON.stringify({
        href: location.href,
        readyState: document.readyState,
        title: document.title,
        bodyText,
        modalText,
        html
      });
    })()
  `).catch((error) => `<no page text: ${error.message}>`);
  return `Page snapshot: ${text}`;
}

main();
