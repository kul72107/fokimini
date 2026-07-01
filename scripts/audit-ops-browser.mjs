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
  process.env.LOCALAPPDATA ? join(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe') : undefined,
  process.env.PROGRAMFILES ? join(process.env.PROGRAMFILES, 'Google/Chrome/Application/chrome.exe') : undefined,
  process.env['PROGRAMFILES(X86)'] ? join(process.env['PROGRAMFILES(X86)'], 'Google/Chrome/Application/chrome.exe') : undefined,
  process.env.PROGRAMFILES ? join(process.env.PROGRAMFILES, 'Microsoft/Edge/Application/msedge.exe') : undefined,
  process.env['PROGRAMFILES(X86)'] ? join(process.env['PROGRAMFILES(X86)'], 'Microsoft/Edge/Application/msedge.exe') : undefined,
  '/snap/bin/chromium',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
].filter(Boolean);

const auditTarget = {
  platformName: 'Audit Target Portal',
  orgName: 'Audit Target Labs',
  primaryDomain: 'app.audit-target.ops',
  rootDomain: 'audit-target.ops',
  vendorName: 'Audit Target Partner Mesh',
  vendorDomain: 'vendor.audit-target.ops',
  oldDomain: 'old.audit-target.ops',
  apiName: 'Audit Target Ops API',
  apiDomain: 'api.audit-target.ops',
  dataName: 'Audit Target Portal Data',
  webName: 'Audit Target Portal Web',
  appName: 'Audit Target Portal App',
  sessionCookieName: 'audit_target_sid',
  xorKey: 'AUDI4',
  phishFrom: 'security@login-audit-target-ops.ops',
  phishDetectiveFrom: 'Audit Target Portal Security',
  phishDetectiveSubject: 'Audit Target Portal: urgent session reset',
  certSubject: 'CN=app.audit-target.ops, O=Audit Target Labs, C=US',
  certIssuer: 'Audit Target Trust Lab CA',
};

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

    const textAliases = {
      'cyberpaws.kids': [auditTarget.primaryDomain],
      'www.cyberpaws.kids': [auditTarget.certSubject, auditTarget.primaryDomain],
      'google.com': [auditTarget.vendorDomain],
      'github.com': [auditTarget.oldDomain],
      Google: [auditTarget.appName],
      YouTube: [auditTarget.apiName],
      'Easy Start': [`${auditTarget.platformName} Admin Hint`],
      'old-site.example': [auditTarget.oldDomain],
      'Web Server': [auditTarget.webName],
      'Bank Server': [auditTarget.dataName, auditTarget.webName],
      'PayPal Security Team': [auditTarget.phishDetectiveFrom],
      'Urgent: Your account has been compromised!': [auditTarget.phishDetectiveSubject],
      'bank@secure-login.com': [auditTarget.phishFrom],
      'CyberPaws CA': [auditTarget.certIssuer],
      'Jan 1, 2025': ['2026-02-01'],
      'Jan 1, 2026': ['2027-02-01'],
      HELLO: [auditTarget.xorKey],
      CYBER: [auditTarget.xorKey],
      SECRET: [auditTarget.xorKey],
      PAWS: [auditTarget.rootDomain.split('.')[0].replace(/-/g, '_').toUpperCase()],
    };

    function clickCandidates(text) {
      return [text, ...(textAliases[text] ?? [])];
    }

    const retiredCounterPrompts = new Set([
      'Shape traffic through the allowed service lane',
      'Use a narrow app-layer test and respect blocked patterns',
      'Pick the smallest scoped fix path before retrying',
      'Correlate timestamps before taking the next action',
      'Reduce suspicious behavior and isolate the lab process',
      'Verify issuer, host, expiry, and fingerprint',
      'Verify the clean snapshot before touching live data',
      'Compare resolver answer with the expected record',
      'Route only the needed request path through the proxy',
      'Trace the exact path before changing route state',
      'Filter the relevant protocol and inspect the flow',
      'Stay on the active app surface and verify behavior',
      'Validate the human clue against a second signal',
      'Keep the sample contained and watch behavior',
      'Stage only the safe lab payload and monitor response',
      'Check process, file, and session context together',
      'Validate scope, expiry, and revocation path',
      'Confirm the credential clue without exposing secrets',
      'Check integrity before relying on encoded data',
      'Move only sanitized proof through the approved channel',
    ]);

    function isRetiredCounterPrompt(text) {
      return retiredCounterPrompts.has(text) || /^Use the .+ clue only where the active step needs it$/.test(text);
    }

    async function clickByText(text, exact = false) {
      if (isRetiredCounterPrompt(text)) return;
      const clicked = await evaluate(`
        (() => {
          const candidates = ${JSON.stringify(clickCandidates(text))};
          const exact = ${JSON.stringify(exact)};
          const nodes = [...document.querySelectorAll('button, a')];
          const node = nodes.find((item) => {
            const label = (item.innerText || item.textContent || '').replace(/\\s+/g, ' ').trim();
            return candidates.some((expected) => exact ? label === expected : label.includes(expected));
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
      if (isRetiredCounterPrompt(text)) return;
      const clicked = await evaluate(`
        (() => {
          const candidates = ${JSON.stringify(clickCandidates(text))};
          const exact = ${JSON.stringify(exact)};
          const nodes = [...document.querySelectorAll('.fixed button, .fixed a')];
          const node = nodes.find((item) => {
            const label = (item.innerText || item.textContent || '').replace(/\\s+/g, ' ').trim();
            return candidates.some((expected) => exact ? label === expected : label.includes(expected));
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
          const gateStart = text.indexOf('Completion Gate');
          const gateEnd = text.indexOf('Target Proof');
          const gateText = gateStart >= 0
            ? text.slice(gateStart, gateEnd > gateStart ? gateEnd : gateStart + 700)
            : text;
          const gateLower = gateText.toLowerCase();
          const forbiddenGateText = ['operation score', 'counter stack', 'tool score', 'counter score', 'operation run is strong enough', 'reach '].filter((item) => gateLower.includes(item));
          const toolActionComplete = gateLower.includes('tool action') && gateLower.includes('latest signal valid');
          const proofVerified = gateLower.includes('target proof') && gateLower.includes('verified');
          const commit = [...document.querySelectorAll('button')].find((button) => /Commit Segment|Complete VS Step/.test(button.innerText));
          const carryPanel = document.querySelector('.fixed [data-ops-carry="requirement"]');
          return {
            openedTool: ${JSON.stringify(openedTool)},
            toolActionComplete,
            proofVerified,
            forbiddenGateText,
            carryVisible: Boolean(carryPanel),
            carryComplete: !carryPanel || carryPanel.dataset.opsCarryComplete === 'true',
            commitText: commit ? commit.innerText.replace(/\\s+/g, ' ').trim() : null,
            commitDisabled: commit ? Boolean(commit.disabled) : null,
            fallbackVisible: text.includes('Ops Circuit'),
            modalVisible: text.includes('Completion Gate') && text.includes('Target Proof'),
          };
        })()
      `);
    }

    async function satisfyCarryRequirement(label) {
      const initial = await evaluate(`
        (() => {
          const panel = document.querySelector('.fixed [data-ops-carry="requirement"]');
          const commit = [...document.querySelectorAll('button')].find((button) => /Commit Segment|Complete VS Step/.test(button.innerText));
          return {
            present: Boolean(panel),
            complete: !panel || panel.dataset.opsCarryComplete === 'true',
            commitDisabled: commit ? Boolean(commit.disabled) : null,
          };
        })()
      `);
      if (!initial?.present) return false;
      if (!initial.complete && initial.commitDisabled === false) {
        const snapshot = await pageSnapshot(evaluate);
        throw new Error(`${label} enabled commit before the carried output was selected.\n${snapshot}`);
      }

      const wrong = await evaluate(`
        (() => {
          const wrongButton = [...document.querySelectorAll('.fixed button[data-ops-carry-option="decoy"]')][0];
          const commit = [...document.querySelectorAll('button')].find((button) => /Commit Segment|Complete VS Step/.test(button.innerText));
          if (!wrongButton) return { clicked: false, commitDisabled: commit ? Boolean(commit.disabled) : null };
          wrongButton.scrollIntoView({ block: 'center', inline: 'center' });
          wrongButton.click();
          return { clicked: true, commitDisabled: commit ? Boolean(commit.disabled) : null };
        })()
      `);
      if (wrong.clicked && wrong.commitDisabled === false) {
        const snapshot = await pageSnapshot(evaluate);
        throw new Error(`${label} enabled commit after a wrong carried output.\n${snapshot}`);
      }

      const correct = await evaluate(`
        (() => {
          const correctButton = [...document.querySelectorAll('.fixed button[data-ops-carry-option="correct"]')][0];
          if (!correctButton) return false;
          correctButton.scrollIntoView({ block: 'center', inline: 'center' });
          correctButton.click();
          return true;
        })()
      `);
      if (!correct) {
        const snapshot = await pageSnapshot(evaluate);
        throw new Error(`${label} has no correct carried output option.\n${snapshot}`);
      }
      await waitFor(`${label} carried output accepted`, `
        (() => {
          const panel = document.querySelector('.fixed [data-ops-carry="requirement"]');
          const commit = [...document.querySelectorAll('button')].find((button) => /Commit Segment|Complete VS Step/.test(button.innerText));
          return panel && panel.dataset.opsCarryComplete === 'true' && commit && !commit.disabled;
        })()
      `, 8000);
      console.error(`[audit] ${label} carried output gate accepts only the chained value`);
      return true;
    }
    async function selectTargetProof(label) {
      await waitFor(`${label} target proof visible`, `
        (() => {
          const text = document.body.innerText.replace(/\\s+/g, ' ');
          return text.includes('Target Proof') &&
            text.includes(${JSON.stringify(auditTarget.primaryDomain)}) &&
            text.includes(${JSON.stringify(auditTarget.rootDomain)});
        })()
      `, 8000);

      const result = await evaluate(`
        (() => {
          const modal = document.querySelector('.fixed');
          const text = modal?.innerText || '';
          const forbidden = ['CyberPaws Academy', 'Google LLC', 'GitHub Inc.', 'PayPal Security Team', 'bank@secure-login.com', 'CatLover99', 'HackerPaw', 'GitHubRocks999', 'target-site.com'];
          const leaked = forbidden.filter((item) => text.includes(item));
          const buttons = [...document.querySelectorAll('.fixed button[data-ops-proof="correct"]')]
            .filter((button) => button.dataset.opsProofSelected !== 'true');
          buttons.forEach((button) => {
            button.scrollIntoView({ block: 'center', inline: 'center' });
            button.click();
          });
          return { clicked: buttons.length, leaked };
        })()
      `);
      if (result?.leaked?.length) {
        const snapshot = await pageSnapshot(evaluate);
        throw new Error(`${label} leaked training-only text in VS modal: ${result.leaked.join(', ')}\n${snapshot}`);
      }
      await waitFor(`${label} proof selection ready`, `
        (() => {
          const correct = [...document.querySelectorAll('.fixed button[data-ops-proof="correct"]')];
          return correct.length > 0 && correct.every((button) => button.dataset.opsProofSelected === 'true');
        })()
      `, 8000);
    }

    async function assertSubmittable(state, label, expectedSubmit = 'Complete VS Step') {
      let readyState = state;
      if (readyState.carryVisible && !readyState.carryComplete) {
        await satisfyCarryRequirement(label);
        readyState = await readModalState(state.openedTool);
      }

      if (
        !readyState.modalVisible ||
        readyState.fallbackVisible ||
        readyState.commitText !== expectedSubmit ||
        readyState.commitDisabled ||
        !readyState.toolActionComplete ||
        readyState.carryComplete === false ||
        readyState.forbiddenGateText.length > 0
      ) {
        const snapshot = await pageSnapshot(evaluate);
        throw new Error(`${label} modal did not enable commit after required GUI action: ${JSON.stringify(readyState)}\n${snapshot}`);
      }

      await selectTargetProof(label);
      const latest = await readModalState(readyState.openedTool);
      if (
        !latest.modalVisible ||
        latest.fallbackVisible ||
        latest.commitText !== expectedSubmit ||
        latest.commitDisabled ||
        !latest.toolActionComplete ||
        latest.carryComplete === false ||
        !latest.proofVerified ||
        latest.forbiddenGateText.length > 0
      ) {
        const snapshot = await pageSnapshot(evaluate);
        throw new Error(`${label} modal did not keep commit available after proof check: ${JSON.stringify(latest)}\n${snapshot}`);
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

    async function clickModalElementText(text, exact = false) {
      if (isRetiredCounterPrompt(text)) return;
      const clicked = await evaluate(`
        (() => {
          const candidates = ${JSON.stringify(clickCandidates(text))};
          const exact = ${JSON.stringify(exact)};
          const nodes = [...document.querySelectorAll('.fixed button, .fixed [role="button"], .fixed div, .fixed p, .fixed span')];
          const node = nodes.find((item) => {
            const label = (item.innerText || item.textContent || '').replace(/\\s+/g, ' ').trim();
            return candidates.some((expected) => exact ? label === expected : label.includes(expected));
          });
          if (!node) return false;
          node.scrollIntoView({ block: 'center', inline: 'center' });
          node.click();
          return true;
        })()
      `);
      if (!clicked) {
        const snapshot = await pageSnapshot(evaluate);
        throw new Error(`Could not click modal element text "${text}".\n${snapshot}`);
      }
    }

    async function runWhoisLookup(label, minScore = 40) {
      await clickModalText('Correlate timestamps before taking the next action', true);
      await fillFirstVisibleInput(auditTarget.primaryDomain, 'text');
      await clickModalText('LOOKUP', true);
      await waitFor(`${label} first WHOIS lookup`, `Boolean(document.body?.innerText.includes('Audit Target Labs') && document.body?.innerText.includes('Lookups: 1'))`, 12000);
      await fillFirstVisibleInput(auditTarget.vendorDomain, 'text');
      await clickModalText('LOOKUP', true);
      await waitFor(`${label} WHOIS baseline ready`, `
        (() => {
          const text = document.body.innerText.replace(/\\s+/g, ' ');
          return text.includes('Audit Target Partner Mesh') &&
            text.includes('Score: 40');
        })()
      `, 12000);
      if (minScore > 40) {
        await fillFirstVisibleInput(auditTarget.oldDomain, 'text');
        await clickModalText('LOOKUP', true);
        await waitFor(`${label} WHOIS score ready`, `
          (() => {
            const text = document.body.innerText.replace(/\\s+/g, ' ');
            return text.includes('Audit Target Labs Legacy') &&
              text.includes('Lookups: 3') &&
              /Score:\\s*(6[0-9]|[7-9][0-9]|100)/.test(text);
          })()
        `, 12000);
      }
    }

    async function resolveAuditDns(label) {
      await fillModalField(auditTarget.primaryDomain, auditTarget.primaryDomain);
      await clickModalText('RESOLVE', true);
      await waitFor(`${label} DNS trace controls loaded`, `
        (() => {
          const text = document.body.innerText.replace(/\\s+/g, ' ');
          return text.includes('DNS Resolution Path') &&
            text.includes('Trace Path') &&
            text.includes(${JSON.stringify(auditTarget.primaryDomain)});
        })()
      `, 12000);
    }

    async function runDnsLookupGui(label, includeFirewallCounter = false) {
      await clickModalText('Correlate timestamps before taking the next action', true);
      if (includeFirewallCounter) await clickModalText('Shape traffic through the allowed service lane', true);
      await resolveAuditDns(label);
      for (let i = 1; i <= 4; i++) {
        await clickModalText('Trace Path');
        await waitFor(`${label} DNS trace ${i}/4 complete`, `
          (() => {
            const text = document.body.innerText.replace(/\\s+/g, ' ');
            return text.includes('Lookups: ${i}') &&
              text.includes('DNS Records for app.audit-target.ops');
          })()
        `, 12000);
      }
      await waitFor(`${label} DNS score ready`, `
        (() => {
          const text = document.body.innerText.replace(/\\s+/g, ' ');
          return text.includes('Score: 60');
        })()
      `, 12000);
    }


    async function launchNmapScan(label, scanType) {
      await clickModalText(scanType);
      const launched = await evaluate(`
        (() => {
          const buttons = [...document.querySelectorAll('.fixed button')].filter((button) => {
            const rect = button.getBoundingClientRect();
            const label = (button.innerText || button.textContent || '').replace(/\s+/g, ' ').trim();
            return rect.width > 0 && rect.height > 0 && label.includes('LAUNCH SCAN') && !button.disabled;
          });
          const button = buttons[0];
          if (!button) return false;
          button.scrollIntoView({ block: 'center', inline: 'center' });
          button.click();
          return true;
        })()
      `);
      if (!launched) {
        const snapshot = await pageSnapshot(evaluate);
        throw new Error(`${label} could not launch ${scanType}.\n${snapshot}`);
      }
      await waitFor(`${label} ${scanType} started`, `
        (() => {
          const text = document.body.innerText.replace(/\s+/g, ' ');
          return text.includes('SCANNING...') || text.includes('OS Guess') || /Scans:\s*[1-9]/.test(text);
        })()
      `, 8000);
    }
    async function runWebNmap(label) {
      await clickModalText('Shape traffic through the allowed service lane', true);
      await clickModalText('Correlate timestamps before taking the next action', true);
      await clickModalText('Web Server');
      await launchNmapScan(label, 'Full Scan');
      await waitFor(`${label} Nmap action ready`, `
        (() => {
          const text = document.body.innerText;
          const gateStart = text.indexOf('Completion Gate');
          const gateEnd = text.indexOf('Target Proof');
          const gateText = gateStart >= 0 ? text.slice(gateStart, gateEnd > gateStart ? gateEnd : gateStart + 700) : text;
          return gateText.toLowerCase().includes('latest signal valid');
        })()
      `, 12000);
    }
    async function runProxySimulation(label, counters = ['Correlate timestamps before taking the next action']) {
      for (const counter of counters) await clickModalText(counter, true);
      await clickModalText('Start Simulation');
      await waitFor(`${label} proxy game ready`, `Boolean(document.body?.innerText.includes('Forward Proxy Mode') && (document.body?.innerText.includes('Click a website to request') || document.body?.innerText.includes('Click a target service to request')))`);
      await clickModalText('Google');
      await waitFor(`${label} proxy first request complete`, `
        (() => {
          const text = document.body.innerText.replace(/\\s+/g, ' ');
          return text.includes('Score: 10') && text.includes('Cache MISS');
        })()
      `, 12000);
      await clickModalText('Google');
      await waitFor(`${label} proxy cached request complete`, `
        (() => {
          const text = document.body.innerText.replace(/\\s+/g, ' ');
          return text.includes('Score: 25') && text.includes('Cache HIT');
        })()
      `, 12000);
      await clickModalText('YouTube');
      await waitFor(`${label} proxy third request complete`, `
        (() => {
          const text = document.body.innerText.replace(/\\s+/g, ' ');
          return text.includes('Score: 35') && text.includes('Cache MISS');
        })()
      `, 12000);
      await clickModalText('YouTube');
      await waitFor(`${label} proxy score ready`, `
        (() => {
          const text = document.body.innerText.replace(/\\s+/g, ' ');
          return text.includes('Score: 50') &&
            text.includes('Cache HIT');
        })()
      `, 12000);
    }

    async function runTrojanBuilder(label, counters = ['Reduce suspicious behavior and isolate the lab process']) {
      for (const counter of counters) await clickModalText(counter, true);
      await clickModalText('Office Macro');
      await clickTrojanPaletteTab(1);
      await clickModalText('Screen Capture');
      await clickTrojanPaletteTab(2);
      await clickModalText('Registry Key');
      await clickTrojanPaletteTab(3);
      await clickModalText('HTTPS Beacon');
      await waitFor(`${label} Trojan assembly ready`, `
        (() => {
          const text = document.body.innerText.replace(/\\s+/g, ' ');
          return text.includes('All component types assembled!');
        })()
      `, 12000);
      await clickModalText('Test Against Defenses');
      await waitFor(`${label} Trojan test lab ready`, `Boolean(document.body?.innerText.includes('Defense Testing Lab') && document.body?.innerText.includes('Run Test'))`);
      await clickModalText('Run Test');
      await waitFor(`${label} Trojan test result`, `
        (() => {
          const text = document.body.innerText.replace(/\\s+/g, ' ');
          return (text.includes('Detected by:') || text.includes('Trojan evaded all defenses!'));
        })()
      `, 12000);
    }

    async function runEncryptionPipeline(label, counters = ['Correlate timestamps before taking the next action'], minScore = 40) {
      for (const counter of counters) await clickModalText(counter, true);
      await clickModalText('Start Pipeline');
      await waitFor(`${label} encryption game ready`, `Boolean(document.body?.innerText.includes('Level 1: Caesar Cipher'))`);
      await clickModalText('HELLO', true);
      await fillFirstVisibleInput('3', 'number');
      await clickModalText('Encrypt & Decrypt');
      await waitFor(`${label} encryption level 1 output`, `Boolean(document.body?.innerText.includes('Success! Decrypted correctly') && document.body?.innerText.includes('Next Level'))`, 12000);
      await clickModalText('Next Level');
      await waitFor(`${label} encryption level 2 ready`, `Boolean(document.body?.innerText.includes('Level 2: XOR Encryption'))`);
      await clickModalText('CYBER', true);
      await fillFirstVisibleInput(auditTarget.xorKey, 'text');
      await clickModalText('Encrypt & Decrypt');
      await waitFor(`${label} encryption level 2 score ready`, `
        (() => {
          const text = document.body.innerText.replace(/\\s+/g, ' ');
          return /Score:\\s*(4[0-9]|[5-9][0-9]|100)/.test(text);
        })()
      `, 12000);
      if (minScore > 40) {
        await clickModalText('Next Level');
        await waitFor(`${label} encryption level 3 ready`, `Boolean(document.body?.innerText.includes('Level 3: Substitution Cipher'))`);
        await clickModalText('PAWS', true);
        await clickModalText('Encrypt & Decrypt');
        await waitFor(`${label} encryption score ready`, `
          (() => {
            const text = document.body.innerText.replace(/\\s+/g, ' ');
            return text.includes('Score: 60') &&
              text.includes('Success! Decrypted correctly');
          })()
        `, 12000);
      }
    }

    async function runCertViewer(label, counters = ['Verify issuer, host, expiry, and fingerprint']) {
      for (const counter of counters) await clickModalText(counter, true);
      await clickModalText('old-site.example', true);
      await clickModalText('INSPECT');
      await waitFor(`${label} cert viewer score ready`, `
        (() => {
          const text = document.body.innerText.replace(/\\s+/g, ' ');
          return text.includes(${JSON.stringify(auditTarget.oldDomain)}) &&
            text.includes('Issues Found:');
        })()
      `, 12000);
    }

    async function runLogAnalyzer(label, counters = ['Correlate timestamps before taking the next action']) {
      for (const counter of counters) await clickModalText(counter, true);
      await clickModalText('The Brute');
      await waitFor(`${label} log case ready`, `Boolean(document.body?.innerText.includes('Case 1:') && document.body?.innerText.includes('The Brute') && document.body?.innerText.includes('Solve the Case'))`, 12000);
      await clickModalText('Auto-Flag Pattern');
      await waitFor(`${label} log pattern flagged`, `
        (() => {
          const text = document.body.innerText.replace(/\\s+/g, ' ');
          return text.includes('Clues: 19/19') &&
            text.includes('Progress: 100%');
        })()
      `, 12000);
      await clickModalText('Brute Force Attack');
      await clickModalText('Solve Case');
      await waitFor(`${label} log case solved`, `
        (() => {
          const text = document.body.innerText.replace(/\\s+/g, ' ');
          return text.includes('Case Solved!') &&
            text.includes('A brute force attack happens');
        })()
      `, 12000);
    }


    async function clickAvailableNetworkNode(nodeId) {
      await waitFor(`network node ${nodeId} available`, `
        (() => {
          const expected = ${JSON.stringify(nodeId)};
          return [...document.querySelectorAll('.fixed button[data-network-node-source="available"]')]
            .some((candidate) => candidate.dataset.networkNodeId === expected);
        })()
      `, 12000);

      const clicked = await evaluate(`
        (() => {
          const expected = ${JSON.stringify(nodeId)};
          const button = [...document.querySelectorAll('.fixed button[data-network-node-source="available"]')]
            .find((candidate) => candidate.dataset.networkNodeId === expected);
          if (!button) return false;
          button.scrollIntoView({ block: 'center', inline: 'center' });
          button.click();
          return true;
        })()
      `);
      if (!clicked) {
        const snapshot = await pageSnapshot(evaluate);
        throw new Error(`Could not click available network node ${nodeId}.\n${snapshot}`);
      }
    }
    async function runNetworkNavigator(label) {
      await clickModalText('Shape traffic through the allowed service lane', true);
      const levelClicked = await evaluate(`
        (() => {
          const button = document.querySelector('.fixed button[data-network-level-id="1"]');
          if (!button) return false;
          button.scrollIntoView({ block: 'center', inline: 'center' });
          button.click();
          return true;
        })()
      `);
      if (!levelClicked) await clickModalText('1', true);
      await waitFor(`${label} network level ready`, `Boolean(document.body?.innerText.includes('Lvl 1') && document.body?.innerText.includes('Available next nodes'))`, 12000);

      const preferredOrder = ['FW1', 'FW2', 'K1', 'L1', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'E'];
      for (let step = 0; step < 10; step += 1) {
        const done = await evaluate(`Boolean(document.body?.innerText.includes('Level 1 Complete!'))`);
        if (done) break;
        const routeState = await evaluate(`
          (() => {
            const root = document.querySelector('.fixed [data-network-current]');
            return {
              current: root?.dataset.networkCurrent ?? null,
              path: root?.dataset.networkPath ?? null,
              complete: root?.dataset.networkComplete ?? null,
              available: [...document.querySelectorAll('.fixed button[data-network-node-source="available"]')]
                .map((candidate) => candidate.dataset.networkNodeId)
                .filter(Boolean),
            };
          })()
        `);
        const available = routeState.available ?? [];
        const nextNode = preferredOrder.find((nodeId) => available.includes(nodeId)) ?? available[0];
        console.error(`[audit] ${label} network route step ${step + 1}: current=${routeState.current ?? 'none'} path=${routeState.path ?? 'none'} available=${available.join(',') || 'none'} choose=${nextNode ?? 'none'}`);
        if (!nextNode) {
          const snapshot = await pageSnapshot(evaluate);
          throw new Error(`${label} network route stalled without available nodes.\n${snapshot}`);
        }
        await clickAvailableNetworkNode(nextNode);
        await sleep(400);
      }

      await waitFor(`${label} network score ready`, `
        (() => {
          const text = document.body.innerText.replace(/\\s+/g, ' ');
          return text.includes('Level 1 Complete!') &&
            text.includes('Score: 100');
        })()
      `, 12000);
    }

    async function runVpnTunnel(label) {
      await clickModalText('Shape traffic through the allowed service lane', true);
      await clickModalText('Correlate timestamps before taking the next action', true);
      await clickModalText('Initiate Connection');
      await waitFor(`${label} VPN initiated`, `Boolean(document.body?.innerText.includes('Connection initiated'))`, 12000);
      await clickModalText('Proceed to Authentication');
      await waitFor(`${label} VPN auth choice`, `Boolean(document.body?.innerText.includes('Choose Authentication Method'))`, 12000);
      await clickModalText('Certificate');
      await waitFor(`${label} VPN key exchange`, `Boolean(document.body?.innerText.includes('Key exchange complete'))`, 12000);
      await clickModalText('Establish Tunnel');
      await waitFor(`${label} VPN tunnel established`, `Boolean(document.body?.innerText.includes('VPN Tunnel ESTABLISHED'))`, 12000);
      await clickModalText('Send Encrypted Packet');
      await waitFor(`${label} first VPN packet`, `Boolean(document.body?.innerText.includes('Packet 1 sent securely'))`, 12000);
      await clickModalText('Send Encrypted Packet');
      await waitFor(`${label} second VPN packet`, `Boolean(document.body?.innerText.includes('Packet 2 sent securely'))`, 12000);
      await clickModalText('Send Encrypted Packet');
      await waitFor(`${label} VPN score ready`, `
        (() => {
          const text = document.body.innerText.replace(/\\s+/g, ' ');
          return text.includes('VPN Active!') &&
            text.includes('Score: 100');
        })()
      `, 12000);
    }

    async function clickFirstLoadBalancerPacket() {
      const clicked = await evaluate(`
        (() => {
          const button = [...document.querySelectorAll('.fixed button[title^="From "]')][0];
          if (!button) return false;
          button.scrollIntoView({ block: 'center', inline: 'center' });
          button.click();
          return true;
        })()
      `);
      if (!clicked) {
        const snapshot = await pageSnapshot(evaluate);
        throw new Error(`Could not click a load balancer packet.\n${snapshot}`);
      }
    }

    async function runLoadBalancer(label) {
      await clickModalText('Verify the clean snapshot before touching live data', true);
      await clickModalText('Correlate timestamps before taking the next action', true);
      await evaluate('Math.random = () => 0.1');
      await clickModalText('Start', true);
      await waitFor(`${label} load balancer packet`, `Boolean(document.querySelector('.fixed button[title^="From "]'))`, 30000);
      await clickFirstLoadBalancerPacket();
      await evaluate('Math.random = () => 0.99');
      await waitFor(`${label} load balancer score ready`, `
        (() => {
          const text = document.body.innerText.replace(/\\s+/g, ' ');
          return text.includes('Score: 100') &&
            text.includes('Good routing');
        })()
      `, 12000);
    }

    async function runDnsResolver(label) {
      await clickModalText('Shape traffic through the allowed service lane', true);
      await clickModalText('Correlate timestamps before taking the next action', true);
      for (const node of ['You', 'Browser', 'Resolver', 'Root Server', 'TLD Server', 'Auth Server', 'IP Address']) {
        await clickModalText(node, true);
        await sleep(220);
      }
      await waitFor(`${label} DNS resolver score ready`, `
        (() => {
          const text = document.body.innerText.replace(/\\s+/g, ' ');
          return text.includes('Domain resolved!') &&
            text.includes('app.audit-target.ops');
        })()
      `, 12000);
    }

    async function runAccessAce(label, counters = ['Pick the smallest scoped fix path before retrying']) {
      for (const counter of counters) await clickModalText(counter, true);
      await clickModalText('Level 1 Getting Started');
      await waitFor(`${label} Access Ace level ready`, `Boolean(document.body?.innerText.includes('Lv1: Getting Started') && document.body?.innerText.includes('Test Access'))`, 12000);
      const toggled = await evaluate(`
        (() => {
          const buttons = [...document.querySelectorAll('.fixed button[title="Read"], .fixed button[title="Write"], .fixed button[title="Execute"]')]
            .filter((button) => {
              const rect = button.getBoundingClientRect();
              return rect.width > 0 && rect.height > 0;
            });
          if (buttons.length < 18) return false;
          const desiredIndexes = [
            0, 1,       // Admin server_config: R W
            3, 4,       // Admin company_logo: R W
            6, 7, 8,    // Admin public_page: R W X
            12,         // Viewer company_logo: R
            15          // Viewer public_page: R
          ];
          desiredIndexes.forEach((index) => buttons[index].click());
          return true;
        })()
      `);
      if (!toggled) {
        const snapshot = await pageSnapshot(evaluate);
        throw new Error(`Could not configure Access Ace permissions.\n${snapshot}`);
      }
      const startedTest = await evaluate(`
        (() => {
          const buttons = [...document.querySelectorAll('.fixed button')].filter((button) => {
            const label = (button.innerText || button.textContent || '').replace(/\\s+/g, ' ').trim();
            return label === 'Test Access';
          });
          const button = buttons[buttons.length - 1];
          if (!button) return false;
          button.scrollIntoView({ block: 'center', inline: 'center' });
          button.click();
          return true;
        })()
      `);
      if (!startedTest) {
        const snapshot = await pageSnapshot(evaluate);
        throw new Error(`Could not start Access Ace test.\n${snapshot}`);
      }
      await waitFor(`${label} Access Ace score ready`, `
        (() => {
          const text = document.body.innerText.replace(/\\s+/g, ' ');
          return text.includes('Score: 100%') &&
            text.includes('Level Complete!');
        })()
      `, 20000);
    }

    async function runPhishingDetective(label) {
      await clickModalText('Correlate timestamps before taking the next action', true);
      await clickModalText('Use the OSINT clue only where the active step needs it', true);
      await clickModalText('PayPal Security Team');
      await clickModalText('Urgent: Your account has been compromised!');
      await clickModalText('Click here to verify');
      await clickModalText('Mark as Phishing');
      await waitFor(`${label} phishing detective score ready`, `
        (() => {
          const text = document.body.innerText.replace(/\\s+/g, ' ');
          return text.includes('Correct! Good detective work!');
        })()
      `, 12000);
    }

    async function runPhishingSimulator(label) {
      await clickModalText('Stay on the active app surface and verify behavior', true);
      await clickModalText('Stage only the safe lab payload and monitor response', true);
      await clickModalText('Validate the human clue against a second signal', true);
      await fillModalField('security@audit-target.ops', 'security@login-audit-target-ops.ops');
      await fillModalField('URGENT: Action required!', 'Quarterly account verification');
      await fillModalField('Write your email body...', 'Please verify the account workflow in this training lab before the simulated review window closes.', 'textarea');
      await clickModalText('Urgency OFF');
      await clickModalText('Spoof OFF');
      await clickModalText('Preview & Score');
      await waitFor(`${label} phishing builder score ready`, `
        (() => {
          const text = document.body.innerText.replace(/\\s+/g, ' ');
          return text.includes('Convincing Score: 50/50');
        })()
      `, 12000);
      await clickModalText('bank@secure-login.com');
      await clickModalText('Phishing', true);
      await waitFor(`${label} phishing classifier correct`, `
        (() => {
          const text = document.body.innerText.replace(/\\s+/g, ' ');
          return text.includes('CORRECT!') &&
            text.includes('This is a phishing email');
        })()
      `, 12000);
    }

    async function runXssXpert(label) {
      await clickModalText('Use a narrow app-layer test and respect blocked patterns', true);
      await clickModalText('Pick the smallest scoped fix path before retrying', true);
      await clickModalText('Stay on the active app surface and verify behavior', true);
      await clickModalText('Start Defense');
      await waitFor(`${label} XSS level ready`, `Boolean(document.body?.innerText.includes('Lvl 1') && document.body?.innerText.includes('Comment #1 of 4'))`, 12000);
      const decisions = [
        ['Comment #1 of 4', 'Approve', 'Score: 25'],
        ['Comment #2 of 4', 'Approve', 'Score: 50'],
        ['Comment #3 of 4', 'Block', 'Score: 75'],
        ['Comment #4 of 4', 'Block', 'Level 1 Complete!'],
      ];
      for (const [marker, action, resultMarker] of decisions) {
        await waitFor(`${label} ${marker}`, `
          (() => document.body.innerText.replace(/\\s+/g, ' ').includes(${JSON.stringify(marker)}))()
        `, 12000);
        await clickModalText(action, true);
        await waitFor(`${label} XSS ${action} result`, `
          (() => document.body.innerText.replace(/\\s+/g, ' ').includes(${JSON.stringify(resultMarker)}))()
        `, 12000);
        await sleep(250);
      }
      await waitFor(`${label} XSS score ready`, `
        (() => {
          const text = document.body.innerText.replace(/\\s+/g, ' ');
          return text.includes('Level 1 Complete!') &&
            text.includes('Score: 100');
        })()
      `, 12000);
    }

    async function clickNextFirewallPacket() {
      const clicked = await evaluate(`
        (() => {
          const threatLabels = new Set(['MALWARE', 'INTRUSION', 'DDOS']);
          const safeLabels = new Set(['HTTPS', 'DNS', 'SSH']);
          const packetNodes = [...document.querySelectorAll('.fixed .absolute.top-0')];
          for (const node of packetNodes) {
            const text = (node.innerText || '').replace(/\\s+/g, ' ').trim();
            const label = [...threatLabels, ...safeLabels].find((item) => text.includes(item));
            if (!label) continue;
            const buttons = [...node.querySelectorAll('button')];
            const button = threatLabels.has(label) ? buttons[1] : buttons[0];
            if (!button) continue;
            button.scrollIntoView({ block: 'center', inline: 'center' });
            button.click();
            return { clicked: true, label };
          }
          return { clicked: false };
        })()
      `);
      if (!clicked?.clicked) {
        const snapshot = await pageSnapshot(evaluate);
        throw new Error(`Could not click a firewall packet action.\n${snapshot}`);
      }
      return clicked.label;
    }

    async function runFirewallDefender(label) {
      await clickModalText('Stage only the safe lab payload and monitor response', true);
      await clickModalText('Start Defense');
      for (let i = 0; i < 5; i++) {
        await waitFor(`${label} firewall packet ${i + 1}`, `
          Boolean(document.querySelector('.fixed .absolute.top-0 button'))
        `, 30000);
        const labelClicked = await clickNextFirewallPacket();
        console.error(`[audit] firewall handled ${labelClicked}`);
        await sleep(250);
      }
      await waitFor(`${label} firewall score ready`, `
        (() => {
          const text = document.body.innerText.replace(/\\s+/g, ' ');
          return /Score:\\s*(4[0-9]|[5-9][0-9]|100)/.test(text);
        })()
      `, 12000);
    }

    async function clickCertPiece(value) {
      const clicked = await evaluate(`
        (() => {
          const values = ${JSON.stringify(clickCandidates(value))};
          const buttons = [...document.querySelectorAll('.fixed button')];
          const button = buttons.find((candidate) => {
            const label = (candidate.innerText || candidate.textContent || '').replace(/\\s+/g, ' ').trim();
            return values.includes(label);
          });
          if (!button) return false;
          button.scrollIntoView({ block: 'center', inline: 'center' });
          button.click();
          return true;
        })()
      `);
      if (!clicked) {
        const snapshot = await pageSnapshot(evaluate);
        throw new Error(`Could not click cert piece "${value}".\n${snapshot}`);
      }
    }

    async function clickCertField(label) {
      const clicked = await evaluate(`
        (() => {
          const label = ${JSON.stringify(label)};
          const labels = [...document.querySelectorAll('.fixed p')];
          const labelNode = labels.find((candidate) =>
            (candidate.innerText || candidate.textContent || '').replace(/\\s+/g, ' ').trim() === label
          );
          let node = labelNode;
          while (node && !(node.classList?.contains('relative') && node.classList?.contains('flex') && node.classList?.contains('cursor-pointer'))) {
            node = node.parentElement;
          }
          if (!node) return false;
          node.scrollIntoView({ block: 'center', inline: 'center' });
          node.click();
          return true;
        })()
      `);
      if (!clicked) {
        const snapshot = await pageSnapshot(evaluate);
        throw new Error(`Could not click cert field "${label}".\n${snapshot}`);
      }
    }

    async function runCertChampion(label) {
      await clickModalText('Keep the sample contained and watch behavior', true);
      await clickModalText('Start Building');
      await waitFor(`${label} cert champion level ready`, `Boolean(document.body?.innerText.includes('Certificate Assembly') && document.body?.innerText.includes('Certificate Pieces:'))`, 12000);
      const placements = [
        ['www.cyberpaws.kids', 'Subject Name'],
        ['CyberPaws CA', 'Issuer Name'],
        ['Jan 1, 2025', 'Valid From'],
        ['Jan 1, 2026', 'Valid Until'],
      ];
      for (const [piece, field] of placements) {
        await clickCertPiece(piece);
        await clickCertField(field);
        await sleep(300);
      }
      await waitFor(`${label} cert champion score ready`, `
        (() => {
          const text = document.body.innerText.replace(/\\s+/g, ' ');
          return text.includes('Level 1 Complete!') &&
            text.includes('Certificate assembled successfully!');
        })()
      `, 12000);
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

    await waitFor('DNS lookup modal', `Boolean(document.body?.innerText.includes('DNS Lookup Tool') && document.body?.innerText.includes('Completion Gate'))`);
    console.error('[audit] modal ready');
    await clickByText('Shape traffic through the allowed service lane', true);
    await clickByText('Correlate timestamps before taking the next action', true);
    await resolveAuditDns('Initial DNS lookup');
    await waitFor('trace button', `Boolean(document.body?.innerText.includes('DNS Resolution Path') && document.body?.innerText.includes('Trace Path'))`);
    for (let trace = 1; trace <= 4; trace++) {
      await clickModalText('Trace Path');
      console.error(`[audit] DNS trace ${trace}/4 running`);
      await sleep(4300);
    }

    const modalState = await readModalState(openedTool);
    await assertSubmittable(modalState, 'Initial DNS lookup', 'Commit Segment');

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

    await waitFor('Nmap port scanner modal', `Boolean(document.body?.innerText.includes('Nmap Port Scanner') && document.body?.innerText.includes('Completion Gate'))`);
    console.error('[audit] Nmap modal ready');
    await clickByText('Shape traffic through the allowed service lane', true);
    await clickByText('Correlate timestamps before taking the next action', true);
    await clickModalText('Bank Server');
    await clickByText('Full Scan');
    await clickByText('LAUNCH SCAN');
    console.error('[audit] Nmap full scan running');
    await waitFor('Nmap full scan completion', `Boolean(document.body?.innerText.includes('Scans: 1') || document.body?.innerText.includes('OS Guess'))`, 45000);

    const nmapModalState = await readModalState(openedSecondTool);
    await assertSubmittable(nmapModalState, 'Initial Nmap');

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
          text.includes('STEP 2') && text.includes('WEB ANALYSIS ACTIVE') &&
          text.toUpperCase().includes('SQL SAFARI');
      })()
    `, 12000);
    console.error('[audit] first VS step completed and next ordered step visible');

    const openedSqlSafari = await openQueuedTool('SQL Safari');
    await waitFor('SQL Safari modal', `Boolean(document.body?.innerText.includes('SQL Safari') && document.body?.innerText.includes('Completion Gate'))`);
    await clickByText('Use a narrow app-layer test and respect blocked patterns', true);
    await clickByText('Pick the smallest scoped fix path before retrying', true);
    await clickByText('The Sneaky Quote');
    await waitFor('SQL Safari level ready', `Boolean(document.body?.innerText.includes('Payloads:') && document.body?.innerText.includes('Set Input'))`);
    await clickByText("' OR '1'='1");
    await waitFor('SQL Safari payload selected', `Boolean(document.body?.innerText.includes('Run Query'))`);
    await clickByText('Run Query');
    await waitFor('SQL Safari level 1 result', `Boolean(document.body?.innerText.includes('Injection Detected!') && document.body?.innerText.includes('Next Level') || document.body?.innerText.includes('Learn More'))`);
    await clickModalText('Learn More');
    await waitFor('SQL Safari next level button', `Boolean(document.body?.innerText.includes('Next Level'))`);
    await clickModalText('Next Level');
    await waitFor('SQL Safari level 2 ready', `Boolean(document.body?.innerText.includes('Union Strike') && document.body?.innerText.includes('Payloads:'))`);
    await clickModalText(`' UNION SELECT * FROM audit_target_customer_vault_secrets--`, true);
    await clickModalText('Run Query');
    await waitFor('SQL Safari score ready', `Boolean(document.body?.innerText.includes('Injection Detected!'))`);
    const sqlSafariState = await readModalState(openedSqlSafari);
    await assertSubmittable(sqlSafariState, 'SQL Safari');
    await submitStep();
    await waitFor('second VS step completion', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('STEPS 2/44') &&
          text.includes('STEP 3') && text.includes('ACCESS ACTIVE') &&
          text.toUpperCase().includes('SQL INJECTOR GUI');
      })()
    `, 12000);
    console.error('[audit] second VS step completed and SQL Injector is next');

    const openedSqlInjector = await openQueuedTool('SQL Injector GUI');
    await waitFor('SQL Injector modal', `Boolean(document.body?.innerText.includes('SQL Injector') && document.body?.innerText.includes('Completion Gate'))`);
    await clickByText('Use a narrow app-layer test and respect blocked patterns', true);
    await clickByText('Pick the smallest scoped fix path before retrying', true);
    await clickByText('Correlate timestamps before taking the next action', true);
    await clickByText('Classic OR 1=1');
    await waitFor('SQL Injector vulnerable result', `Boolean(document.body?.innerText.includes('VULNERABLE!'))`, 12000);
    const sqlInjectorState = await readModalState(openedSqlInjector);
    await assertSubmittable(sqlInjectorState, 'SQL Injector');
    await submitStep();
    await waitFor('third VS step completion', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('STEPS 3/44') &&
          text.includes('STEP 4') && text.includes('OBJECTIVE ACTIVE') &&
          text.toUpperCase().includes('ENCRYPTION PIPELINE');
      })()
    `, 12000);
    console.error('[audit] third VS step completed and Encryption Pipeline is next');

    const openedEncryption = await openQueuedTool('Encryption Pipeline');
    await waitFor('Encryption Pipeline modal', `Boolean(document.body?.innerText.includes('Encryption Pipeline') && document.body?.innerText.includes('Completion Gate'))`);
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
    await fillFirstVisibleInput(auditTarget.xorKey, 'text');
    await clickByText('Encrypt & Decrypt');
    await waitFor('Encryption Pipeline score ready', `Boolean(document.body?.innerText.includes('Score: 40'))`, 12000);
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
    await waitFor('WHOIS Lookup modal', `Boolean(document.body?.innerText.includes('WHOIS Lookup') && document.body?.innerText.includes('Completion Gate'))`);
    await clickByText('Correlate timestamps before taking the next action', true);
    await fillFirstVisibleInput(auditTarget.primaryDomain, 'text');
    await clickModalText('LOOKUP', true);
    await waitFor('WHOIS first lookup', `Boolean(document.body?.innerText.includes('Audit Target Labs') && document.body?.innerText.includes('Lookups: 1'))`, 12000);
    await fillFirstVisibleInput(auditTarget.vendorDomain, 'text');
    await clickModalText('LOOKUP', true);
    await waitFor('WHOIS score ready', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('Audit Target Partner Mesh') &&
          text.includes('Score: 40');
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
    await waitFor('Hash Cracker modal', `Boolean(document.body?.innerText.includes('Hash Cracker') && document.body?.innerText.includes('Completion Gate'))`);
    await clickByText('Reduce suspicious behavior and isolate the lab process', true);
    await clickByText('Correlate timestamps before taking the next action', true);
    await clickByText('Easy Start');
    await sleep(500);
    await clickByText('START CRACKING');
    await waitFor('Hash Cracker score ready', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('Password:') &&
          text.includes('Hashes Cracked: 1/3') &&
          text.includes('Progress 100%');
      })()
    `, 45000);
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
    await waitFor('SSL Handshake modal', `Boolean(document.body?.innerText.includes('SSL Handshake') && document.body?.innerText.includes('Completion Gate'))`);
    await clickByText('Pick the smallest scoped fix path before retrying', true);
    await clickByText('Correlate timestamps before taking the next action', true);
    await clickByText('Client Hello');
    await clickByText('Server Hello');
    await clickByText('Key Exchange');
    await clickByText('Finished');
    await waitFor('SSL Handshake score ready', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('Level 1 Complete!');
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
    await waitFor('Packet Sniffer modal', `Boolean(document.body?.innerText.includes('Packet Sniffer') && document.body?.innerText.includes('Completion Gate'))`);
    await clickByText('Verify issuer, host, expiry, and fingerprint', true);
    await clickByText('Correlate timestamps before taking the next action', true);
    await clickByText('START CAPTURE');
    await waitFor('Packet Sniffer segment ready', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return /Total Score\\s+(4[5-9]|[5-9][0-9]|100)/.test(text);
      })()
    `, 45000);
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
    await waitFor('Cert Viewer modal', `Boolean(document.body?.innerText.includes('Cert Viewer') && document.body?.innerText.includes('Completion Gate'))`);
    await clickByText('Verify issuer, host, expiry, and fingerprint', true);
    await clickByText('Correlate timestamps before taking the next action', true);
    await clickByText('old-site.example', true);
    await clickByText('INSPECT');
    await waitFor('Cert Viewer score ready', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes(${JSON.stringify(auditTarget.oldDomain)}) &&
          text.includes('Issues Found:');
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
    await waitFor('Keylogger Sim modal', `Boolean(document.body?.innerText.includes('Keylogger Sim') && document.body?.innerText.includes('Completion Gate'))`);
    await clickByText('Reduce suspicious behavior and isolate the lab process', true);
    await clickByText('Pick the smallest scoped fix path before retrying', true);
    await clickVirtualKeys(['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P']);
    await waitFor('Keylogger Sim score ready', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('Keys Captured');
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
    await waitFor('Proxy Server modal', `Boolean(document.body?.innerText.includes('Proxy Server Simulator') && document.body?.innerText.includes('Completion Gate'))`);
    await clickByText('Correlate timestamps before taking the next action', true);
    await clickByText('Pick the smallest scoped fix path before retrying', true);
    await clickByText('Start Simulation');
    await waitFor('Proxy game ready', `Boolean(document.body?.innerText.includes('Forward Proxy Mode') && (document.body?.innerText.includes('Click a website to request') || document.body?.innerText.includes('Click a target service to request')))`);
    await clickModalText('Google');
    await waitFor('Proxy first request complete', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('Score: 10') && text.includes('Cache MISS');
      })()
    `, 12000);
    await clickModalText('Google');
    await waitFor('Proxy cached request complete', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('Score: 25') && text.includes('Cache HIT');
      })()
    `, 12000);
    await clickModalText('YouTube');
    await waitFor('Proxy third request complete', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('Score: 35') && text.includes('Cache MISS');
      })()
    `, 12000);
    await clickModalText('YouTube');
    await waitFor('Proxy score ready', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('Score: 50') &&
          text.includes('Cache HIT');
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
    await waitFor('Web Nmap modal', `Boolean(document.body?.innerText.includes('Nmap Port Scanner') && document.body?.innerText.includes('Completion Gate'))`);
    await clickModalText('Use a narrow app-layer test and respect blocked patterns', true);
    await clickModalText('Correlate timestamps before taking the next action', true);
    await clickModalText('Web Server');
    await launchNmapScan('Web Nmap', 'Full Scan');
    await waitFor('Web Nmap action ready', `
      (() => {
          const text = document.body.innerText;
          const gateStart = text.indexOf('Completion Gate');
          const gateEnd = text.indexOf('Target Proof');
          const gateText = gateStart >= 0 ? text.slice(gateStart, gateEnd > gateStart ? gateEnd : gateStart + 700) : text;
          return gateText.toLowerCase().includes('latest signal valid');
        })()
    `, 12000);    const webNmapState = await readModalState(openedWebNmap);
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
    await waitFor('XSS Tester modal', `Boolean(document.body?.innerText.includes('XSS Tester') && document.body?.innerText.includes('Completion Gate'))`);
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
        return text.includes('Sanitized Output:');
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
    await waitFor('Trojan Builder modal', `Boolean(document.body?.innerText.includes('Trojan Builder') && document.body?.innerText.includes('Completion Gate'))`);
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
        return text.includes('All component types assembled!');
      })()
    `, 12000);
    await clickModalText('Test Against Defenses');
    await waitFor('Trojan test lab ready', `Boolean(document.body?.innerText.includes('Defense Testing Lab') && document.body?.innerText.includes('Run Test'))`);
    await clickModalText('Run Test');
    await waitFor('Trojan test result', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return (text.includes('Detected by:') || text.includes('Trojan evaded all defenses!'));
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
    await waitFor('Phishing Simulator modal', `Boolean(document.body?.innerText.includes('Phishing Simulator') && document.body?.innerText.includes('Completion Gate'))`);
    await clickModalText('Reduce suspicious behavior and isolate the lab process', true);
    await clickModalText('Correlate timestamps before taking the next action', true);
    await fillModalField('security@audit-target.ops', 'security@login-audit-target-ops.ops');
    await fillModalField('URGENT: Action required!', 'Quarterly account verification');
    await fillModalField('Write your email body...', 'Please verify the account workflow in this training lab before the simulated review window closes.', 'textarea');
    await clickModalText('Urgency OFF');
    await clickModalText('Spoof OFF');
    await clickModalText('Preview & Score');
    await waitFor('Phishing builder score ready', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('Convincing Score: 50/50');
      })()
    `, 12000);
    await clickModalText('bank@secure-login.com');
    await clickModalText('Phishing', true);
    await waitFor('Phishing classifier correct', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('CORRECT!') &&
          text.includes('This is a phishing email');
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
    await waitFor('Endpoint Trojan modal', `Boolean(document.body?.innerText.includes('Trojan Builder') && document.body?.innerText.includes('Completion Gate'))`);
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
        return text.includes('All component types assembled!');
      })()
    `, 12000);
    await clickModalText('Test Against Defenses');
    await waitFor('Endpoint Trojan test lab ready', `Boolean(document.body?.innerText.includes('Defense Testing Lab') && document.body?.innerText.includes('Run Test'))`);
    await clickModalText('Run Test');
    await waitFor('Endpoint Trojan test result', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return (text.includes('Detected by:') || text.includes('Trojan evaded all defenses!'));
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
    await waitFor('Telemetry Keylogger modal', `Boolean(document.body?.innerText.includes('Keylogger Sim') && document.body?.innerText.includes('Completion Gate'))`);
    await clickModalText('Reduce suspicious behavior and isolate the lab process', true);
    await clickModalText('Correlate timestamps before taking the next action', true);
    await clickVirtualKeys(['A', 'U', 'D', 'I', 'T', 'S', 'E', 'C', 'U', 'R']);
    await waitFor('Telemetry Keylogger score ready', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('Keys Captured');
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
    await waitFor('Local Trojan modal', `Boolean(document.body?.innerText.includes('Trojan Builder') && document.body?.innerText.includes('Completion Gate'))`);
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
        return text.includes('All component types assembled!');
      })()
    `, 12000);
    await clickModalText('Test Against Defenses');
    await waitFor('Local Trojan test lab ready', `Boolean(document.body?.innerText.includes('Defense Testing Lab') && document.body?.innerText.includes('Run Test'))`);
    await clickModalText('Run Test');
    await waitFor('Local Trojan test result', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return (text.includes('Detected by:') || text.includes('Trojan evaded all defenses!'));
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
    await waitFor('Log Analyzer modal', `Boolean(document.body?.innerText.includes('Log Analyzer') && document.body?.innerText.includes('Completion Gate'))`);
    await clickModalText('Reduce suspicious behavior and isolate the lab process', true);
    await clickModalText('Pick the smallest scoped fix path before retrying', true);
    await clickModalText('The Brute');
    await waitFor('Log Analyzer case ready', `Boolean(document.body?.innerText.includes('Case 1:') && document.body?.innerText.includes('The Brute') && document.body?.innerText.includes('Solve the Case'))`, 12000);
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
          text.includes('A brute force attack happens');
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
    await waitFor('Cookie Encryption Pipeline modal', `Boolean(document.body?.innerText.includes('Encryption Pipeline') && document.body?.innerText.includes('Completion Gate'))`);
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
    await fillFirstVisibleInput(auditTarget.xorKey, 'text');
    await clickModalText('Encrypt & Decrypt');
    await waitFor('Cookie Encryption score ready', `Boolean(document.body?.innerText.includes('Score: 40'))`, 12000);
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
    await waitFor('API WHOIS Lookup modal', `Boolean(document.body?.innerText.includes('WHOIS Lookup') && document.body?.innerText.includes('Completion Gate'))`);
    await clickModalText('Correlate timestamps before taking the next action', true);
    await fillFirstVisibleInput(auditTarget.primaryDomain, 'text');
    await clickModalText('LOOKUP', true);
    await waitFor('API WHOIS first lookup', `Boolean(document.body?.innerText.includes('Audit Target Labs') && document.body?.innerText.includes('Lookups: 1'))`, 12000);
    await fillFirstVisibleInput(auditTarget.vendorDomain, 'text');
    await clickModalText('LOOKUP', true);
    await waitFor('API WHOIS score ready', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('Audit Target Partner Mesh') &&
          text.includes('Score: 40');
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
    await waitFor('API DNS lookup modal', `Boolean(document.body?.innerText.includes('DNS Lookup Tool') && document.body?.innerText.includes('Completion Gate'))`);
    await clickModalText('Correlate timestamps before taking the next action', true);
    await resolveAuditDns('API DNS lookup');
    for (let i = 1; i <= 4; i++) {
      await clickModalText('Trace Path');
      await waitFor(`API DNS trace ${i}/4 complete`, `
        (() => {
          const text = document.body.innerText.replace(/\\s+/g, ' ');
          return text.includes('Lookups: ${i}') &&
            text.includes('DNS Records for app.audit-target.ops');
        })()
      `, 12000);
    }
    await waitFor('API DNS score ready', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('Score: 60');
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
    await waitFor('XOR Tool modal', `Boolean(document.body?.innerText.includes('XOR Tool') && document.body?.innerText.includes('Completion Gate'))`);
    await clickModalText('Pick the smallest scoped fix path before retrying', true);
    for (let i = 0; i < 5; i++) {
      await clickModalText('Run XOR Operation');
      await sleep(80);
    }
    await sleep(1000);
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
    await waitFor('API Hash Cracker modal', `Boolean(document.body?.innerText.includes('Hash Cracker') && document.body?.innerText.includes('Completion Gate'))`);
    await clickModalText('Pick the smallest scoped fix path before retrying', true);
    await clickModalText('Easy Start');
    await sleep(500);
    await clickModalText('START CRACKING');
    await waitFor('API Hash Cracker score ready', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('Password:') &&
          text.includes('Hashes Cracked: 1/3') &&
          text.includes('Progress 100%');
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
    await waitFor('API Proxy Server modal', `Boolean(document.body?.innerText.includes('Proxy Server Simulator') && document.body?.innerText.includes('Completion Gate'))`);
    await clickModalText('Correlate timestamps before taking the next action', true);
    await clickModalText('Pick the smallest scoped fix path before retrying', true);
    await clickModalText('Start Simulation');
    await waitFor('API Proxy game ready', `Boolean(document.body?.innerText.includes('Forward Proxy Mode') && (document.body?.innerText.includes('Click a website to request') || document.body?.innerText.includes('Click a target service to request')))`);
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
          text.includes('Cache HIT');
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

    await clickByText('Internal Service Access');
    await waitFor('Internal Service Access selected', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('Internal Service Access') &&
          text.includes('Trace network path') &&
          text.toUpperCase().includes('NETWORK NAVIGATOR');
      })()
    `, 12000);
    console.error('[audit] Internal Service Access selected');

    const openedNetworkNavigator = await openQueuedTool('Network Navigator');
    await waitFor('Network Navigator modal', `Boolean(document.body?.innerText.includes('Network Navigator') && document.body?.innerText.includes('Completion Gate'))`);
    await runNetworkNavigator('Internal Service');
    const networkNavigatorState = await readModalState(openedNetworkNavigator);
    await assertSubmittable(networkNavigatorState, 'Network Navigator');
    await submitStep();
    await waitFor('Internal Service step 1 completion', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('OBJECTIVES 7/14') &&
          text.includes('STEPS 23/44') &&
          text.includes('Internal Service Access 1/3') &&
          text.includes('Find service gap') &&
          text.toUpperCase().includes('NMAP SCANNER');
      })()
    `, 12000);
    console.error('[audit] Internal Service step 1 completed through Network Navigator GUI');

    const openedInternalNmap = await openQueuedTool('Nmap Scanner');
    await waitFor('Internal Nmap modal', `Boolean(document.body?.innerText.includes('Nmap Port Scanner') && document.body?.innerText.includes('Completion Gate'))`);
    await runWebNmap('Internal Service');
    const internalNmapState = await readModalState(openedInternalNmap);
    await assertSubmittable(internalNmapState, 'Internal Nmap');
    await submitStep();
    await waitFor('Internal Service step 2 completion', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('OBJECTIVES 7/14') &&
          text.includes('STEPS 24/44') &&
          text.includes('Internal Service Access 2/3') &&
          text.includes('Open tunnel window') &&
          text.toUpperCase().includes('VPN TUNNEL');
      })()
    `, 12000);
    console.error('[audit] Internal Service step 2 completed through Nmap GUI');

    const openedVpnTunnel = await openQueuedTool('VPN Tunnel');
    await waitFor('VPN Tunnel modal', `Boolean(document.body?.innerText.includes('VPN Tunnel') && document.body?.innerText.includes('Completion Gate'))`);
    await runVpnTunnel('Internal Service');
    const vpnTunnelState = await readModalState(openedVpnTunnel);
    await assertSubmittable(vpnTunnelState, 'VPN Tunnel');
    await submitStep();
    await waitFor('Internal Service objective completion', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('OBJECTIVES 8/14') &&
          text.includes('STEPS 25/44') &&
          text.includes('Internal Service Access 3/3');
      })()
    `, 12000);
    console.error('[audit] Internal Service Access objective completed through ordered GUI chain');

    await clickByText('Service Disruption');
    await waitFor('Service Disruption selected', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('Service Disruption') &&
          text.includes('Find traffic choke point') &&
          text.toUpperCase().includes('NETWORK PACKET TRACER');
      })()
    `, 12000);
    console.error('[audit] Service Disruption selected');

    const openedChokeTracer = await openQueuedTool('Network Packet Tracer');
    await waitFor('Traffic choke Packet Sniffer modal', `Boolean(document.body?.innerText.includes('Packet Sniffer') && document.body?.innerText.includes('Completion Gate'))`);
    await clickModalText('Shape traffic through the allowed service lane', true);
    await clickModalText('Correlate timestamps before taking the next action', true);
    await clickModalText('START CAPTURE');
    await waitFor('Traffic choke packet score ready', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return /Total Score\\s+(4[5-9]|[5-9][0-9]|100)/.test(text);
      })()
    `, 20000);
    const chokeTracerState = await readModalState(openedChokeTracer);
    await assertSubmittable(chokeTracerState, 'Traffic Choke Packet Tracer');
    await submitStep();
    await waitFor('Service Disruption step 1 completion', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('OBJECTIVES 8/14') &&
          text.includes('STEPS 26/44') &&
          text.includes('Service Disruption 1/3') &&
          text.includes('Stress routing layer') &&
          text.toUpperCase().includes('PROXY SERVER');
      })()
    `, 12000);
    console.error('[audit] Service Disruption step 1 completed through Packet Sniffer GUI');

    const openedDisruptionProxy = await openQueuedTool('Proxy Server');
    await waitFor('Disruption Proxy modal', `Boolean(document.body?.innerText.includes('Proxy Server Simulator') && document.body?.innerText.includes('Completion Gate'))`);
    await runProxySimulation('Service Disruption', ['Shape traffic through the allowed service lane', 'Verify the clean snapshot before touching live data']);
    const disruptionProxyState = await readModalState(openedDisruptionProxy);
    await assertSubmittable(disruptionProxyState, 'Disruption Proxy Server');
    await submitStep();
    await waitFor('Service Disruption step 2 completion', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('OBJECTIVES 8/14') &&
          text.includes('STEPS 27/44') &&
          text.includes('Service Disruption 2/3') &&
          text.includes('Force failover event') &&
          text.toUpperCase().includes('LOAD BALANCER');
      })()
    `, 12000);
    console.error('[audit] Service Disruption step 2 completed through Proxy GUI');

    const openedLoadBalancer = await openQueuedTool('Load Balancer');
    await waitFor('Load Balancer modal', `Boolean(document.body?.innerText.includes('Load Balancer') && document.body?.innerText.includes('Completion Gate'))`);
    await runLoadBalancer('Service Disruption');
    const loadBalancerState = await readModalState(openedLoadBalancer);
    await assertSubmittable(loadBalancerState, 'Load Balancer');
    await submitStep();
    await waitFor('Service Disruption objective completion', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('OBJECTIVES 9/14') &&
          text.includes('STEPS 28/44') &&
          text.includes('Service Disruption 3/3');
      })()
    `, 12000);
    console.error('[audit] Service Disruption objective completed through ordered GUI chain');

    await clickByText('Local Pharming Redirect');
    await waitFor('Local Pharming Redirect selected', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('Local Pharming Redirect') &&
          text.includes('Place local network hook') &&
          text.toUpperCase().includes('TROJAN BUILDER');
      })()
    `, 12000);
    console.error('[audit] Local Pharming Redirect selected');

    const openedPharmingTrojan = await openQueuedTool('Trojan Builder');
    await waitFor('Pharming Trojan modal', `Boolean(document.body?.innerText.includes('Trojan Builder') && document.body?.innerText.includes('Completion Gate'))`);
    await runTrojanBuilder('Local Pharming', ['Reduce suspicious behavior and isolate the lab process', 'Pick the smallest scoped fix path before retrying']);
    const pharmingTrojanState = await readModalState(openedPharmingTrojan);
    await assertSubmittable(pharmingTrojanState, 'Pharming Trojan');
    await submitStep();
    await waitFor('Local Pharming step 1 completion', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('OBJECTIVES 9/14') &&
          text.includes('STEPS 29/44') &&
          text.includes('Local Pharming Redirect 1/3') &&
          text.includes('Alter name-resolution path') &&
          text.toUpperCase().includes('DNS RESOLVER');
      })()
    `, 12000);
    console.error('[audit] Local Pharming step 1 completed through Trojan Builder GUI');

    const openedDnsResolver = await openQueuedTool('DNS Resolver');
    await waitFor('DNS Resolver modal', `Boolean(document.body?.innerText.includes('DNS Resolver') && document.body?.innerText.includes('Completion Gate'))`);
    await runDnsResolver('Local Pharming');
    const dnsResolverState = await readModalState(openedDnsResolver);
    await assertSubmittable(dnsResolverState, 'DNS Resolver');
    await submitStep();
    await waitFor('Local Pharming step 2 completion', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('OBJECTIVES 9/14') &&
          text.includes('STEPS 30/44') &&
          text.includes('Local Pharming Redirect 2/3') &&
          text.includes('Validate certificate mismatch') &&
          text.toUpperCase().includes('CERT VIEWER GUI');
      })()
    `, 12000);
    console.error('[audit] Local Pharming step 2 completed through DNS Resolver GUI');

    const openedPharmingCert = await openQueuedTool('Cert Viewer');
    await waitFor('Pharming Cert Viewer modal', `Boolean(document.body?.innerText.includes('Cert Viewer') && document.body?.innerText.includes('Completion Gate'))`);
    await runCertViewer('Local Pharming', ['Verify issuer, host, expiry, and fingerprint', 'Pick the smallest scoped fix path before retrying']);
    const pharmingCertState = await readModalState(openedPharmingCert);
    await assertSubmittable(pharmingCertState, 'Pharming Cert Viewer');
    await submitStep();
    await waitFor('Local Pharming objective completion', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('OBJECTIVES 10/14') &&
          text.includes('STEPS 31/44') &&
          text.includes('Local Pharming Redirect 3/3');
      })()
    `, 12000);
    console.error('[audit] Local Pharming Redirect objective completed through ordered GUI chain');

    await clickByText('Backup Dump');
    await waitFor('Backup Dump selected', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('Backup Dump') &&
          text.includes('Discover backup surface') &&
          text.toUpperCase().includes('WHOIS LOOKUP');
      })()
    `, 12000);
    console.error('[audit] Backup Dump selected');

    const openedBackupWhois = await openQueuedTool('Whois Lookup');
    await waitFor('Backup WHOIS modal', `Boolean(document.body?.innerText.includes('WHOIS Lookup') && document.body?.innerText.includes('Completion Gate'))`);
    await runWhoisLookup('Backup Dump');
    const backupWhoisState = await readModalState(openedBackupWhois);
    await assertSubmittable(backupWhoisState, 'Backup WHOIS Lookup', 'Commit Segment');
    await submitStep();
    await waitFor('Backup Dump WHOIS segment committed', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('OBJECTIVES 10/14') &&
          text.includes('STEPS 31/44') &&
          text.includes('completed chain segment 1/2') &&
          text.toUpperCase().includes('DNS LOOKUP GUI');
      })()
    `, 12000);
    console.error('[audit] Backup Dump WHOIS segment committed');

    const openedBackupDns = await openQueuedTool('DNS Lookup GUI');
    await waitFor('Backup DNS modal', `Boolean(document.body?.innerText.includes('DNS Lookup Tool') && document.body?.innerText.includes('Completion Gate'))`);
    await runDnsLookupGui('Backup Dump');
    const backupDnsState = await readModalState(openedBackupDns);
    await assertSubmittable(backupDnsState, 'Backup DNS Lookup');
    await submitStep();
    await waitFor('Backup Dump step 1 completion', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('OBJECTIVES 10/14') &&
          text.includes('STEPS 32/44') &&
          text.includes('Backup Dump 1/3') &&
          text.includes('Test access policy') &&
          text.toUpperCase().includes('ACCESS ACE');
      })()
    `, 12000);
    console.error('[audit] Backup Dump step 1 completed through WHOIS + DNS GUI chain');

    const openedBackupAccess = await openQueuedTool('Access Ace');
    await waitFor('Backup Access Ace modal', `Boolean(document.body?.innerText.includes('Access Ace') && document.body?.innerText.includes('Completion Gate'))`);
    await runAccessAce('Backup Dump');
    const backupAccessState = await readModalState(openedBackupAccess);
    await assertSubmittable(backupAccessState, 'Backup Access Ace');
    await submitStep();
    await waitFor('Backup Dump step 2 completion', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('OBJECTIVES 10/14') &&
          text.includes('STEPS 33/44') &&
          text.includes('Backup Dump 2/3') &&
          text.includes('Pull backup index proof') &&
          text.toUpperCase().includes('ENCRYPTION PIPELINE');
      })()
    `, 12000);
    console.error('[audit] Backup Dump step 2 completed through Access Ace GUI');

    const openedBackupEncryption = await openQueuedTool('Encryption Pipeline');
    await waitFor('Backup Encryption modal', `Boolean(document.body?.innerText.includes('Encryption Pipeline') && document.body?.innerText.includes('Completion Gate'))`);
    await runEncryptionPipeline('Backup Dump', ['Verify the clean snapshot before touching live data', 'Correlate timestamps before taking the next action']);
    const backupEncryptionState = await readModalState(openedBackupEncryption);
    await assertSubmittable(backupEncryptionState, 'Backup Encryption Pipeline');
    await submitStep();
    await waitFor('Backup Dump objective completion', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('OBJECTIVES 11/14') &&
          text.includes('STEPS 34/44') &&
          text.includes('Backup Dump 3/3');
      })()
    `, 12000);
    console.error('[audit] Backup Dump objective completed through ordered GUI chain');

    await clickByText('Popup Consent Trap');
    await waitFor('Popup Consent Trap selected', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('Popup Consent Trap') &&
          text.includes('Profile user journey') &&
          text.toUpperCase().includes('WHOIS LOOKUP');
      })()
    `, 12000);
    console.error('[audit] Popup Consent Trap selected');

    const openedPopupWhois = await openQueuedTool('Whois Lookup');
    await waitFor('Popup WHOIS modal', `Boolean(document.body?.innerText.includes('WHOIS Lookup') && document.body?.innerText.includes('Completion Gate'))`);
    await clickModalText('Use the OSINT clue only where the active step needs it', true);
    await runWhoisLookup('Popup Consent');
    const popupWhoisState = await readModalState(openedPopupWhois);
    await assertSubmittable(popupWhoisState, 'Popup WHOIS Lookup', 'Commit Segment');
    await submitStep();
    await waitFor('Popup Consent WHOIS segment committed', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('OBJECTIVES 11/14') &&
          text.includes('STEPS 34/44') &&
          text.includes('completed chain segment 1/2') &&
          text.toUpperCase().includes('PHISHING DETECTIVE');
      })()
    `, 12000);
    console.error('[audit] Popup Consent WHOIS segment committed');

    const openedPhishingDetective = await openQueuedTool('Phishing Detective');
    await waitFor('Phishing Detective modal', `Boolean(document.body?.innerText.includes('Email 1 of 3') && document.body?.innerText.includes('Mark as Phishing'))`);
    await runPhishingDetective('Popup Consent');
    const phishingDetectiveState = await readModalState(openedPhishingDetective);
    await assertSubmittable(phishingDetectiveState, 'Phishing Detective');
    await submitStep();
    await waitFor('Popup Consent step 1 completion', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('OBJECTIVES 11/14') &&
          text.includes('STEPS 35/44') &&
          text.includes('Popup Consent Trap 1/3') &&
          text.includes('Stage fake browser prompt') &&
          text.toUpperCase().includes('PHISHING SIM GUI');
      })()
    `, 12000);
    console.error('[audit] Popup Consent step 1 completed through WHOIS + Phishing Detective GUI chain');

    const openedPopupPhish = await openQueuedTool('Phishing Sim');
    await waitFor('Popup Phishing Simulator modal', `Boolean(document.body?.innerText.includes('Phishing Simulator') && document.body?.innerText.includes('Completion Gate'))`);
    await runPhishingSimulator('Popup Consent');
    const popupPhishState = await readModalState(openedPopupPhish);
    await assertSubmittable(popupPhishState, 'Popup Phishing Sim');
    await submitStep();
    await waitFor('Popup Consent step 2 completion', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('OBJECTIVES 11/14') &&
          text.includes('STEPS 36/44') &&
          text.includes('Popup Consent Trap 2/3') &&
          text.includes('Capture consent proof') &&
          text.toUpperCase().includes('ACCESS ACE');
      })()
    `, 12000);
    console.error('[audit] Popup Consent step 2 completed through Phishing Simulator GUI');

    const openedPopupAccess = await openQueuedTool('Access Ace');
    await waitFor('Popup Access Ace modal', `Boolean(document.body?.innerText.includes('Access Ace') && document.body?.innerText.includes('Completion Gate'))`);
    await runAccessAce('Popup Consent', [
      'Correlate timestamps before taking the next action',
      'Pick the smallest scoped fix path before retrying',
      'Validate scope, expiry, and revocation path',
    ]);
    const popupAccessState = await readModalState(openedPopupAccess);
    await assertSubmittable(popupAccessState, 'Popup Access Ace');
    await submitStep();
    await waitFor('Popup Consent objective completion', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('OBJECTIVES 12/14') &&
          text.includes('STEPS 37/44') &&
          text.includes('Popup Consent Trap 3/3');
      })()
    `, 12000);
    console.error('[audit] Popup Consent Trap objective completed through ordered GUI chain');

    await clickByText('Third-Party Widget Pivot');
    await waitFor('Third-Party Widget Pivot selected', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('Third-Party Widget Pivot') &&
          text.includes('Map vendor footprint') &&
          text.toUpperCase().includes('WHOIS LOOKUP');
      })()
    `, 12000);
    console.error('[audit] Third-Party Widget Pivot selected');

    const openedWidgetWhois = await openQueuedTool('Whois Lookup');
    await waitFor('Widget WHOIS modal', `Boolean(document.body?.innerText.includes('WHOIS Lookup') && document.body?.innerText.includes('Completion Gate'))`);
    await clickModalText('Use the OSINT clue only where the active step needs it', true);
    await runWhoisLookup('Widget Pivot', 60);
    const widgetWhoisState = await readModalState(openedWidgetWhois);
    await assertSubmittable(widgetWhoisState, 'Widget WHOIS Lookup', 'Commit Segment');
    await submitStep();
    await waitFor('Widget Pivot WHOIS segment committed', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('OBJECTIVES 12/14') &&
          text.includes('STEPS 37/44') &&
          text.includes('completed chain segment 1/2') &&
          text.toUpperCase().includes('DNS LOOKUP GUI');
      })()
    `, 12000);
    console.error('[audit] Widget Pivot WHOIS segment committed');

    const openedWidgetDns = await openQueuedTool('DNS Lookup GUI');
    await waitFor('Widget DNS modal', `Boolean(document.body?.innerText.includes('DNS Lookup Tool') && document.body?.innerText.includes('Completion Gate'))`);
    await clickModalText('Use the OSINT clue only where the active step needs it', true);
    await runDnsLookupGui('Widget Pivot');
    const widgetDnsState = await readModalState(openedWidgetDns);
    await assertSubmittable(widgetDnsState, 'Widget DNS Lookup');
    await submitStep();
    await waitFor('Widget Pivot step 1 completion', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('OBJECTIVES 12/14') &&
          text.includes('STEPS 38/44') &&
          text.includes('Third-Party Widget Pivot 1/4') &&
          text.includes('Verify widget trust path') &&
          text.toUpperCase().includes('CERT VIEWER GUI');
      })()
    `, 12000);
    console.error('[audit] Widget Pivot step 1 completed through WHOIS + DNS GUI chain');

    const openedWidgetCert = await openQueuedTool('Cert Viewer');
    await waitFor('Widget Cert Viewer modal', `Boolean(document.body?.innerText.includes('Cert Viewer') && document.body?.innerText.includes('Completion Gate'))`);
    await runCertViewer('Widget Pivot', [
      'Verify issuer, host, expiry, and fingerprint',
      'Pick the smallest scoped fix path before retrying',
      'Correlate timestamps before taking the next action',
    ]);
    const widgetCertState = await readModalState(openedWidgetCert);
    await assertSubmittable(widgetCertState, 'Widget Cert Viewer');
    await submitStep();
    await waitFor('Widget Pivot step 2 completion', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('OBJECTIVES 12/14') &&
          text.includes('STEPS 39/44') &&
          text.includes('Third-Party Widget Pivot 2/4') &&
          text.includes('Stage sandboxed widget payload') &&
          text.toUpperCase().includes('XSS XPERT');
      })()
    `, 12000);
    console.error('[audit] Widget Pivot step 2 completed through Cert Viewer GUI');

    const openedXssXpert = await openQueuedTool('XSS Xpert');
    await waitFor('XSS Xpert modal', `Boolean(document.body?.innerText.includes('XSS Xpert') && document.body?.innerText.includes('Completion Gate'))`);
    await runXssXpert('Widget Pivot');
    const xssXpertState = await readModalState(openedXssXpert);
    await assertSubmittable(xssXpertState, 'XSS Xpert');
    await submitStep();
    await waitFor('Widget Pivot step 3 completion', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('OBJECTIVES 12/14') &&
          text.includes('STEPS 40/44') &&
          text.includes('Third-Party Widget Pivot 3/4') &&
          text.includes('Pull vendor-bound proof') &&
          text.toUpperCase().includes('ENCRYPTION PIPELINE');
      })()
    `, 12000);
    console.error('[audit] Widget Pivot step 3 completed through XSS Xpert GUI');

    const openedWidgetEncryption = await openQueuedTool('Encryption Pipeline');
    await waitFor('Widget Encryption modal', `Boolean(document.body?.innerText.includes('Encryption Pipeline') && document.body?.innerText.includes('Completion Gate'))`);
    await runEncryptionPipeline('Widget Pivot', [
      'Verify the clean snapshot before touching live data',
      'Correlate timestamps before taking the next action',
      'Verify issuer, host, expiry, and fingerprint',
    ], 60);
    const widgetEncryptionState = await readModalState(openedWidgetEncryption);
    await assertSubmittable(widgetEncryptionState, 'Widget Encryption Pipeline');
    await submitStep();
    await waitFor('Widget Pivot objective completion', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('OBJECTIVES 13/14') &&
          text.includes('STEPS 41/44') &&
          text.includes('Third-Party Widget Pivot 4/4');
      })()
    `, 12000);
    console.error('[audit] Third-Party Widget Pivot objective completed through ordered GUI chain');

    await clickByText('Full Attack Block');
    await waitFor('Full Attack Block selected', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('Full Attack Block') &&
          text.includes('Read incoming evidence') &&
          text.toUpperCase().includes('LOG ANALYZER');
      })()
    `, 12000);
    console.error('[audit] Full Attack Block selected');

    const openedDefenseLog = await openQueuedTool('Log Analyzer');
    await waitFor('Defense Log Analyzer modal', `Boolean(document.body?.innerText.includes('Log Analyzer') && document.body?.innerText.includes('Completion Gate'))`);
    await runLogAnalyzer('Full Attack Block', ['Use the Stealth clue only where the active step needs it']);
    const defenseLogState = await readModalState(openedDefenseLog);
    await assertSubmittable(defenseLogState, 'Defense Log Analyzer');
    await submitStep();
    await waitFor('Full Attack Block step 1 completion', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('OBJECTIVES 13/14') &&
          text.includes('STEPS 42/44') &&
          text.includes('Full Attack Block 1/3') &&
          text.includes('Apply specific control') &&
          text.toUpperCase().includes('FIREWALL DEFENDER');
      })()
    `, 12000);
    console.error('[audit] Full Attack Block step 1 completed through Log Analyzer GUI');

    const openedFirewallDefender = await openQueuedTool('Firewall Defender');
    await waitFor('Firewall Defender modal', `Boolean(document.body?.innerText.includes('Firewall Defender') && document.body?.innerText.includes('Completion Gate'))`);
    await runFirewallDefender('Full Attack Block');
    const firewallDefenderState = await readModalState(openedFirewallDefender);
    await assertSubmittable(firewallDefenderState, 'Firewall Defender');
    await submitStep();
    await waitFor('Full Attack Block step 2 completion', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('OBJECTIVES 13/14') &&
          text.includes('STEPS 43/44') &&
          text.includes('Full Attack Block 2/3') &&
          text.includes('Verify recovery') &&
          text.toUpperCase().includes('CERT CHAMPION');
      })()
    `, 12000);
    console.error('[audit] Full Attack Block step 2 completed through Firewall Defender GUI');

    const openedCertChampion = await openQueuedTool('Cert Champion');
    await waitFor('Cert Champion modal', `Boolean(document.body?.innerText.includes('Cert Champion') && document.body?.innerText.includes('Completion Gate'))`);
    await runCertChampion('Full Attack Block');
    const certChampionState = await readModalState(openedCertChampion);
    await assertSubmittable(certChampionState, 'Cert Champion');
    await submitStep();
    await waitFor('Full Attack Block objective completion', `
      (() => {
        const text = document.body.innerText.replace(/\\s+/g, ' ');
        return text.includes('OBJECTIVES 14/14') &&
          text.includes('STEPS 44/44') &&
          text.includes('Full Attack Block 3/3');
      })()
    `, 12000);
    console.error('[audit] Full Attack Block objective completed through ordered GUI chain');

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
          completedInternalService: text.includes('Internal Service Access 3/3'),
          completedServiceDisruption: text.includes('Service Disruption 3/3'),
          completedLocalPharming: text.includes('Local Pharming Redirect 3/3'),
          completedBackupDump: text.includes('Backup Dump 3/3'),
          completedPopupConsent: text.includes('Popup Consent Trap 3/3'),
          completedWidgetPivot: text.includes('Third-Party Widget Pivot 4/4'),
          completedFullAttackBlock: text.includes('Full Attack Block 3/3'),
          completedObjectives: text.includes('OBJECTIVES 14/14'),
          completedSteps: text.includes('STEPS 44/44'),
          nextStepVisible: text.includes('Attack fully blocked') || text.includes('Full Attack Block 3/3'),
          nextSegmentVisible: /CERT CHAMPION/i.test(text) || text.includes('Full Attack Block 3/3'),
          queueVisible: text.includes('Simuletool Queue')
        };
      })()
    `);
    if (!summary.feedHasChain || !summary.completedDatabaseLeak || !summary.completedAdminPanel || !summary.completedSessionHijack || !summary.completedWebMalware || !summary.completedKeyloggerTelemetry || !summary.completedCookieCapture || !summary.completedApiKeyTheft || !summary.completedInternalService || !summary.completedServiceDisruption || !summary.completedLocalPharming || !summary.completedBackupDump || !summary.completedPopupConsent || !summary.completedWidgetPivot || !summary.completedFullAttackBlock || !summary.completedObjectives || !summary.completedSteps || !summary.nextStepVisible || !summary.nextSegmentVisible || !summary.queueVisible) {
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
      openedNetworkNavigator,
      networkNavigatorState,
      openedInternalNmap,
      internalNmapState,
      openedVpnTunnel,
      vpnTunnelState,
      openedChokeTracer,
      chokeTracerState,
      openedDisruptionProxy,
      disruptionProxyState,
      openedLoadBalancer,
      loadBalancerState,
      openedPharmingTrojan,
      pharmingTrojanState,
      openedDnsResolver,
      dnsResolverState,
      openedPharmingCert,
      pharmingCertState,
      openedBackupWhois,
      backupWhoisState,
      openedBackupDns,
      backupDnsState,
      openedBackupAccess,
      backupAccessState,
      openedBackupEncryption,
      backupEncryptionState,
      openedPopupWhois,
      popupWhoisState,
      openedPhishingDetective,
      phishingDetectiveState,
      openedPopupPhish,
      popupPhishState,
      openedPopupAccess,
      popupAccessState,
      openedWidgetWhois,
      widgetWhoisState,
      openedWidgetDns,
      widgetDnsState,
      openedWidgetCert,
      widgetCertState,
      openedXssXpert,
      xssXpertState,
      openedWidgetEncryption,
      widgetEncryptionState,
      openedDefenseLog,
      defenseLogState,
      openedFirewallDefender,
      firewallDefenderState,
      openedCertChampion,
      certChampionState,
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
      const primaryModalIndex = fullText.indexOf('Completion Gate');
      const modalIndex = primaryModalIndex >= 0 ? primaryModalIndex : ([
        'Completion Gate',
        'Nmap Port Scanner',
        'DNS Lookup Tool',
        'SQL Safari',
        'SQL Injector',
        'Encryption Pipeline',
        'WHOIS Lookup',
        'Hash Cracker',
        'SSL Handshake',
        'Packet Sniffer',
        'Cert Viewer',
        'Keylogger Sim',
        'Proxy Server Simulator',
        'XSS Tester',
        'Phishing Simulator',
        'Log Analyzer',
        'XOR Tool',
        'Trojan Builder',
        'Network Navigator',
        'VPN Tunnel',
        'Load Balancer',
        'DNS Resolver',
        'Access Ace',
        'Phishing Detective',
        'XSS Xpert',
        'Firewall Defender',
        'Cert Champion',
      ].map((marker) => fullText.indexOf(marker)).filter((index) => index >= 0).sort((a, b) => a - b)[0] ?? -1);
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
