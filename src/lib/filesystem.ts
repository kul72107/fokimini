// Virtual Filesystem for CyberPaw Kids Terminal

export interface FileNode {
  name: string;
  type: 'file' | 'directory';
  content?: string;
  permissions: string;
  owner: string;
  group: string;
  size: number;
  modified: Date;
  children?: Map<string, FileNode>;
}

export interface FileSystemState {
  root: FileNode;
  currentDir: string;
  currentNode: FileNode;
}

function createDir(name: string, permissions = 'rwxr-xr-x'): FileNode {
  return {
    name,
    type: 'directory',
    permissions,
    owner: 'user',
    group: 'user',
    size: 4096,
    modified: new Date('2025-01-15'),
    children: new Map(),
  };
}

function createFile(
  name: string,
  content: string,
  permissions = 'rw-r--r--',
  size?: number
): FileNode {
  return {
    name,
    type: 'file',
    content,
    permissions,
    owner: 'user',
    group: 'user',
    size: size ?? content.length,
    modified: new Date('2025-01-15'),
  };
}

function buildFilesystem(): FileNode {
  const root = createDir('', 'rwxr-xr-x');

  // /bin
  const bin = createDir('bin', 'rwxr-xr-x');
  bin.children!.set('bash', createFile('bash', '#!/bin/bash\n# Bash shell executable\necho "CyberPaw Shell v1.0"', 'rwxr-xr-x', 102400));
  bin.children!.set('ls', createFile('ls', '#!/bin/bash\n# List directory contents', 'rwxr-xr-x', 32000));
  bin.children!.set('cat', createFile('cat', '#!/bin/bash\n# Concatenate files', 'rwxr-xr-x', 28000));
  bin.children!.set('grep', createFile('grep', '#!/bin/bash\n# Search text patterns', 'rwxr-xr-x', 36000));
  bin.children!.set('python3', createFile('python3', '#!/usr/bin/python3\n# Python 3.11 - CyberPaw Edition', 'rwxr-xr-x', 512000));
  root.children!.set('bin', bin);

  // /etc
  const etc = createDir('etc', 'rwxr-xr-x');
  etc.children!.set('hostname', createFile('hostname', 'cyberpaws-terminal', 'rw-r--r--', 20));
  etc.children!.set('hosts', createFile('hosts', '127.0.0.1 localhost\n127.0.1.1 cyberpaws-terminal\n\n# Educational: This file maps hostnames to IP addresses!', 'rw-r--r--', 80));
  etc.children!.set('os-release', createFile('os-release', 'NAME="CyberPaw OS"\nVERSION="1.0 (Kitten Edition)"\nID=cyberpaw\nPRETTY_NAME="CyberPaw OS 1.0"', 'rw-r--r--', 70));
  etc.children!.set('passwd', createFile('passwd', 'root:x:0:0:root:/root:/bin/bash\nuser:x:1000:1000:CyberPaw Hacker:/home/user:/bin/bash\nguest:x:1001:1001:Guest:/home/guest:/bin/bash', 'rw-r--r--', 120));
  root.children!.set('etc', etc);

  // /var
  const var_ = createDir('var', 'rwxr-xr-x');
  const varLog = createDir('log', 'rwxr-xr-x');
  varLog.children!.set('auth.log', createFile('auth.log', `[2025-01-15 08:23:14] user login from 127.0.0.1 - SUCCESS
[2025-01-15 09:45:33] sudo command executed by user: apt update
[2025-01-15 10:12:07] Failed password for root from 192.168.1.99 - ATTEMPT BLOCKED
[2025-01-15 10:12:09] Failed password for root from 192.168.1.99 - ATTEMPT BLOCKED
[2025-01-15 10:12:12] Failed password for root from 192.168.1.99 - IP BANNED
[2025-01-15 11:30:00] user logged out
[2025-01-15 14:22:18] NEW USER CREATED: cyberpaw_student
[2025-01-15 15:00:00] Security scan completed - 3 vulnerabilities found
[2025-01-15 15:05:22] Firewall rules updated by user
[2025-01-15 16:45:10] Connection from trusted IP 10.0.0.5 - ACCEPTED
[2025-01-15 17:12:33] WARNING: Multiple failed SSH attempts detected
[2025-01-15 17:12:35] Automated defense: SSH access temporarily restricted`, 'rw-r--r--', 580));
  varLog.children!.set('syslog', createFile('syslog', `[2025-01-15 00:00:01] System boot - CyberPaw OS v1.0
[2025-01-15 00:00:05] Kernel: Loading drivers...
[2025-01-15 00:00:12] Network interface eth0: UP (192.168.1.50)
[2025-01-15 00:00:15] Firewall: Active
[2025-01-15 00:01:00] Cron job: Daily security scan started
[2025-01-15 00:15:30] Cron job: Security scan completed - System secure
[2025-01-15 08:20:00] User session started: user
[2025-01-15 12:00:00] System update check: 2 updates available`, 'rw-r--r--', 350));
  var_.children!.set('log', varLog);
  root.children!.set('var', var_);

  // /tmp
  const tmp = createDir('tmp', 'rwxrwxrwt');
  tmp.children!.set('temp_note.txt', createFile('temp_note.txt', 'This is a temporary file!\nFiles in /tmp may be deleted when the system restarts.', 'rw-rw-rw-', 60));
  root.children!.set('tmp', tmp);

  // /home
  const home = createDir('home', 'rwxr-xr-x');
  const user = createDir('user', 'rwxr-xr-x');

  // /home/user - base files
  user.children!.set('readme.txt', createFile('readme.txt', `Welcome to CyberPaw Terminal!
=============================
You are now a junior cybersecurity agent!

Your home directory is: /home/user
This is where all YOUR files live.

TIP: Try these commands to get started:
  ls       - List files in current directory
  pwd      - Show where you are
  cat readme.txt  - Read this file again
  help     - See all available commands

Good luck, agent!`, 'rw-r--r--', 220));
  user.children!.set('.bashrc', createFile('.bashrc', '# CyberPaw Shell Configuration\nalias ll="ls -la"\nalias ..="cd .."\nexport PS1="\\u@cyberpaws:\\w$ "\n# Welcome message\necho "Welcome to CyberPaw Terminal! Type \"help\" to get started."', 'rw-r--r--', 140));
  user.children!.set('.profile', createFile('.profile', '# User profile settings\nexport PATH="/bin:/usr/bin:/usr/local/bin"\nexport EDITOR="nano"', 'rw-r--r--', 70));

  // /home/user/documents
  const documents = createDir('documents', 'rwxr-xr-x');
  documents.children!.set('passwords.txt', createFile('passwords.txt', `Password Security Guide
========================
NEVER use these weak passwords:
- 123456
- password
- qwerty
- your name + birthday

STRONG password tips:
1. Use at least 12 characters
2. Mix UPPERCASE, lowercase, numbers, and symbols
3. Use a passphrase: "MyCatLikes2EatPizza!"
4. Use a different password for each site
5. Consider using a password manager

EXAMPLE strong passwords:
- Tr0ub4dor&3 (NOT this one - it's famous!)
- correct-horse-battery-staple!47
- CyberPaw#2025Meow`, 'rw-r--r--', 310));
  documents.children!.set('phishing_guide.txt', createFile('phishing_guide.txt', `How to Spot Phishing Emails
============================
Phishing is when bad guys pretend to be someone
trustworthy to steal your information.

RED FLAGS to watch for:
1. Urgent language: "ACT NOW or your account will be CLOSED!"
2. Suspicious sender: "amaz0n-support@gmail.com" (not amazon.com!)
3. Unexpected attachments
4. Links that don't match: hover to see the real URL
5. Spelling and grammar mistakes
6. Requests for passwords or personal info

REAL companies will NEVER ask for your password by email!

When in doubt: DON'T CLICK! Ask a trusted adult.`, 'rw-r--r--', 380));
  documents.children!.set('cyber_tips.txt', createFile('cyber_tips.txt', `Cyber Security Tips for Kids
=============================
1. Keep your passwords SECRET - even from friends!
2. Don't share personal info online (address, school, phone)
3. Always log out of shared computers
4. Keep your software updated
5. Use antivirus software
6. Backup your important files
7. Be careful what you download
8. If something feels wrong, tell a trusted adult

Remember: Stay safe, stay smart, stay curious!`, 'rw-r--r--', 290));
  documents.children!.set('.secret.txt', createFile('.secret.txt', `CONGRATULATIONS! You found a hidden file!
Files starting with "." are hidden in Linux.
Use "ls -la" to see them.

SECRET CODE: CYPERPAW-AGENT-42
This proves you know how to explore!`, 'rw-r--r--', 150));
  user.children!.set('documents', documents);

  // /home/user/pictures
  const pictures = createDir('pictures', 'rwxr-xr-x');
  pictures.children!.set('cat_logo.png', createFile('cat_logo.png', '[PNG IMAGE DATA: CyberPaw Cat Logo - 800x600px]', 'rw-r--r--', 45000));
  pictures.children!.set('hacker_cat.jpg', createFile('hacker_cat.jpg', '[JPEG IMAGE DATA: Cat wearing hacker hoodie - 1920x1080px]', 'rw-r--r--', 125000));
  pictures.children!.set('paw_print.svg', createFile('paw_print.svg', '<svg><!-- Paw print decoration --></svg>', 'rw-r--r--', 2300));
  user.children!.set('pictures', pictures);

  // /home/user/projects
  const projects = createDir('projects', 'rwxr-xr-x');
  projects.children!.set('encrypt.py', createFile('encrypt.py', `#!/usr/bin/env python3
# Simple Caesar Cipher Encryption Tool
# Created by CyberPaw Academy

def caesar_encrypt(text, shift=3):
    result = ""
    for char in text:
        if char.isalpha():
            base = ord('A') if char.isupper() else ord('a')
            result += chr((ord(char) - base + shift) % 26 + base)
        else:
            result += char
    return result

def caesar_decrypt(text, shift=3):
    return caesar_encrypt(text, -shift)

# Example usage
if __name__ == "__main__":
    message = "Hello CyberPaw!"
    encrypted = caesar_encrypt(message, 3)
    print(f"Original: {message}")
    print(f"Encrypted: {encrypted}")
    print(f"Decrypted: {caesar_decrypt(encrypted, 3)}")
`, 'rwxr-xr-x', 520));
  projects.children!.set('firewall.sh', createFile('firewall.sh', `#!/bin/bash
# Basic Firewall Configuration Script
# Run with: sudo bash firewall.sh

echo "Setting up CyberPaw Firewall..."

# Block suspicious IPs
iptables -A INPUT -s 192.168.1.99 -j DROP
echo "[OK] Blocked suspicious IP: 192.168.1.99"

# Allow SSH only from local network
iptables -A INPUT -p tcp --dport 22 -s 10.0.0.0/8 -j ACCEPT
echo "[OK] SSH restricted to local network"

# Allow HTTP/HTTPS
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
echo "[OK] Web traffic allowed"

# Drop all other incoming
iptables -P INPUT DROP
echo "[OK] Default policy: DROP"

echo "Firewall configured successfully!"
`, 'rwxr-xr-x', 440));
  projects.children!.set('scan_network.py', createFile('scan_network.py', `#!/usr/bin/env python3
# Network Scanner for Educational Purposes
# ONLY scan networks you own or have permission to scan!

import socket

def scan_port(ip, port):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(1)
    result = sock.connect_ex((ip, port))
    sock.close()
    return result == 0

def scan_host(ip):
    print(f"Scanning {ip}...")
    open_ports = []
    common_ports = [22, 80, 443, 3306, 8080]
    for port in common_ports:
        if scan_port(ip, port):
            open_ports.append(port)
            print(f"  Port {port}: OPEN")
        else:
            print(f"  Port {port}: closed")
    return open_ports

# Example: scan localhost
if __name__ == "__main__":
    print("CyberPaw Network Scanner v1.0")
    print("WARNING: Only scan networks you have permission to scan!")
    scan_host("127.0.0.1")
`, 'rwxr-xr-x', 580));
  projects.children!.set('hello.txt', createFile('hello.txt', 'Hello, young hacker! This is your projects folder.\nCreate your own scripts here!', 'rw-r--r--', 65));
  user.children!.set('projects', projects);

  // /home/user/downloads
  const downloads = createDir('downloads', 'rwxr-xr-x');
  downloads.children!.set('linux_cheatsheet.pdf', createFile('linux_cheatsheet.pdf', '[PDF: Linux Command Reference for Kids - 45 pages]', 'rw-r--r--', 850000));
  user.children!.set('downloads', downloads);

  home.children!.set('user', user);
  root.children!.set('home', home);

  return root;
}

export function createInitialState(): FileSystemState {
  const root = buildFilesystem();
  const homeNode = root.children!.get('home')!;
  const userNode = homeNode.children!.get('user')!;
  return {
    root,
    currentDir: '/home/user',
    currentNode: userNode,
  };
}

// Path utilities
export function resolvePath(currentDir: string, path: string): string {
  if (path.startsWith('/')) {
    return normalizePath(path);
  }
  return normalizePath(currentDir + '/' + path);
}

function normalizePath(path: string): string {
  const parts = path.split('/').filter((p) => p.length > 0);
  const result: string[] = [];
  for (const part of parts) {
    if (part === '..') {
      result.pop();
    } else if (part !== '.') {
      result.push(part);
    }
  }
  return '/' + result.join('/');
}

export function getNodeAtPath(root: FileNode, path: string): FileNode | null {
  const normalized = normalizePath(path);
  if (normalized === '/') return root;
  const parts = normalized.split('/').filter((p) => p.length > 0);
  let current: FileNode = root;
  for (const part of parts) {
    if (current.type !== 'directory' || !current.children) return null;
    const next = current.children.get(part);
    if (!next) return null;
    current = next;
  }
  return current;
}

export function getParentAndName(root: FileNode, path: string): { parent: FileNode; name: string } | null {
  const normalized = normalizePath(path);
  const lastSlash = normalized.lastIndexOf('/');
  if (lastSlash === -1) return null;
  const parentPath = normalized.slice(0, lastSlash) || '/';
  const name = normalized.slice(lastSlash + 1);
  const parent = getNodeAtPath(root, parentPath);
  if (!parent || parent.type !== 'directory') return null;
  return { parent, name };
}

export function getPromptPath(currentDir: string): string {
  if (currentDir === '/home/user') return '~';
  if (currentDir.startsWith('/home/user/')) return '~' + currentDir.slice('/home/user'.length);
  return currentDir;
}
