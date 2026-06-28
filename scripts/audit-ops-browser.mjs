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

    async function clickModalText(text, exact = false) {
      const clicked = await evaluate(`
        (() => {
          const expected = ${JSON.stringify(text)};
          const exact = ${JSON.stringify(exact)};
          const nodes = [...document.querySelectorAll('.fixed button, .fixed a')];
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
        throw new Error(`Could not click modal text "${text}".\n${snapshot}`);
      }
    }

    async function clickTrojanPaletteTab(index) {
      const clicked = await evaluate(`
        (() => {
          const index = ${JSON.stringify(index)};
          const headings = [...document.querySelectorAll('.fixed h3')];
          const heading = headings.find((item) => item.innerText.includes('Component Palette'));
          const panel = heading?.closest('.bg-white');
          const buttons = panel ? [...panel.querySelectorAll('button')].slice(0, 4) : [];
          const button = buttons[index];
          if (!button) return false;
          button.scrollIntoView({ block: 'center', inline: 'center' });
          button.click();
          return true;
        })()
      `);
      if (!clicked) {
        const snapshot = await pageSnapshot(evaluate);
        throw new Error(`Could not click Trojan palette tab ${index}.\n${snapshot}`);
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
          const button = [...document.querySelectorAll('button')].find((item) => /Commit Segment|Complete VS Step/.test(item.innerText));
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

    async function fillModalField(placeholder, value, fieldTag = 'input') {
      const filled = await evaluate(`
        (() => {
          const placeholder = ${JSON.stringify(placeholder)};
          const value = ${JSON.stringify(value)};
          const fieldTag = ${JSON.stringify(fieldTag)};
          const fields = [...document.querySelectorAll('.fixed ' + fieldTag)];
          const field = fields.find((candidate) => candidate.placeholder === placeholder);
          if (!field) return false;
          field.scrollIntoView({ block: 'center', inline: 'center' });
          const proto = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
          const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
          setter?.call(field, value);
          field.dispatchEvent(new Event('input', { bubbles: true }));
          field.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        })()
      `);
      if (!filled) {
        const snapshot = await pageSnapshot(evaluate);
        throw new Error(`Could not fill modal field "${placeholder}".\n${snapshot}`);
      }
    }

    async function clickVirtualKeys(keys) {
      for (const key of keys) {
        const clicked = await evaluate(`
          (() => {
            const expected = ${JSON.stringify(key)};
            const buttons = [...document.querySelectorAll('button')].filter((button) => {
              const label = (button.innerText || button.textContent || '').replace(/\\s+/g, ' ').trim();
              return label === expected && Boolean(button.closest('.fixed'));
            });
            const button = buttons.find((candidate) => {
              const rect = candidate.getBoundingClientRect();
              return rect.width > 0 && rect.height > 0;
            });
            if (!button) return false;
            button.scrollIntoView({ block: 'center', inline: 'center' });
            button.click();
            return true;
          })()
        `);
        if (!clicked) {
          const snapshot = await pageSnapshot(evaluate);
          throw new Error(`Could not click virtual key "${key}".\n${snapshot}`);
        }
        await sleep(80);
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

    await clickByText('Admin Panel Access');
    await waitFor('Admin Panel Access selected', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('Admin Panel Access') &&
          text.includes('Profile likely admin identity') &&
          text.toUpperCase().includes('WHOIS LOOKUP');
      })()
    `, 12000);
    console.error('[audit] Admin Panel Access selected');

    const openedWhois = await openQueuedTool('Whois Lookup');
    await waitFor('WHOIS Lookup modal', `Boolean(document.body?.innerText.includes('WHOIS Lookup') && document.body?.innerText.includes('Counter Stack'))`);
    await clickByText('Correlate timestamps before taking the next action', true);
    await clickByText('cyberpaws.kids');
    await waitFor('WHOIS first lookup', `Boolean(document.body?.innerText.includes('CyberPaws Academy') && document.body?.innerText.includes('Lookups: 1'))`, 12000);
    await clickByText('google.com');
    await waitFor('WHOIS score ready', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('Google LLC') &&
          text.includes('Score: 40') &&
          text.includes('Operation run is strong enough');
      })()
    `, 12000);
    const whoisState = await readModalState(openedWhois);
    await assertSubmittable(whoisState, 'WHOIS Lookup');
    await submitStep();
    await waitFor('Admin Panel Access step 1 completion', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('OBJECTIVES 1/14') &&
          text.includes('STEPS 5/44') &&
          text.includes('Admin Panel Access 1/3') &&
          text.includes('Test credential path') &&
          text.toUpperCase().includes('HASH CRACKER GUI');
      })()
    `, 12000);
    console.error('[audit] Admin Panel Access step 1 completed through WHOIS GUI');

    const openedHash = await openQueuedTool('Hash Cracker');
    await waitFor('Hash Cracker modal', `Boolean(document.body?.innerText.includes('Hash Cracker') && document.body?.innerText.includes('Counter Stack'))`);
    await clickByText('Reduce suspicious behavior and isolate the lab process', true);
    await clickByText('Correlate timestamps before taking the next action', true);
    await clickByText('Easy Start');
    await waitFor('Hash challenge loaded', `Boolean(document.body?.innerText.includes('5f4dcc3b5aa765d61d8327deb882cf99') && document.body?.innerText.includes('START CRACKING'))`);
    await clickByText('START CRACKING');
    await waitFor('Hash Cracker score ready', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('Password:') &&
          text.includes('password') &&
          text.includes('Operation run is strong enough');
      })()
    `, 20000);
    const hashState = await readModalState(openedHash);
    await assertSubmittable(hashState, 'Hash Cracker');
    await submitStep();
    await waitFor('Admin Panel Access step 2 completion', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('OBJECTIVES 1/14') &&
          text.includes('STEPS 6/44') &&
          text.includes('Admin Panel Access 2/3') &&
          text.includes('Stabilize the session') &&
          text.toUpperCase().includes('SSL HANDSHAKE');
      })()
    `, 12000);
    console.error('[audit] Admin Panel Access step 2 completed through Hash Cracker GUI');

    const openedSsl = await openQueuedTool('SSL Handshake');
    await waitFor('SSL Handshake modal', `Boolean(document.body?.innerText.includes('SSL Handshake') && document.body?.innerText.includes('Counter Stack'))`);
    await clickByText('Pick the smallest scoped fix path before retrying', true);
    await clickByText('Correlate timestamps before taking the next action', true);
    await clickByText('Client Hello');
    await clickByText('Server Hello');
    await clickByText('Key Exchange');
    await clickByText('Finished');
    await waitFor('SSL Handshake score ready', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('Level 1 Complete!') &&
          text.includes('Operation run is strong enough');
      })()
    `, 12000);
    const sslState = await readModalState(openedSsl);
    await assertSubmittable(sslState, 'SSL Handshake');
    await submitStep();
    await waitFor('Admin Panel Access objective completion', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('OBJECTIVES 2/14') &&
          text.includes('STEPS 7/44') &&
          text.includes('Admin Panel Access 3/3');
      })()
    `, 12000);
    console.error('[audit] Admin Panel Access objective completed through ordered GUI chain');

    await clickByText('Session Hijack Sim');
    await waitFor('Session Hijack Sim selected', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('Session Hijack Sim') &&
          text.includes('Observe session traffic path') &&
          text.toUpperCase().includes('NETWORK PACKET TRACER');
      })()
    `, 12000);
    console.error('[audit] Session Hijack Sim selected');

    const openedPacketTracer = await openQueuedTool('Network Packet Tracer');
    await waitFor('Packet Sniffer modal', `Boolean(document.body?.innerText.includes('Packet Sniffer') && document.body?.innerText.includes('Counter Stack'))`);
    await clickByText('Verify issuer, host, expiry, and fingerprint', true);
    await clickByText('Correlate timestamps before taking the next action', true);
    await clickByText('START CAPTURE');
    await waitFor('Packet Sniffer segment ready', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('Operation run is strong enough') &&
          /Total Score\\s+(4[5-9]|[5-9][0-9]|100)/.test(text);
      })()
    `, 20000);
    const packetTracerState = await readModalState(openedPacketTracer);
    await assertSubmittable(packetTracerState, 'Network Packet Tracer', 'Commit Segment');
    await submitStep();
    await waitFor('Session Hijack path segment committed', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('completed chain segment 1/2') &&
          text.toUpperCase().includes('CERT VIEWER GUI');
      })()
    `, 12000);
    console.error('[audit] Session Hijack first chain segment committed through Packet Sniffer GUI');

    const openedCertViewer = await openQueuedTool('Cert Viewer');
    await waitFor('Cert Viewer modal', `Boolean(document.body?.innerText.includes('Cert Viewer') && document.body?.innerText.includes('Counter Stack'))`);
    await clickByText('Verify issuer, host, expiry, and fingerprint', true);
    await clickByText('Correlate timestamps before taking the next action', true);
    await clickByText('old-site.example', true);
    await clickByText('INSPECT');
    await waitFor('Cert Viewer score ready', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('old-site.example') &&
          text.includes('Issues Found:') &&
          text.includes('Operation run is strong enough');
      })()
    `, 12000);
    const certViewerState = await readModalState(openedCertViewer);
    await assertSubmittable(certViewerState, 'Cert Viewer');
    await submitStep();
    await waitFor('Session Hijack step 1 completion', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('OBJECTIVES 2/14') &&
          text.includes('STEPS 8/44') &&
          text.includes('Session Hijack Sim 1/3') &&
          text.includes('Capture session artifact') &&
          text.toUpperCase().includes('KEYLOGGER SIM');
      })()
    `, 12000);
    console.error('[audit] Session Hijack step 1 completed through Cert Viewer GUI');

    const openedKeylogger = await openQueuedTool('Keylogger Sim');
    await waitFor('Keylogger Sim modal', `Boolean(document.body?.innerText.includes('Keylogger Sim') && document.body?.innerText.includes('Counter Stack'))`);
    await clickByText('Reduce suspicious behavior and isolate the lab process', true);
    await clickByText('Pick the smallest scoped fix path before retrying', true);
    await clickVirtualKeys(['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P']);
    await waitFor('Keylogger Sim score ready', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('Keys Captured') &&
          text.includes('Operation run is strong enough');
      })()
    `, 12000);
    const keyloggerState = await readModalState(openedKeylogger);
    await assertSubmittable(keyloggerState, 'Keylogger Sim');
    await submitStep();
    await waitFor('Session Hijack step 2 completion', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('OBJECTIVES 2/14') &&
          text.includes('STEPS 9/44') &&
          text.includes('Session Hijack Sim 2/3') &&
          text.includes('Replay in lab browser') &&
          text.toUpperCase().includes('PROXY SERVER');
      })()
    `, 12000);
    console.error('[audit] Session Hijack step 2 completed through Keylogger Sim GUI');

    const openedProxy = await openQueuedTool('Proxy Server');
    await waitFor('Proxy Server modal', `Boolean(document.body?.innerText.includes('Proxy Server Simulator') && document.body?.innerText.includes('Counter Stack'))`);
    await clickByText('Correlate timestamps before taking the next action', true);
    await clickByText('Pick the smallest scoped fix path before retrying', true);
    await clickByText('Start Simulation');
    await waitFor('Proxy game ready', `Boolean(document.body?.innerText.includes('Forward Proxy Mode') && document.body?.innerText.includes('Click a website to request'))`);
    await clickByText('Google');
    await waitFor('Proxy first request complete', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('Score: 10') && text.includes('Cache MISS');
      })()
    `, 12000);
    await clickByText('Google');
    await waitFor('Proxy cached request complete', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('Score: 25') && text.includes('Cache HIT');
      })()
    `, 12000);
    await clickByText('YouTube');
    await waitFor('Proxy third request complete', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('Score: 35') && text.includes('Cache MISS');
      })()
    `, 12000);
    await clickByText('YouTube');
    await waitFor('Proxy score ready', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('Score: 50') &&
          text.includes('Cache HIT') &&
          text.includes('Operation run is strong enough');
      })()
    `, 12000);
    const proxyState = await readModalState(openedProxy);
    await assertSubmittable(proxyState, 'Proxy Server');
    await submitStep();
    await waitFor('Session Hijack objective completion', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('OBJECTIVES 3/14') &&
          text.includes('STEPS 10/44') &&
          text.includes('Session Hijack Sim 3/3');
      })()
    `, 12000);
    console.error('[audit] Session Hijack Sim objective completed through ordered GUI chain');

    await clickByText('Web Malware Implant');
    await waitFor('Web Malware Implant selected', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('Web Malware Implant') &&
          text.includes('Find upload or CMS path') &&
          text.toUpperCase().includes('NMAP SCANNER');
      })()
    `, 12000);
    console.error('[audit] Web Malware Implant selected');

    const openedWebNmap = await openQueuedTool('Nmap Scanner');
    await waitFor('Web Nmap modal', `Boolean(document.body?.innerText.includes('Nmap Port Scanner') && document.body?.innerText.includes('Counter Stack'))`);
    await clickModalText('Use a narrow app-layer test and respect blocked patterns', true);
    await clickModalText('Correlate timestamps before taking the next action', true);
    await clickModalText('Web Server');
    await clickModalText('Full Scan');
    await clickModalText('LAUNCH SCAN');
    await waitFor('Web Nmap full scan complete', `Boolean(document.body?.innerText.includes('Scans: 1') || document.body?.innerText.includes('OS Guess'))`, 45000);
    await clickModalText('Stealth Scan');
    await clickModalText('LAUNCH SCAN');
    await waitFor('Web Nmap score ready', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('Scans: 2') &&
          text.includes('Operation run is strong enough');
      })()
    `, 45000);
    const webNmapState = await readModalState(openedWebNmap);
    await assertSubmittable(webNmapState, 'Web Nmap');
    await submitStep();
    await waitFor('Web Malware step 1 completion', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('OBJECTIVES 3/14') &&
          text.includes('STEPS 11/44') &&
          text.includes('Web Malware Implant 1/3') &&
          text.includes('Bypass content guard') &&
          text.toUpperCase().includes('XSS TESTER GUI');
      })()
    `, 12000);
    console.error('[audit] Web Malware step 1 completed through Nmap GUI');

    const openedXssTester = await openQueuedTool('XSS Tester');
    await waitFor('XSS Tester modal', `Boolean(document.body?.innerText.includes('XSS Tester') && document.body?.innerText.includes('Counter Stack'))`);
    await clickModalText('Use a narrow app-layer test and respect blocked patterns', true);
    await clickModalText('Pick the smallest scoped fix path before retrying', true);
    await clickModalText('Script Alert');
    await waitFor('XSS detected', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('XSS DETECTED!') &&
          text.includes('ALERT(1)');
      })()
    `, 12000);
    await clickModalText('Show Sanitized');
    await waitFor('XSS score ready', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('Sanitized Output:') &&
          text.includes('Operation run is strong enough');
      })()
    `, 12000);
    const xssTesterState = await readModalState(openedXssTester);
    await assertSubmittable(xssTesterState, 'XSS Tester');
    await submitStep();
    await waitFor('Web Malware step 2 completion', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('OBJECTIVES 3/14') &&
          text.includes('STEPS 12/44') &&
          text.includes('Web Malware Implant 2/3') &&
          text.includes('Plant simulated web payload') &&
          text.toUpperCase().includes('TROJAN BUILDER');
      })()
    `, 12000);
    console.error('[audit] Web Malware step 2 completed through XSS Tester GUI');

    const openedTrojan = await openQueuedTool('Trojan Builder');
    await waitFor('Trojan Builder modal', `Boolean(document.body?.innerText.includes('Trojan Builder') && document.body?.innerText.includes('Counter Stack'))`);
    await clickModalText('Reduce suspicious behavior and isolate the lab process', true);
    await clickModalText('Correlate timestamps before taking the next action', true);
    await clickModalText('Office Macro');
    await clickTrojanPaletteTab(1);
    await clickModalText('Screen Capture');
    await clickTrojanPaletteTab(2);
    await clickModalText('Registry Key');
    await clickTrojanPaletteTab(3);
    await clickModalText('HTTPS Beacon');
    await waitFor('Trojan assembly ready', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('All component types assembled!') &&
          text.includes('Operation run is strong enough');
      })()
    `, 12000);
    await clickModalText('Test Against Defenses');
    await waitFor('Trojan test lab ready', `Boolean(document.body?.innerText.includes('Defense Testing Lab') && document.body?.innerText.includes('Run Test'))`);
    await clickModalText('Run Test');
    await waitFor('Trojan test result', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return (text.includes('Detected by:') || text.includes('Trojan evaded all defenses!')) &&
          text.includes('Operation run is strong enough');
      })()
    `, 12000);
    const trojanState = await readModalState(openedTrojan);
    await assertSubmittable(trojanState, 'Trojan Builder');
    await submitStep();
    await waitFor('Web Malware objective completion', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('OBJECTIVES 4/14') &&
          text.includes('STEPS 13/44') &&
          text.includes('Web Malware Implant 3/3');
      })()
    `, 12000);
    console.error('[audit] Web Malware Implant objective completed through ordered GUI chain');

    await clickByText('Keylogger Telemetry');
    await waitFor('Keylogger Telemetry selected', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('Keylogger Telemetry') &&
          text.includes('Deliver lab payload') &&
          text.toUpperCase().includes('PHISHING SIM GUI');
      })()
    `, 12000);
    console.error('[audit] Keylogger Telemetry selected');

    const openedDeliveryPhish = await openQueuedTool('Phishing Sim');
    await waitFor('Phishing Simulator modal', `Boolean(document.body?.innerText.includes('Phishing Simulator') && document.body?.innerText.includes('Counter Stack'))`);
    await clickModalText('Reduce suspicious behavior and isolate the lab process', true);
    await clickModalText('Correlate timestamps before taking the next action', true);
    await fillModalField('bank@secure.com', 'security@audit-bank.example');
    await fillModalField('URGENT: Action required!', 'Quarterly account verification');
    await fillModalField('Write your email body...', 'Please verify the account workflow in this training lab before the simulated review window closes.', 'textarea');
    await clickModalText('Urgency OFF');
    await clickModalText('Spoof OFF');
    await clickModalText('Preview & Score');
    await waitFor('Phishing builder score ready', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('Convincing Score: 50/50') &&
          text.includes('Operation run is strong enough');
      })()
    `, 12000);
    await clickModalText('bank@secure-login.com');
    await clickModalText('Phishing', true);
    await waitFor('Phishing classifier correct', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('CORRECT!') &&
          text.includes('This is a phishing email') &&
          text.includes('Operation run is strong enough');
      })()
    `, 12000);
    const deliveryPhishState = await readModalState(openedDeliveryPhish);
    await assertSubmittable(deliveryPhishState, 'Phishing Sim');
    await submitStep();
    await waitFor('Keylogger Telemetry step 1 completion', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('OBJECTIVES 4/14') &&
          text.includes('STEPS 14/44') &&
          text.includes('Keylogger Telemetry 1/3') &&
          text.includes('Establish endpoint view') &&
          text.toUpperCase().includes('TROJAN BUILDER');
      })()
    `, 12000);
    console.error('[audit] Keylogger Telemetry step 1 completed through Phishing Sim GUI');

    const openedEndpointTrojan = await openQueuedTool('Trojan Builder');
    await waitFor('Endpoint Trojan modal', `Boolean(document.body?.innerText.includes('Trojan Builder') && document.body?.innerText.includes('Counter Stack'))`);
    await clickModalText('Reduce suspicious behavior and isolate the lab process', true);
    await clickModalText('Pick the smallest scoped fix path before retrying', true);
    await clickModalText('Office Macro');
    await clickTrojanPaletteTab(1);
    await clickModalText('Screen Capture');
    await clickTrojanPaletteTab(2);
    await clickModalText('Registry Key');
    await clickTrojanPaletteTab(3);
    await clickModalText('HTTPS Beacon');
    await waitFor('Endpoint Trojan assembly ready', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('All component types assembled!') &&
          text.includes('Operation run is strong enough');
      })()
    `, 12000);
    await clickModalText('Test Against Defenses');
    await waitFor('Endpoint Trojan test lab ready', `Boolean(document.body?.innerText.includes('Defense Testing Lab') && document.body?.innerText.includes('Run Test'))`);
    await clickModalText('Run Test');
    await waitFor('Endpoint Trojan test result', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return (text.includes('Detected by:') || text.includes('Trojan evaded all defenses!')) &&
          text.includes('Operation run is strong enough');
      })()
    `, 12000);
    const endpointTrojanState = await readModalState(openedEndpointTrojan);
    await assertSubmittable(endpointTrojanState, 'Endpoint Trojan');
    await submitStep();
    await waitFor('Keylogger Telemetry step 2 completion', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('OBJECTIVES 4/14') &&
          text.includes('STEPS 15/44') &&
          text.includes('Keylogger Telemetry 2/3') &&
          text.includes('Collect simulated telemetry') &&
          text.toUpperCase().includes('KEYLOGGER SIM');
      })()
    `, 12000);
    console.error('[audit] Keylogger Telemetry step 2 completed through Trojan Builder GUI');

    const openedTelemetryKeylogger = await openQueuedTool('Keylogger Sim');
    await waitFor('Telemetry Keylogger modal', `Boolean(document.body?.innerText.includes('Keylogger Sim') && document.body?.innerText.includes('Counter Stack'))`);
    await clickModalText('Reduce suspicious behavior and isolate the lab process', true);
    await clickModalText('Correlate timestamps before taking the next action', true);
    await clickVirtualKeys(['A', 'U', 'D', 'I', 'T', 'S', 'E', 'C', 'U', 'R']);
    await waitFor('Telemetry Keylogger score ready', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('Keys Captured') &&
          text.includes('Operation run is strong enough');
      })()
    `, 12000);
    const telemetryKeyloggerState = await readModalState(openedTelemetryKeylogger);
    await assertSubmittable(telemetryKeyloggerState, 'Telemetry Keylogger');
    await submitStep();
    await waitFor('Keylogger Telemetry objective completion', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('OBJECTIVES 5/14') &&
          text.includes('STEPS 16/44') &&
          text.includes('Keylogger Telemetry 3/3');
      })()
    `, 12000);
    console.error('[audit] Keylogger Telemetry objective completed through ordered GUI chain');

    await clickByText('Cookie Capture');
    await waitFor('Cookie Capture selected', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('Cookie Capture') &&
          text.includes('Gain local context') &&
          text.toUpperCase().includes('TROJAN BUILDER');
      })()
    `, 12000);
    console.error('[audit] Cookie Capture selected');

    const openedLocalTrojan = await openQueuedTool('Trojan Builder');
    await waitFor('Local Trojan modal', `Boolean(document.body?.innerText.includes('Trojan Builder') && document.body?.innerText.includes('Counter Stack'))`);
    await clickModalText('Reduce suspicious behavior and isolate the lab process', true);
    await clickModalText('Office Macro');
    await clickTrojanPaletteTab(1);
    await clickModalText('Screen Capture');
    await clickTrojanPaletteTab(2);
    await clickModalText('Registry Key');
    await clickTrojanPaletteTab(3);
    await clickModalText('HTTPS Beacon');
    await waitFor('Local Trojan assembly ready', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('All component types assembled!') &&
          text.includes('Operation run is strong enough');
      })()
    `, 12000);
    await clickModalText('Test Against Defenses');
    await waitFor('Local Trojan test lab ready', `Boolean(document.body?.innerText.includes('Defense Testing Lab') && document.body?.innerText.includes('Run Test'))`);
    await clickModalText('Run Test');
    await waitFor('Local Trojan test result', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return (text.includes('Detected by:') || text.includes('Trojan evaded all defenses!')) &&
          text.includes('Operation run is strong enough');
      })()
    `, 12000);
    const localTrojanState = await readModalState(openedLocalTrojan);
    await assertSubmittable(localTrojanState, 'Local Trojan');
    await submitStep();
    await waitFor('Cookie Capture step 1 completion', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('OBJECTIVES 5/14') &&
          text.includes('STEPS 17/44') &&
          text.includes('Cookie Capture 1/3') &&
          text.includes('Locate browser store') &&
          text.toUpperCase().includes('LOG ANALYZER');
      })()
    `, 12000);
    console.error('[audit] Cookie Capture step 1 completed through Trojan Builder GUI');

    const openedLogAnalyzer = await openQueuedTool('Log Analyzer');
    await waitFor('Log Analyzer modal', `Boolean(document.body?.innerText.includes('Log Analyzer') && document.body?.innerText.includes('Counter Stack'))`);
    await clickModalText('Reduce suspicious behavior and isolate the lab process', true);
    await clickModalText('Pick the smallest scoped fix path before retrying', true);
    await clickModalText('The Brute');
    await waitFor('Log Analyzer case ready', `Boolean(document.body?.innerText.includes('Case 1: The Brute') && document.body?.innerText.includes('Solve the Case'))`, 12000);
    await clickModalText('Auto-Flag Pattern');
    await waitFor('Log Analyzer pattern flagged', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('Clues: 19/19') &&
          text.includes('Progress: 100%');
      })()
    `, 12000);
    await clickModalText('Brute Force Attack');
    await clickModalText('Solve Case');
    await waitFor('Log Analyzer solved', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('Case Solved!') &&
          text.includes('A brute force attack happens') &&
          text.includes('Operation run is strong enough');
      })()
    `, 12000);
    const logAnalyzerState = await readModalState(openedLogAnalyzer);
    await assertSubmittable(logAnalyzerState, 'Log Analyzer');
    await submitStep();
    await waitFor('Cookie Capture step 2 completion', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('OBJECTIVES 5/14') &&
          text.includes('STEPS 18/44') &&
          text.includes('Cookie Capture 2/3') &&
          text.includes('Extract cookie proof') &&
          text.toUpperCase().includes('ENCRYPTION PIPELINE');
      })()
    `, 12000);
    console.error('[audit] Cookie Capture step 2 completed through Log Analyzer GUI');

    const openedCookieEncryption = await openQueuedTool('Encryption Pipeline');
    await waitFor('Cookie Encryption Pipeline modal', `Boolean(document.body?.innerText.includes('Encryption Pipeline') && document.body?.innerText.includes('Counter Stack'))`);
    await clickModalText('Correlate timestamps before taking the next action', true);
    await clickModalText('Pick the smallest scoped fix path before retrying', true);
    await clickModalText('Start Pipeline');
    await waitFor('Cookie Encryption game ready', `Boolean(document.body?.innerText.includes('Level 1: Caesar Cipher'))`);
    await clickModalText('HELLO', true);
    await fillFirstVisibleInput('3', 'number');
    await clickModalText('Encrypt & Decrypt');
    await waitFor('Cookie Encryption level 1 output', `Boolean(document.body?.innerText.includes('Success! Decrypted correctly') && document.body?.innerText.includes('Next Level'))`, 12000);
    await clickModalText('Next Level');
    await waitFor('Cookie Encryption level 2 ready', `Boolean(document.body?.innerText.includes('Level 2: XOR Encryption'))`);
    await clickModalText('CYBER', true);
    await fillFirstVisibleInput('SECRET', 'text');
    await clickModalText('Encrypt & Decrypt');
    await waitFor('Cookie Encryption score ready', `Boolean(document.body?.innerText.includes('Score: 40') && document.body?.innerText.includes('Operation run is strong enough'))`, 12000);
    const cookieEncryptionState = await readModalState(openedCookieEncryption);
    await assertSubmittable(cookieEncryptionState, 'Cookie Encryption Pipeline');
    await submitStep();
    await waitFor('Cookie Capture objective completion', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('OBJECTIVES 6/14') &&
          text.includes('STEPS 19/44') &&
          text.includes('Cookie Capture 3/3');
      })()
    `, 12000);
    console.error('[audit] Cookie Capture objective completed through ordered GUI chain');

    await clickByText('API Key Theft');
    await waitFor('API Key Theft selected', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('API Key Theft') &&
          text.includes('Map code/config surface') &&
          text.toUpperCase().includes('WHOIS LOOKUP');
      })()
    `, 12000);
    console.error('[audit] API Key Theft selected');

    const openedApiWhois = await openQueuedTool('Whois Lookup');
    await waitFor('API WHOIS Lookup modal', `Boolean(document.body?.innerText.includes('WHOIS Lookup') && document.body?.innerText.includes('Counter Stack'))`);
    await clickModalText('Correlate timestamps before taking the next action', true);
    await clickModalText('cyberpaws.kids');
    await waitFor('API WHOIS first lookup', `Boolean(document.body?.innerText.includes('CyberPaws Academy') && document.body?.innerText.includes('Lookups: 1'))`, 12000);
    await clickModalText('google.com');
    await waitFor('API WHOIS score ready', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('Google LLC') &&
          text.includes('Score: 40') &&
          text.includes('Operation run is strong enough');
      })()
    `, 12000);
    const apiWhoisState = await readModalState(openedApiWhois);
    await assertSubmittable(apiWhoisState, 'API WHOIS Lookup', 'Commit Segment');
    await submitStep();
    await waitFor('API Key Theft first chain segment completion', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('OBJECTIVES 6/14') &&
          text.includes('STEPS 19/44') &&
          text.includes('completed chain segment 1/2') &&
          text.toUpperCase().includes('DNS LOOKUP GUI');
      })()
    `, 12000);
    console.error('[audit] API Key Theft WHOIS segment committed');

    const openedApiDns = await openQueuedTool('DNS Lookup GUI');
    await waitFor('API DNS lookup modal', `Boolean(document.body?.innerText.includes('DNS Lookup Tool') && document.body?.innerText.includes('Counter Stack'))`);
    await clickModalText('Correlate timestamps before taking the next action', true);
    await clickModalText('cyberpaws.kids');
    for (let i = 1; i <= 4; i++) {
      await clickModalText('Trace Path');
      await waitFor(`API DNS trace ${i}/4 complete`, `
        (() => {
          const text = document.body.innerText.replace(/\\s+/g, ' ');
          return text.includes('Lookups: ${i}') &&
            text.includes('DNS Records for cyberpaws.kids');
        })()
      `, 12000);
    }
    await waitFor('API DNS score ready', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('Score: 60') &&
          text.includes('Operation run is strong enough');
      })()
    `, 12000);
    const apiDnsState = await readModalState(openedApiDns);
    await assertSubmittable(apiDnsState, 'API DNS Lookup');
    await submitStep();
    await waitFor('API Key Theft step 1 completion', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('OBJECTIVES 6/14') &&
          text.includes('STEPS 20/44') &&
          text.includes('API Key Theft 1/3') &&
          text.includes('Find secret pattern') &&
          text.toUpperCase().includes('XOR TOOL');
      })()
    `, 12000);
    console.error('[audit] API Key Theft step 1 completed through WHOIS + DNS GUI chain');

    const openedXorTool = await openQueuedTool('XOR Tool');
    await waitFor('XOR Tool modal', `Boolean(document.body?.innerText.includes('XOR Tool') && document.body?.innerText.includes('Counter Stack'))`);
    await clickModalText('Pick the smallest scoped fix path before retrying', true);
    for (let i = 0; i < 4; i++) {
      await clickModalText('Run XOR Operation');
      await sleep(80);
    }
    await waitFor('XOR Tool score ready', `Boolean(document.body?.innerText.includes('Operation run is strong enough'))`, 12000);
    const xorToolState = await readModalState(openedXorTool);
    await assertSubmittable(xorToolState, 'XOR Tool', 'Commit Segment');
    await submitStep();
    await waitFor('API Key Theft XOR segment completion', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('OBJECTIVES 6/14') &&
          text.includes('STEPS 20/44') &&
          text.includes('completed chain segment 1/2') &&
          text.toUpperCase().includes('HASH CRACKER GUI');
      })()
    `, 12000);
    console.error('[audit] API Key Theft XOR segment committed');

    const openedApiHash = await openQueuedTool('Hash Cracker');
    await waitFor('API Hash Cracker modal', `Boolean(document.body?.innerText.includes('Hash Cracker') && document.body?.innerText.includes('Counter Stack'))`);
    await clickModalText('Pick the smallest scoped fix path before retrying', true);
    await clickModalText('Easy Start');
    await waitFor('API Hash challenge loaded', `Boolean(document.body?.innerText.includes('5f4dcc3b5aa765d61d8327deb882cf99') && document.body?.innerText.includes('START CRACKING'))`);
    await clickModalText('START CRACKING');
    await waitFor('API Hash Cracker score ready', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('Password:') &&
          text.includes('password') &&
          text.includes('Operation run is strong enough');
      })()
    `, 20000);
    const apiHashState = await readModalState(openedApiHash);
    await assertSubmittable(apiHashState, 'API Hash Cracker');
    await submitStep();
    await waitFor('API Key Theft step 2 completion', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('OBJECTIVES 6/14') &&
          text.includes('STEPS 21/44') &&
          text.includes('API Key Theft 2/3') &&
          text.includes('Validate revoked key proof') &&
          text.toUpperCase().includes('PROXY SERVER');
      })()
    `, 12000);
    console.error('[audit] API Key Theft step 2 completed through XOR + Hash GUI chain');

    const openedApiProxy = await openQueuedTool('Proxy Server');
    await waitFor('API Proxy Server modal', `Boolean(document.body?.innerText.includes('Proxy Server Simulator') && document.body?.innerText.includes('Counter Stack'))`);
    await clickModalText('Correlate timestamps before taking the next action', true);
    await clickModalText('Pick the smallest scoped fix path before retrying', true);
    await clickModalText('Start Simulation');
    await waitFor('API Proxy game ready', `Boolean(document.body?.innerText.includes('Forward Proxy Mode') && document.body?.innerText.includes('Click a website to request'))`);
    await clickModalText('Google');
    await waitFor('API Proxy first request complete', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('Score: 10') && text.includes('Cache MISS');
      })()
    `, 12000);
    await clickModalText('Google');
    await waitFor('API Proxy cached request complete', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('Score: 25') && text.includes('Cache HIT');
      })()
    `, 12000);
    await clickModalText('YouTube');
    await waitFor('API Proxy third request complete', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('Score: 35') && text.includes('Cache MISS');
      })()
    `, 12000);
    await clickModalText('YouTube');
    await waitFor('API Proxy score ready', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('Score: 50') &&
          text.includes('Cache HIT') &&
          text.includes('Operation run is strong enough');
      })()
    `, 12000);
    const apiProxyState = await readModalState(openedApiProxy);
    await assertSubmittable(apiProxyState, 'API Proxy Server');
    await submitStep();
    await waitFor('API Key Theft objective completion', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('OBJECTIVES 7/14') &&
          text.includes('STEPS 22/44') &&
          text.includes('API Key Theft 3/3');
      })()
    `, 12000);
    console.error('[audit] API Key Theft objective completed through ordered GUI chain');

    const summary = await evaluate(`
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return {
          url: location.href,
          feedHasChain: text.includes('completed chain segment 1/2'),
          completedDatabaseLeak: text.includes('Database Leak 4/4'),
          completedAdminPanel: text.includes('Admin Panel Access 3/3'),
          completedSessionHijack: text.includes('Session Hijack Sim 3/3'),
          completedWebMalware: text.includes('Web Malware Implant 3/3'),
          completedKeyloggerTelemetry: text.includes('Keylogger Telemetry 3/3'),
          completedCookieCapture: text.includes('Cookie Capture 3/3'),
          completedApiKeyTheft: text.includes('API Key Theft 3/3'),
          completedObjectives: text.includes('OBJECTIVES 7/14'),
          completedSteps: text.includes('STEPS 22/44'),
          nextStepVisible: text.includes('API key proof captured') || text.includes('API Key Theft 3/3'),
          nextSegmentVisible: /PROXY SERVER/i.test(text),
          queueVisible: text.includes('Simuletool Queue')
        };
      })()
    `);
    if (!summary.feedHasChain || !summary.completedDatabaseLeak || !summary.completedAdminPanel || !summary.completedSessionHijack || !summary.completedWebMalware || !summary.completedKeyloggerTelemetry || !summary.completedCookieCapture || !summary.completedApiKeyTheft || !summary.completedObjectives || !summary.completedSteps || !summary.nextStepVisible || !summary.nextSegmentVisible || !summary.queueVisible) {
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
      openedWhois,
      whoisState,
      openedHash,
      hashState,
      openedSsl,
      sslState,
      openedPacketTracer,
      packetTracerState,
      openedCertViewer,
      certViewerState,
      openedKeylogger,
      keyloggerState,
      openedProxy,
      proxyState,
      openedWebNmap,
      webNmapState,
      openedXssTester,
      xssTesterState,
      openedTrojan,
      trojanState,
      openedDeliveryPhish,
      deliveryPhishState,
      openedEndpointTrojan,
      endpointTrojanState,
      openedTelemetryKeylogger,
      telemetryKeyloggerState,
      openedLocalTrojan,
      localTrojanState,
      openedLogAnalyzer,
      logAnalyzerState,
      openedCookieEncryption,
      cookieEncryptionState,
      openedApiWhois,
      apiWhoisState,
      openedApiDns,
      apiDnsState,
      openedXorTool,
      xorToolState,
      openedApiHash,
      apiHashState,
      openedApiProxy,
      apiProxyState,
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
        fullText.indexOf('Encryption Pipeline'),
        fullText.indexOf('WHOIS Lookup'),
        fullText.indexOf('Hash Cracker'),
        fullText.indexOf('SSL Handshake'),
        fullText.indexOf('Packet Sniffer'),
        fullText.indexOf('Cert Viewer'),
        fullText.indexOf('Keylogger Sim'),
        fullText.indexOf('Proxy Server Simulator'),
        fullText.indexOf('XSS Tester'),
        fullText.indexOf('Phishing Simulator'),
        fullText.indexOf('Log Analyzer'),
        fullText.indexOf('XOR Tool'),
        fullText.indexOf('Trojan Builder')
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
