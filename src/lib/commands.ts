import type { FileSystemState, FileNode } from './filesystem';
import {
  getNodeAtPath,
  getParentAndName,
  resolvePath,
} from './filesystem';

export interface CommandOutput {
  text: string;
  type: 'output' | 'error' | 'success' | 'warning' | 'info' | 'ascii';
}

export interface CommandResult {
  outputs: CommandOutput[];
  newState?: Partial<FileSystemState>;
  clear?: boolean;
  exit?: boolean;
}

export interface CommandContext {
  fs: FileSystemState;
  username: string;
  hostname: string;
  history: string[];
  missionsCompleted: number[];
  commandsUsed: string[];
}

const CYBER_TIPS: Record<string, string> = {
  nmap: 'Did you know? Nmap is used by security professionals to find open ports on networks.',
  ping: 'Ping sends small packets to test if a computer is reachable on the network.',
  ssh: 'SSH creates a secure encrypted connection to remote computers.',
  sudo: 'Sudo gives you admin powers! Use it carefully - with great power comes great responsibility.',
  chmod: 'File permissions protect who can read, write, or execute files.',
  traceroute: 'Traceroute shows the path your packets take across the internet!',
  netstat: 'Netstat shows all network connections on your computer.',
  wget: 'wget is a tool to download files from the internet using the command line.',
  curl: 'curl is a powerful tool for making HTTP requests and testing APIs.',
  grep: 'grep is one of the most powerful tools for searching through text!',
};

const FORTUNES = [
  'A strong password is like a good lock on your digital door.',
  'Always log out of shared computers - it only takes 2 seconds!',
  'Software updates often fix security holes. Stay updated!',
  'If an email seems too urgent, it might be a phishing attempt.',
  'Two-factor authentication adds an extra layer of protection.',
  'Backing up your files regularly can save you from ransomware.',
  'Public Wi-Fi can be dangerous. Use a VPN when possible!',
  'Never click on links from unknown senders.',
  'Your personal information is valuable - protect it like treasure!',
  'Social engineering is when hackers manipulate people instead of computers.',
  'A firewall is like a security guard for your network.',
  'Encryption turns your messages into secret code that only the right person can read.',
  'The best hackers use their powers for GOOD - they are called ethical hackers!',
  'Always check the URL before entering your password on a website.',
  'Keep your antivirus software running and updated!',
];

const COW_ART = `
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||
`;

function bannerText(text: string): string {
  const line = '#'.repeat(text.length + 8);
  return `${line}\n#   ${text}   #\n${line}`;
}

function renderCalendar(): string {
  const now = new Date();
  const month = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  let result = `     ${month}\n${days.join(' ')}\n`;
  let line = '   '.repeat(firstDay);
  let dayOfWeek = firstDay;
  for (let d = 1; d <= daysInMonth; d++) {
    line += String(d).padStart(2, ' ') + ' ';
    dayOfWeek++;
    if (dayOfWeek > 6) {
      result += line.trimEnd() + '\n';
      line = '';
      dayOfWeek = 0;
    }
  }
  if (line.trim()) result += line.trimEnd();
  return result;
}

function treeDir(node: FileNode, prefix = ''): string[] {
  if (node.type !== 'directory' || !node.children) return [];
  const entries = Array.from(node.children.values());
  const lines: string[] = [];
  entries.forEach((child, i) => {
    const isLast = i === entries.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    lines.push(prefix + connector + child.name);
    if (child.type === 'directory' && child.children) {
      const ext = isLast ? '    ' : '│   ';
      lines.push(...treeDir(child, prefix + ext));
    }
  });
  return lines;
}

function formatPermissions(node: FileNode): string {
  const type = node.type === 'directory' ? 'd' : '-';
  const perms = node.permissions;
  return type + perms;
}

function formatLsLine(node: FileNode): string {
  const perms = formatPermissions(node);
  const size = String(node.size).padStart(8);
  const date = node.modified.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${perms} 1 ${node.owner.padEnd(6)} ${node.group.padEnd(6)} ${size} ${date} ${node.name}`;
}

function colorizeLs(node: FileNode): string {
  if (node.type === 'directory') return `<DIR> ${node.name}/`;
  if (node.permissions.includes('x')) return `<EXE> ${node.name}*`;
  if (node.name.startsWith('.')) return `<HID> ${node.name}`;
  return `      ${node.name}`;
}

function hasEducationalTip(cmd: string): boolean {
  return cmd in CYBER_TIPS;
}

export function executeCommand(
  input: string,
  ctx: CommandContext
): CommandResult {
  const trimmed = input.trim();
  if (!trimmed) return { outputs: [] };

  const parts = trimmed.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);

  const outputs: CommandOutput[] = [];

  // Add educational tip for security commands
  if (hasEducationalTip(cmd)) {
    outputs.push({
      text: `\nCyber Tip: ${CYBER_TIPS[cmd]}`,
      type: 'info',
    });
    if (cmd === 'nmap') {
      outputs.push({
        text: 'Always make sure you have permission before scanning a network!\n',
        type: 'warning',
      });
    }
  }

  // Execute the command
  const result = runCommand(cmd, args, ctx);
  outputs.push(...result.outputs);

  return {
    ...result,
    outputs,
  };
}

function runCommand(
  cmd: string,
  args: string[],
  ctx: CommandContext
): CommandResult {
  const { fs } = ctx;

  switch (cmd) {
    case 'help':
      return cmdHelp();
    case 'ls':
      return cmdLs(args, fs);
    case 'cd':
      return cmdCd(args, fs);
    case 'pwd':
      return cmdPwd(fs);
    case 'mkdir':
      return cmdMkdir(args, fs);
    case 'touch':
      return cmdTouch(args, fs);
    case 'cat':
      return cmdCat(args, fs);
    case 'echo':
      return cmdEcho(args);
    case 'clear':
      return { outputs: [], clear: true };
    case 'whoami':
      return { outputs: [{ text: ctx.username, type: 'output' }] };
    case 'date':
      return { outputs: [{ text: new Date().toString(), type: 'output' }] };
    case 'cal':
      return { outputs: [{ text: renderCalendar(), type: 'output' }] };
    case 'tree':
      return cmdTree(fs);
    case 'rm':
      return cmdRm(args, fs);
    case 'rmdir':
      return cmdRmdir(args, fs);
    case 'cp':
      return cmdCp(args, fs);
    case 'mv':
      return cmdMv(args, fs);
    case 'head':
      return cmdHead(args, fs);
    case 'tail':
      return cmdTail(args, fs);
    case 'grep':
      return cmdGrep(args, fs);
    case 'chmod':
      return cmdChmod(args, fs);
    case 'ps':
      return cmdPs();
    case 'top':
      return cmdTop();
    case 'ifconfig':
    case 'ip':
      if (args[0] === 'a') return cmdIfconfig();
      if (cmd === 'ip') return { outputs: [{ text: 'Usage: ip a', type: 'error' }] };
      return cmdIfconfig();
    case 'ping':
      return cmdPing(args);
    case 'traceroute':
      return cmdTraceroute(args);
    case 'nmap':
      return cmdNmap(args);
    case 'netstat':
      return cmdNetstat();
    case 'wget':
      return cmdWget(args);
    case 'curl':
      return cmdCurl(args);
    case 'ssh':
      return cmdSsh(args);
    case 'sudo':
      return cmdSudo(args, ctx);
    case 'history':
      return cmdHistory(ctx);
    case 'exit':
      return { outputs: [{ text: 'Goodbye, agent! See you next time!', type: 'success' }], exit: true };
    case 'banner':
      return cmdBanner(args);
    case 'fortune':
      return cmdFortune();
    case 'cowsay':
      return cmdCowsay(args);
    case 'matrix':
      return cmdMatrix();
    case 'missions':
      return cmdMissions(ctx);
    case 'start':
      return cmdStartMission(args, ctx);
    default:
      return {
        outputs: [
          {
            text: `Command not found: ${cmd}\nType "help" to see available commands.`,
            type: 'error',
          },
        ],
      };
  }
}

// ── Individual command implementations ──────────────────────────────────────

function cmdHelp(): CommandResult {
  return {
    outputs: [
      {
        text: `
╔══════════════════════════════════════════════════════════════════╗
║              CyberPaw Terminal - Command Reference               ║
╠══════════════════════════════════════════════════════════════════╣
║  NAVIGATION                                                      ║
║    ls [-la]          List files in current directory             ║
║    cd <dir>          Change directory                            ║
║    pwd               Print working directory                     ║
║    tree              Show directory tree structure               ║
║                                                                  ║
║  FILE OPERATIONS                                                 ║
║    cat <file>        Display file contents                       ║
║    touch <file>      Create empty file                           ║
║    mkdir <name>      Create directory                            ║
║    rm <file>         Remove file                                 ║
║    rmdir <dir>       Remove empty directory                      ║
║    cp <src> <dst>    Copy file                                   ║
║    mv <src> <dst>    Move or rename file                         ║
║    head <file>       Show first 10 lines                         ║
║    tail <file>       Show last 10 lines                          ║
║    grep <p> <file>   Search for pattern in file                  ║
║    chmod <mode> <f>  Change file permissions                     ║
║                                                                  ║
║  SYSTEM                                                          ║
║    echo <text>       Print text                                  ║
║    clear             Clear terminal screen                       ║
║    whoami            Show current user                           ║
║    date              Show current date/time                      ║
║    cal               Show calendar                               ║
║    ps                List running processes                      ║
║    top               Show system resources                       ║
║                                                                  ║
║  NETWORK (educational simulations)                               ║
║    ifconfig / ip a   Show network interfaces                     ║
║    ping <host>       Test network connectivity                   ║
║    traceroute <host> Trace network route                         ║
║    nmap <target>     Port scanner (educational)                  ║
║    netstat           Show network connections                    ║
║    wget <url>        Download file (simulated)                   ║
║    curl <url>        HTTP request (simulated)                    ║
║    ssh <user>@<host> SSH connection (simulated)                  ║
║    sudo <cmd>        Run command as admin                        ║
║                                                                  ║
║  FUN & EXTRA                                                     ║
║    banner <text>     ASCII art banner                            ║
║    cowsay <text>     Cow says your message                       ║
║    fortune           Random cybersecurity tip                    ║
║    matrix            Matrix rain effect (in terminal!)           ║
║    history           Show command history                        ║
║    exit              Close terminal session                      ║
║                                                                  ║
║  MISSIONS                                                        ║
║    missions          List available missions                     ║
║    start <number>    Start a mission                             ║
╚══════════════════════════════════════════════════════════════════╝`,
        type: 'output',
      },
    ],
  };
}

function cmdLs(args: string[], fs: FileSystemState): CommandResult {
  const showAll = args.includes('-la') || args.includes('-al') || args.includes('-a');
  const showLong = args.includes('-la') || args.includes('-al') || args.includes('-l');
  const node = fs.currentNode;

  if (node.type !== 'directory' || !node.children) {
    return { outputs: [{ text: 'Not a directory', type: 'error' }] };
  }

  const entries = Array.from(node.children.values());
  const visible = showAll ? entries : entries.filter((e) => !e.name.startsWith('.'));

  if (visible.length === 0) {
    return { outputs: [{ text: 'total 0', type: 'output' }] };
  }

  const lines: string[] = [];
  if (showLong) {
    lines.push(`total ${visible.length}`);
    for (const e of visible) {
      lines.push(formatLsLine(e));
    }
  } else {
    for (const e of visible) {
      lines.push(colorizeLs(e));
    }
  }

  return { outputs: [{ text: lines.join('\n'), type: 'output' }] };
}

function cmdCd(args: string[], fs: FileSystemState): CommandResult {
  if (args.length === 0) {
    const homeNode = getNodeAtPath(fs.root, '/home/user');
    if (homeNode) {
      return {
        outputs: [],
        newState: { currentDir: '/home/user', currentNode: homeNode },
      };
    }
    return { outputs: [{ text: 'Could not find home directory', type: 'error' }] };
  }

  const target = resolvePath(fs.currentDir, args[0]);
  const node = getNodeAtPath(fs.root, target);

  if (!node) {
    return { outputs: [{ text: `cd: ${args[0]}: No such file or directory`, type: 'error' }] };
  }
  if (node.type !== 'directory') {
    return { outputs: [{ text: `cd: ${args[0]}: Not a directory`, type: 'error' }] };
  }

  return {
    outputs: [],
    newState: { currentDir: target, currentNode: node },
  };
}

function cmdPwd(fs: FileSystemState): CommandResult {
  return { outputs: [{ text: fs.currentDir, type: 'output' }] };
}

function cmdMkdir(args: string[], fs: FileSystemState): CommandResult {
  if (args.length === 0) {
    return { outputs: [{ text: 'mkdir: missing operand', type: 'error' }] };
  }

  for (const name of args) {
    if (name.startsWith('-')) continue;
    if (fs.currentNode.children?.has(name)) {
      return { outputs: [{ text: `mkdir: cannot create directory '${name}': File exists`, type: 'error' }] };
    }
    const newDir: FileNode = {
      name,
      type: 'directory',
      permissions: 'rwxr-xr-x',
      owner: 'user',
      group: 'user',
      size: 4096,
      modified: new Date(),
      children: new Map(),
    };
    fs.currentNode.children!.set(name, newDir);
  }

  return {
    outputs: [{ text: `Directory created: ${args.filter((a) => !a.startsWith('-')).join(', ')}`, type: 'success' }],
  };
}

function cmdTouch(args: string[], fs: FileSystemState): CommandResult {
  if (args.length === 0) {
    return { outputs: [{ text: 'touch: missing file operand', type: 'error' }] };
  }

  for (const name of args) {
    if (name.startsWith('-')) continue;
    const existing = fs.currentNode.children?.get(name);
    if (existing) {
      existing.modified = new Date();
    } else {
      const newFile = createFileNode(name, '');
      fs.currentNode.children!.set(name, newFile);
    }
  }

  return {
    outputs: [{ text: `File created: ${args.filter((a) => !a.startsWith('-')).join(', ')}`, type: 'success' }],
  };
}

function createFileNode(name: string, content: string): FileNode {
  return {
    name,
    type: 'file',
    content,
    permissions: 'rw-r--r--',
    owner: 'user',
    group: 'user',
    size: content.length,
    modified: new Date(),
  };
}

function cmdCat(args: string[], fs: FileSystemState): CommandResult {
  if (args.length === 0) {
    return { outputs: [{ text: 'cat: missing file operand', type: 'error' }] };
  }

  const lines: string[] = [];
  for (const arg of args) {
    if (arg.startsWith('-')) continue;
    const path = resolvePath(fs.currentDir, arg);
    const node = getNodeAtPath(fs.root, path);
    if (!node) {
      return { outputs: [{ text: `cat: ${arg}: No such file or directory`, type: 'error' }] };
    }
    if (node.type === 'directory') {
      return { outputs: [{ text: `cat: ${arg}: Is a directory`, type: 'error' }] };
    }
    lines.push(node.content || '');
  }

  return { outputs: [{ text: lines.join('\n'), type: 'output' }] };
}

function cmdEcho(args: string[]): CommandResult {
  const text = args.join(' ');
  // Handle redirection with >
  const redirectIdx = args.indexOf('>');
  if (redirectIdx !== -1) {
    const before = args.slice(0, redirectIdx).join(' ');
    const after = args.slice(redirectIdx + 1).join(' ');
    return {
      outputs: [
        { text: `Redirecting output to file: ${after}`, type: 'info' },
        { text: before, type: 'output' },
      ],
    };
  }
  return { outputs: [{ text: text, type: 'output' }] };
}

function cmdTree(fs: FileSystemState): CommandResult {
  const node = fs.currentNode;
  if (node.type !== 'directory') {
    return { outputs: [{ text: 'Not a directory', type: 'error' }] };
  }

  const lines: string[] = [fs.currentDir];
  lines.push(...treeDir(node));
  return { outputs: [{ text: lines.join('\n'), type: 'output' }] };
}

function cmdRm(args: string[], fs: FileSystemState): CommandResult {
  if (args.length === 0) {
    return { outputs: [{ text: 'rm: missing operand', type: 'error' }] };
  }

  const recursive = args.includes('-r') || args.includes('-rf');
  const targets = args.filter((a) => !a.startsWith('-'));

  for (const target of targets) {
    const path = resolvePath(fs.currentDir, target);
    const pn = getParentAndName(fs.root, path);
    if (!pn) {
      return { outputs: [{ text: `rm: cannot remove '${target}': No such file or directory`, type: 'error' }] };
    }
    const { parent, name } = pn;
    const node = parent.children?.get(name);
    if (!node) {
      return { outputs: [{ text: `rm: cannot remove '${target}': No such file or directory`, type: 'error' }] };
    }
    if (node.type === 'directory' && !recursive) {
      return { outputs: [{ text: `rm: cannot remove '${target}': Is a directory`, type: 'error' }] };
    }
    parent.children!.delete(name);
  }

  return { outputs: [{ text: `Removed: ${targets.join(', ')}`, type: 'success' }] };
}

function cmdRmdir(args: string[], fs: FileSystemState): CommandResult {
  if (args.length === 0) {
    return { outputs: [{ text: 'rmdir: missing operand', type: 'error' }] };
  }

  for (const target of args) {
    const path = resolvePath(fs.currentDir, target);
    const pn = getParentAndName(fs.root, path);
    if (!pn) {
      return { outputs: [{ text: `rmdir: failed to remove '${target}': No such file or directory`, type: 'error' }] };
    }
    const { parent, name } = pn;
    const node = parent.children?.get(name);
    if (!node || node.type !== 'directory') {
      return { outputs: [{ text: `rmdir: failed to remove '${target}': Not a directory`, type: 'error' }] };
    }
    if (node.children && node.children.size > 0) {
      return { outputs: [{ text: `rmdir: failed to remove '${target}': Directory not empty`, type: 'error' }] };
    }
    parent.children!.delete(name);
  }

  return { outputs: [{ text: `Directory removed: ${args.join(', ')}`, type: 'success' }] };
}

function cmdCp(args: string[], fs: FileSystemState): CommandResult {
  if (args.length < 2) {
    return { outputs: [{ text: 'cp: missing file operand', type: 'error' }] };
  }
  const src = args[0];
  const dst = args[1];

  const srcPath = resolvePath(fs.currentDir, src);
  const srcNode = getNodeAtPath(fs.root, srcPath);
  if (!srcNode) {
    return { outputs: [{ text: `cp: cannot stat '${src}': No such file or directory`, type: 'error' }] };
  }
  if (srcNode.type === 'directory') {
    return { outputs: [{ text: `cp: -r not specified; omitting directory '${src}'`, type: 'error' }] };
  }

  const dstPath = resolvePath(fs.currentDir, dst);
  const dstParent = dstPath.includes('/')
    ? getNodeAtPath(fs.root, dstPath.slice(0, dstPath.lastIndexOf('/')) || '/')
    : fs.currentNode;
  const dstName = dst.includes('/') ? dst.slice(dst.lastIndexOf('/') + 1) : dst;

  if (dstParent && dstParent.type === 'directory') {
    const newFile: FileNode = {
      ...srcNode,
      name: dstName,
      modified: new Date(),
    };
    dstParent.children!.set(dstName, newFile);
    return { outputs: [{ text: `Copied '${src}' to '${dst}'`, type: 'success' }] };
  }

  return { outputs: [{ text: `cp: cannot create regular file '${dst}': No such file or directory`, type: 'error' }] };
}

function cmdMv(args: string[], fs: FileSystemState): CommandResult {
  if (args.length < 2) {
    return { outputs: [{ text: 'mv: missing file operand', type: 'error' }] };
  }
  const src = args[0];
  const dst = args[1];

  const srcPath = resolvePath(fs.currentDir, src);
  const pn = getParentAndName(fs.root, srcPath);
  if (!pn) {
    return { outputs: [{ text: `mv: cannot stat '${src}': No such file or directory`, type: 'error' }] };
  }

  const { parent: srcParent, name: srcName } = pn;
  const node = srcParent.children?.get(srcName);
  if (!node) {
    return { outputs: [{ text: `mv: cannot stat '${src}': No such file or directory`, type: 'error' }] };
  }

  const dstPath = resolvePath(fs.currentDir, dst);
  let dstParent: FileNode;
  let dstName: string;

  if (dst.endsWith('/')) {
    const dp = getNodeAtPath(fs.root, dstPath);
    if (dp && dp.type === 'directory') {
      dstParent = dp;
      dstName = srcName;
    } else {
      return { outputs: [{ text: `mv: target '${dst}' is not a directory`, type: 'error' }] };
    }
  } else {
    dstParent = getNodeAtPath(fs.root, dstPath.slice(0, dstPath.lastIndexOf('/')) || '/') || fs.root;
    dstName = dst.includes('/') ? dst.slice(dst.lastIndexOf('/') + 1) : dst;
  }

  if (dstParent.type !== 'directory') {
    return { outputs: [{ text: `mv: target '${dst}' is not a directory`, type: 'error' }] };
  }

  dstParent.children!.set(dstName, { ...node, name: dstName });
  srcParent.children!.delete(srcName);

  return { outputs: [{ text: `Moved '${src}' to '${dst}'`, type: 'success' }] };
}

function cmdHead(args: string[], fs: FileSystemState): CommandResult {
  if (args.length === 0) {
    return { outputs: [{ text: 'head: missing file operand', type: 'error' }] };
  }
  const path = resolvePath(fs.currentDir, args[0]);
  const node = getNodeAtPath(fs.root, path);
  if (!node || node.type !== 'file') {
    return { outputs: [{ text: `head: cannot open '${args[0]}' for reading: No such file or directory`, type: 'error' }] };
  }
  const lines = (node.content || '').split('\n').slice(0, 10).join('\n');
  return { outputs: [{ text: lines, type: 'output' }] };
}

function cmdTail(args: string[], fs: FileSystemState): CommandResult {
  if (args.length === 0) {
    return { outputs: [{ text: 'tail: missing file operand', type: 'error' }] };
  }
  const path = resolvePath(fs.currentDir, args[0]);
  const node = getNodeAtPath(fs.root, path);
  if (!node || node.type !== 'file') {
    return { outputs: [{ text: `tail: cannot open '${args[0]}' for reading: No such file or directory`, type: 'error' }] };
  }
  const lines = (node.content || '').split('\n').slice(-10).join('\n');
  return { outputs: [{ text: lines, type: 'output' }] };
}

function cmdGrep(args: string[], fs: FileSystemState): CommandResult {
  if (args.length < 2) {
    return { outputs: [{ text: 'Usage: grep <pattern> <file>', type: 'error' }] };
  }
  const pattern = args[0];
  const filename = args[1];
  const path = resolvePath(fs.currentDir, filename);
  const node = getNodeAtPath(fs.root, path);
  if (!node || node.type !== 'file') {
    return { outputs: [{ text: `grep: ${filename}: No such file or directory`, type: 'error' }] };
  }
  const lines = (node.content || '').split('\n');
  const matches = lines.filter((l) => l.toLowerCase().includes(pattern.toLowerCase()));
  if (matches.length === 0) {
    return { outputs: [{ text: `(no matches for "${pattern}")`, type: 'output' }] };
  }
  return { outputs: [{ text: matches.join('\n'), type: 'output' }] };
}

function cmdChmod(args: string[], fs: FileSystemState): CommandResult {
  if (args.length < 2) {
    return { outputs: [{ text: 'chmod: missing operand', type: 'error' }] };
  }
  const mode = args[0];
  const target = args[1];
  const path = resolvePath(fs.currentDir, target);
  const node = getNodeAtPath(fs.root, path);
  if (!node) {
    return { outputs: [{ text: `chmod: cannot access '${target}': No such file or directory`, type: 'error' }] };
  }

  let newPerms = node.permissions;
  if (/^\d{3}$/.test(mode)) {
    const digitToRwx = (d: number): string => {
      let r = '';
      r += d & 4 ? 'r' : '-';
      r += d & 2 ? 'w' : '-';
      r += d & 1 ? 'x' : '-';
      return r;
    };
    const owner = parseInt(mode[0]);
    const group = parseInt(mode[1]);
    const other = parseInt(mode[2]);
    newPerms = digitToRwx(owner) + digitToRwx(group) + digitToRwx(other);
  }

  node.permissions = newPerms;
  return { outputs: [{ text: `Permissions changed: ${target} -> ${newPerms}`, type: 'success' }] };
}

function cmdPs(): CommandResult {
  const lines = [
    '  PID TTY          TIME CMD',
    '    1 ?        00:00:01 systemd',
    '  234 ?        00:00:02 sshd',
    '  512 pts/0    00:00:00 bash',
    '  768 pts/0    00:00:03 python3 scan_network.py',
    ' 1024 pts/0    00:00:00 ps',
    ' 2047 ?        00:00:05 firewall_daemon',
  ];
  return { outputs: [{ text: lines.join('\n'), type: 'output' }] };
}

function cmdTop(): CommandResult {
  const lines = [
    'top - CyberPaw System Monitor',
    'Tasks: 6 total, 1 running, 5 sleeping',
    'CPU: 12.5% us, 3.2% sy, 0.0% ni, 84.3% id',
    'Mem: 2048M total, 1024M used, 1024M free',
    '',
    '  PID USER   PR  NI  VIRT  RES  SHR S %CPU %MEM    TIME+  COMMAND',
    ' 2047 root   20   0  256m  64m  32m S  5.0  3.1  0:05.23 firewall_daemon',
    '  768 user   20   0  128m  32m  16m S  3.2  1.5  0:03.45 python3',
    '    1 root   20   0   16m   8m   4m S  0.0  0.4  0:00.01 systemd',
    '  234 root   20   0   32m  12m   8m S  0.0  0.6  0:00.02 sshd',
    '  512 user   20   0   24m  10m   6m S  0.0  0.5  0:00.00 bash',
    ' 1024 user   20   0   16m   6m   4m R  0.0  0.3  0:00.00 top',
  ];
  return { outputs: [{ text: lines.join('\n'), type: 'output' }] };
}

function cmdIfconfig(): CommandResult {
  return {
    outputs: [
      {
        text: `eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 192.168.1.50  netmask 255.255.255.0  broadcast 192.168.1.255
        inet6 fe80::42:a00ff:fe00:6501  prefixlen 64  scopeid 0x20<link>
        ether 02:42:0a:00:00:50  txqueuelen 0  (Ethernet)
        RX packets 123456  bytes 123456789 (117.7 MiB)
        TX packets 654321  bytes 987654321 (941.7 MiB)

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        loop  txqueuelen 1000  (Local Loopback)
        RX packets 9999  bytes 999999 (976.5 KiB)
        TX packets 9999  bytes 999999 (976.5 KiB)

wlan0: flags=4099<UP,BROADCAST,MULTICAST>  mtu 1500
        inet 10.0.0.15  netmask 255.255.255.0  broadcast 10.0.0.255
        ether ac:de:48:00:11:22  txqueuelen 1000  (Wireless)`,
        type: 'output',
      },
    ],
  };
}

function cmdPing(args: string[]): CommandResult {
  const host = args[0] || 'localhost';
  const lines: string[] = [`PING ${host} (127.0.0.1) 56(84) bytes of data.`];
  for (let i = 1; i <= 4; i++) {
    const ms = (Math.random() * 20 + 5).toFixed(2);
    lines.push(`64 bytes from 127.0.0.1: icmp_seq=${i} ttl=64 time=${ms} ms`);
  }
  lines.push(`\n--- ${host} ping statistics ---`);
  lines.push('4 packets transmitted, 4 received, 0% packet loss, time 3004ms');
  return { outputs: [{ text: lines.join('\n'), type: 'output' }] };
}

function cmdTraceroute(args: string[]): CommandResult {
  const host = args[0] || 'cyberpaw.edu';
  const hops = [
    ['1', '192.168.1.1', '2.1', 'Router (Home)'],
    ['2', '10.0.0.1', '5.3', 'ISP Gateway'],
    ['3', '172.16.0.5', '8.7', 'Regional Hub'],
    ['4', '203.0.113.1', '15.2', ' Backbone Router #42'],
    ['5', '198.51.100.10', '22.8', 'CyberPaw Data Center'],
    ['6', ' cyberpaw.edu', '25.1', 'Destination Reached!'],
  ];
  const lines = [`traceroute to ${host} (198.51.100.10), 30 hops max`];
  for (const [hop, ip, ms, name] of hops) {
    lines.push(` ${hop.padStart(2)}  ${ip.padEnd(18)} ${ms.padStart(5)} ms  ${name}`);
  }
  return { outputs: [{ text: lines.join('\n'), type: 'output' }] };
}

function cmdNmap(args: string[]): CommandResult {
  const target = args[0] || '127.0.0.1';
  const lines = [
    `Starting CyberPaw Nmap scan at ${new Date().toLocaleString()}`,
    `Nmap scan report for ${target}`,
    `Host is up (0.0032s latency).`,
    `Not shown: 995 closed ports`,
    `PORT     STATE    SERVICE`,
    `22/tcp   open     ssh       - Secure Shell for remote access`,
    `80/tcp   open     http      - Web server`,
    `443/tcp  open     https     - Secure web server`,
    `3306/tcp filtered mysql     - Database (protected by firewall)`,
    `8080/tcp open     http-proxy - Development server`,
    ``,
    `Nmap done: 1 IP address (1 host up) scanned in 2.34 seconds`,
  ];
  return { outputs: [{ text: lines.join('\n'), type: 'output' }] };
}

function cmdNetstat(): CommandResult {
  const lines = [
    'Active Internet connections (servers and established)',
    'Proto Recv-Q Send-Q Local Address           Foreign Address         State',
    'tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN',
    'tcp        0      0 127.0.0.1:8080          0.0.0.0:*               LISTEN',
    'tcp        0      0 192.168.1.50:443        203.0.113.45:51234      ESTABLISHED',
    'tcp        0      0 192.168.1.50:22         10.0.0.15:49152         ESTABLISHED',
    'tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN',
  ];
  return { outputs: [{ text: lines.join('\n'), type: 'output' }] };
}

function cmdWget(args: string[]): CommandResult {
  const url = args[0] || 'https://example.com/file.txt';
  return {
    outputs: [
      { text: `--${new Date().toLocaleString()}--  ${url}`, type: 'output' },
      { text: `Resolving ${url}... 93.184.216.34`, type: 'output' },
      { text: `Connecting to ${url}|93.184.216.34|:443... connected.`, type: 'output' },
      { text: 'HTTP request sent, awaiting response... 200 OK', type: 'output' },
      { text: 'Length: 1234 (1.2K) [text/plain]', type: 'output' },
      { text: 'Saving to: file.txt', type: 'output' },
      { text: 'file.txt    100%[===================>]   1.20K  --.-KB/s    in 0.001s', type: 'output' },
      { text: `Downloaded: ${url} -> file.txt (1.2 KB)`, type: 'success' },
    ],
  };
}

function cmdCurl(args: string[]): CommandResult {
  const url = args[0] || 'https://api.cyberpaw.edu/status';
  return {
    outputs: [
      { text: `$ curl -v ${url}`, type: 'output' },
      { text: `> GET /status HTTP/1.1`, type: 'output' },
      { text: `> Host: ${url.replace(/^https?:\/\//, '')}`, type: 'output' },
      { text: `> User-Agent: CyberPaw-Terminal/1.0`, type: 'output' },
      { text: `> Accept: */*`, type: 'output' },
      { text: `>`, type: 'output' },
      { text: `< HTTP/1.1 200 OK`, type: 'output' },
      { text: `< Content-Type: application/json`, type: 'output' },
      { text: `<`, type: 'output' },
      { text: `{ "status": "online", "message": "CyberPaw Academy server is running!" }`, type: 'output' },
    ],
  };
}

function cmdSsh(args: string[]): CommandResult {
  if (args.length === 0) {
    return { outputs: [{ text: 'Usage: ssh <user>@<hostname>', type: 'error' }] };
  }
  const conn = args[0];
  return {
    outputs: [
      { text: `$ ssh ${conn}`, type: 'output' },
      { text: `The authenticity of host '${conn}' can't be established.`, type: 'warning' },
      { text: `ED25519 key fingerprint is SHA256:CyberPawFakeKey123.`, type: 'output' },
      { text: `Are you sure you want to continue connecting? (yes/no) -> auto-accepted for demo`, type: 'output' },
      { text: `Warning: Permanently added '${conn}' to the list of known hosts.`, type: 'warning' },
      { text: `\nWelcome to CyberPaw Remote Server!`, type: 'success' },
      { text: `You are now connected to ${conn}`, type: 'success' },
      { text: `(Simulation mode - no real connection established)`, type: 'info' },
    ],
  };
}

function cmdSudo(args: string[], ctx: CommandContext): CommandResult {
  if (args.length === 0) {
    return { outputs: [{ text: 'sudo: no command specified', type: 'error' }] };
  }
  const subCmd = args[0];
  const subArgs = args.slice(1);

  // Run the subcommand with admin context
  const adminCtx: CommandContext = { ...ctx, username: 'root' };
  const result = runCommand(subCmd, subArgs, adminCtx);

  return {
    ...result,
    outputs: [
      { text: '[sudo] Running as admin...', type: 'info' },
      ...result.outputs,
    ],
  };
}

function cmdHistory(ctx: CommandContext): CommandResult {
  const lines = ctx.history.map((cmd, i) => `${String(i + 1).padStart(4)}  ${cmd}`);
  return { outputs: [{ text: lines.join('\n'), type: 'output' }] };
}

function cmdBanner(args: string[]): CommandResult {
  const text = args.join(' ') || 'CyberPaw!';
  return { outputs: [{ text: bannerText(text), type: 'ascii' }] };
}

function cmdFortune(): CommandResult {
  const tip = FORTUNES[Math.floor(Math.random() * FORTUNES.length)];
  return { outputs: [{ text: `Cyber Fortune:\n  "${tip}"`, type: 'output' }] };
}

function cmdCowsay(args: string[]): CommandResult {
  const text = args.join(' ') || 'Moo! I mean... Meow!';
  const line = '_'.repeat(Math.min(text.length + 2, 40));
  const bubble = `< ${text} >`;
  const result = ` ${line}\n${bubble}\n ${line}${COW_ART}`;
  return { outputs: [{ text: result, type: 'ascii' }] };
}

function cmdMatrix(): CommandResult {
  const chars = '0123456789ABCDEF@#$%&*';
  const lines: string[] = ['Matrix Rain Effect - Type "clear" to exit'];
  for (let r = 0; r < 12; r++) {
    let line = '';
    for (let c = 0; c < 40; c++) {
      line += Math.random() > 0.3 ? chars[Math.floor(Math.random() * chars.length)] : ' ';
    }
    lines.push(line);
  }
  return { outputs: [{ text: lines.join('\n'), type: 'ascii' }] };
}

function cmdMissions(ctx: CommandContext): CommandResult {
  const missionList = [
    { id: 1, name: 'First Steps', status: ctx.missionsCompleted.includes(1) ? 'Complete' : 'Available', cmds: 'ls, cd, pwd' },
    { id: 2, name: 'File Detective', status: ctx.missionsCompleted.includes(2) ? 'Complete' : 'Available', cmds: 'cat, touch, mkdir' },
    { id: 3, name: 'Secret Message', status: ctx.missionsCompleted.includes(3) ? 'Complete' : 'Available', cmds: 'cat, grep' },
    { id: 4, name: 'Password Check', status: ctx.missionsCompleted.includes(4) ? 'Complete' : 'Available', cmds: 'cat, grep' },
    { id: 5, name: 'Network Scan', status: ctx.missionsCompleted.includes(5) ? 'Complete' : 'Available', cmds: 'nmap, ping, ifconfig' },
    { id: 6, name: 'Firewall Setup', status: ctx.missionsCompleted.includes(6) ? 'Complete' : 'Available', cmds: 'cat, chmod' },
    { id: 7, name: 'Log Analysis', status: ctx.missionsCompleted.includes(7) ? 'Complete' : 'Available', cmds: 'cat, head, tail, grep' },
    { id: 8, name: 'File Recovery', status: ctx.missionsCompleted.includes(8) ? 'Complete' : 'Available', cmds: 'cp, mv, rm' },
    { id: 9, name: 'Encryption Master', status: ctx.missionsCompleted.includes(9) ? 'Complete' : 'Available', cmds: 'cat, chmod' },
    { id: 10, name: 'Cyber Defender', status: ctx.missionsCompleted.includes(10) ? 'Complete' : 'Available', cmds: 'All commands' },
  ];

  const lines = ['Available Missions:', ''];
  for (const m of missionList) {
    const icon = m.status === 'Complete' ? '[+]' : '[ ]';
    lines.push(`  ${icon} Mission ${m.id}: ${m.name} (${m.status})`);
    lines.push(`      Commands: ${m.cmds}`);
  }
  lines.push('');
  lines.push('Type "start <number>" to begin a mission!');

  return { outputs: [{ text: lines.join('\n'), type: 'output' }] };
}

function cmdStartMission(args: string[], _ctx: CommandContext): CommandResult {
  if (args.length === 0) {
    return { outputs: [{ text: 'Usage: start <mission-number>', type: 'error' }] };
  }
  const num = parseInt(args[0]);
  if (isNaN(num) || num < 1 || num > 10) {
    return { outputs: [{ text: 'Invalid mission number. Use "missions" to see available missions.', type: 'error' }] };
  }

  const missionBriefings: Record<number, string> = {
    1: `Mission 1: First Steps
Objective: Learn to navigate the filesystem!

Tasks:
1. Use "pwd" to see where you are
2. Use "ls" to list files
3. Use "cd documents" to enter the documents folder
4. Use "cd .." to go back
5. Use "ls -la" to find hidden files

Reward: 50 XP`,
    2: `Mission 2: File Detective
Objective: Create, read, and find files!

Tasks:
1. Use "cat readme.txt" to read the welcome file
2. Use "touch myfile.txt" to create a new file
3. Use "mkdir myfolder" to create a directory
4. Use "ls" to confirm your creations

Reward: 75 XP`,
    3: `Mission 3: Secret Message
Objective: Decode a hidden message!

Tasks:
1. Find the hidden file using "ls -la"
2. Read the secret file with "cat"
3. Look for secret codes in the documents folder

Reward: 100 XP`,
    4: `Mission 4: Password Check
Objective: Learn about password security!

Tasks:
1. Read "documents/passwords.txt" with cat
2. Find what makes a strong password
3. Use "grep" to find "password" in files

Reward: 100 XP`,
    5: `Mission 5: Network Scan
Objective: Explore network commands!

Tasks:
1. Run "ifconfig" to see network interfaces
2. Run "ping localhost" to test connectivity
3. Run "nmap 127.0.0.1" to scan ports

Reward: 125 XP`,
    6: `Mission 6: Firewall Setup
Objective: Learn about firewalls!

Tasks:
1. Read "projects/firewall.sh" with cat
2. Understand what each firewall rule does
3. Use "chmod" to make the script executable

Reward: 125 XP`,
    7: `Mission 7: Log Analysis
Objective: Find suspicious activity!

Tasks:
1. View "var/log/auth.log" with cat
2. Use "tail" to see the most recent entries
3. Use "grep" to find "FAILED" login attempts

Reward: 150 XP`,
    8: `Mission 8: File Recovery
Objective: Backup and recover files!

Tasks:
1. Copy "readme.txt" to "readme_backup.txt"
2. Move a file to a new location
3. Remove an unneeded file

Reward: 150 XP`,
    9: `Mission 9: Encryption Master
Objective: Understand encryption!

Tasks:
1. Read "projects/encrypt.py" with cat
2. Understand how the Caesar cipher works
3. Try encrypting your own message with Python

Reward: 175 XP`,
    10: `Mission 10: Cyber Defender
Objective: Final challenge - use ALL your skills!

Tasks:
1. Navigate through multiple directories
2. Read system logs and find the attacker's IP
3. Check firewall status
4. Use multiple commands to complete the investigation

Reward: 500 XP`,
  };

  const briefing = missionBriefings[num] || `Mission ${num}: Briefing unavailable.`;

  return {
    outputs: [
      { text: '═══════════════════════════════════════════', type: 'ascii' },
      { text: briefing, type: 'output' },
      { text: '═══════════════════════════════════════════', type: 'ascii' },
      { text: `Mission ${num} started! Good luck, agent!`, type: 'success' },
    ],
  };
}

// Tab completion helper
export function getCompletions(input: string, fs: FileSystemState): string[] {
  const parts = input.split(/\s+/);
  if (parts.length <= 1) {
    // Complete command
    const cmds = [
      'help', 'ls', 'cd', 'pwd', 'mkdir', 'touch', 'cat', 'echo', 'clear',
      'whoami', 'date', 'cal', 'tree', 'rm', 'rmdir', 'cp', 'mv',
      'head', 'tail', 'grep', 'chmod', 'ps', 'top', 'ifconfig', 'ping',
      'traceroute', 'nmap', 'netstat', 'wget', 'curl', 'ssh', 'sudo',
      'history', 'exit', 'banner', 'fortune', 'cowsay', 'matrix',
      'missions', 'start',
    ];
    const prefix = parts[0].toLowerCase();
    return cmds.filter((c) => c.startsWith(prefix));
  }

  // Complete filename
  const lastArg = parts[parts.length - 1];
  const node = fs.currentNode;
  if (node.type !== 'directory' || !node.children) return [];

  const prefix = lastArg.toLowerCase();
  const entries = Array.from(node.children.values());
  return entries
    .filter((e) => e.name.toLowerCase().startsWith(prefix))
    .map((e) => (e.type === 'directory' ? e.name + '/' : e.name));
}
