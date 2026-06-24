export interface MissionObjective {
  id: string;
  text: string;
  completed: boolean;
}

export interface Mission {
  id: number;
  title: string;
  description: string;
  objectives: MissionObjective[];
  hints: string[];
  xpReward: number;
  completed: boolean;
  commandsUsed: string[];
  difficulty: 1 | 2 | 3;
}

export const DEFAULT_MISSIONS: Mission[] = [
  {
    id: 1,
    title: 'Find the Hidden File',
    description: 'Learn to use ls -la to discover hidden files in the filesystem. Hidden files in Linux start with a dot (.)!',
    objectives: [
      { id: 'm1-1', text: 'Run "pwd" to see your current location', completed: false },
      { id: 'm1-2', text: 'Run "ls" to list visible files', completed: false },
      { id: 'm1-3', text: 'Run "ls -la" to reveal hidden files', completed: false },
      { id: 'm1-4', text: 'Find the hidden file starting with "."', completed: false },
    ],
    hints: [
      'Type "pwd" and press Enter to see where you are.',
      'Type "ls" to see normal files, then "ls -la" to see ALL files including hidden ones.',
      'Look for files that start with a dot (.) - they are hidden!',
    ],
    xpReward: 50,
    completed: false,
    commandsUsed: ['pwd', 'ls', 'ls -la'],
    difficulty: 1,
  },
  {
    id: 2,
    title: 'Read the Secret Message',
    description: 'Use the cat command to read files and uncover secret messages hidden in the documents folder.',
    objectives: [
      { id: 'm2-1', text: 'Run "cat readme.txt" to read the welcome file', completed: false },
      { id: 'm2-2', text: 'Run "cd documents" to enter the documents folder', completed: false },
      { id: 'm2-3', text: 'Run "cat passwords.txt" to read the password guide', completed: false },
      { id: 'm2-4', text: 'Find the secret code hidden in the documents', completed: false },
    ],
    hints: [
      'Type "cat readme.txt" to see what is in the welcome file.',
      'Use "cd documents" to navigate, then "cat" to read files there.',
      'Try reading all the .txt files in the documents folder!',
    ],
    xpReward: 75,
    completed: false,
    commandsUsed: ['cat', 'cd'],
    difficulty: 1,
  },
  {
    id: 3,
    title: 'Navigate the Maze',
    description: 'Master directory navigation using cd and pwd. Explore different folders and find your way back!',
    objectives: [
      { id: 'm3-1', text: 'Navigate to /home/user/documents', completed: false },
      { id: 'm3-2', text: 'Navigate to /home/user/projects', completed: false },
      { id: 'm3-3', text: 'Use "pwd" to confirm your location', completed: false },
      { id: 'm3-4', text: 'Return to home using "cd ~" or "cd"', completed: false },
    ],
    hints: [
      'Use "cd" followed by a folder name to enter it.',
      'Use "cd .." to go up one directory level.',
      'Type just "cd" to return to your home directory instantly!',
    ],
    xpReward: 75,
    completed: false,
    commandsUsed: ['cd', 'pwd'],
    difficulty: 1,
  },
  {
    id: 4,
    title: 'Create Your First Script',
    description: 'Learn to create files using touch and echo. Write your own notes in the filesystem!',
    objectives: [
      { id: 'm4-1', text: 'Use "touch mynotes.txt" to create a new file', completed: false },
      { id: 'm4-2', text: 'Use "mkdir myfolder" to create a directory', completed: false },
      { id: 'm4-3', text: 'Run "ls" to verify your creations exist', completed: false },
      { id: 'm4-4', text: 'Use "cat" to view your new file', completed: false },
    ],
    hints: [
      'Type "touch mynotes.txt" to create an empty file.',
      'Type "mkdir myfolder" to create a new folder.',
      'Use "ls" to see your new file and folder in the listing!',
    ],
    xpReward: 100,
    completed: false,
    commandsUsed: ['touch', 'mkdir', 'ls', 'cat'],
    difficulty: 1,
  },
  {
    id: 5,
    title: 'Find the Password',
    description: 'Use grep to search for passwords and sensitive information in files. Learn what NOT to do!',
    objectives: [
      { id: 'm5-1', text: 'Navigate to the documents folder', completed: false },
      { id: 'm5-2', text: 'Run "grep password passwords.txt" to search', completed: false },
      { id: 'm5-3', text: 'Try "grep -i secret passwords.txt" (case insensitive)', completed: false },
      { id: 'm5-4', text: 'Find all lines containing "password" in any file', completed: false },
    ],
    hints: [
      'Type "grep password passwords.txt" to find lines with "password".',
      'Grep searches inside files for text patterns.',
      'Try searching for different words like "secret" or "strong"!',
    ],
    xpReward: 100,
    completed: false,
    commandsUsed: ['grep', 'cd', 'cat'],
    difficulty: 2,
  },
  {
    id: 6,
    title: 'Check the Logs',
    description: 'Use cat, head, and tail to examine system log files and find security events!',
    objectives: [
      { id: 'm6-1', text: 'View auth.log with "cat /var/log/auth.log"', completed: false },
      { id: 'm6-2', text: 'Use "head" to see the first 10 lines', completed: false },
      { id: 'm6-3', text: 'Use "tail" to see the last 10 lines', completed: false },
      { id: 'm6-4', text: 'Find the failed login attempts in the log', completed: false },
    ],
    hints: [
      'Type "cat /var/log/auth.log" to see the full log file.',
      'Use "head /var/log/auth.log" for just the beginning.',
      'Use "tail /var/log/auth.log" for just the end - where recent events are!',
    ],
    xpReward: 125,
    completed: false,
    commandsUsed: ['cat', 'head', 'tail'],
    difficulty: 2,
  },
  {
    id: 7,
    title: 'Scan the Network',
    description: 'Learn about network commands: nmap, ping, and ifconfig. Explore how computers talk!',
    objectives: [
      { id: 'm7-1', text: 'Run "ifconfig" to see your network interfaces', completed: false },
      { id: 'm7-2', text: 'Run "ping localhost" to test connectivity', completed: false },
      { id: 'm7-3', text: 'Run "nmap 127.0.0.1" to scan local ports', completed: false },
      { id: 'm7-4', text: 'Identify which ports are open on your system', completed: false },
    ],
    hints: [
      'Type "ifconfig" to see your IP address and network info.',
      'Type "ping localhost" to test if your computer responds.',
      'Type "nmap 127.0.0.1" to see what services are running!',
    ],
    xpReward: 125,
    completed: false,
    commandsUsed: ['ifconfig', 'ping', 'nmap'],
    difficulty: 2,
  },
  {
    id: 8,
    title: 'Secure the Files',
    description: 'Learn about file permissions with chmod. Protect important files from unauthorized access!',
    objectives: [
      { id: 'm8-1', text: 'List files with "ls -la" to see permissions', completed: false },
      { id: 'm8-2', text: 'Use "chmod 600 readme.txt" to restrict access', completed: false },
      { id: 'm8-3', text: 'Use "chmod 755" on a directory', completed: false },
      { id: 'm8-4', text: 'Verify changes with "ls -la"', completed: false },
    ],
    hints: [
      'Permissions are the rwx letters at the start of ls -la output.',
      'chmod 600 means only the owner can read and write.',
      'chmod 755 means owner can do everything, others can only read and execute.',
    ],
    xpReward: 150,
    completed: false,
    commandsUsed: ['chmod', 'ls -la'],
    difficulty: 2,
  },
  {
    id: 9,
    title: 'Trace the Hacker',
    description: 'Use traceroute and netstat to investigate network connections and trace routes!',
    objectives: [
      { id: 'm9-1', text: 'Run "traceroute cyberpaw.edu" to trace the route', completed: false },
      { id: 'm9-2', text: 'Run "netstat" to see active connections', completed: false },
      { id: 'm9-3', text: 'Identify the IP address of an active connection', completed: false },
      { id: 'm9-4', text: 'Count how many network hops to the destination', completed: false },
    ],
    hints: [
      'Type "traceroute cyberpaw.edu" to see each hop.',
      'Type "netstat" to see all network connections.',
      'Look for ESTABLISHED connections - those are active right now!',
    ],
    xpReward: 175,
    completed: false,
    commandsUsed: ['traceroute', 'netstat'],
    difficulty: 3,
  },
  {
    id: 10,
    title: 'Master the System',
    description: 'Final challenge! Use multiple commands to complete a full cybersecurity investigation.',
    objectives: [
      { id: 'm10-1', text: 'Read all files in the documents folder', completed: false },
      { id: 'm10-2', text: 'Check system logs for suspicious activity', completed: false },
      { id: 'm10-3', text: 'Use 5 different network commands', completed: false },
      { id: 'm10-4', text: 'Find the secret message in a hidden file', completed: false },
    ],
    hints: [
      'Start by exploring all the folders and reading important files.',
      'Check /var/log/auth.log for security events.',
      'Try ifconfig, ping, nmap, netstat, and traceroute!',
    ],
    xpReward: 500,
    completed: false,
    commandsUsed: ['all'],
    difficulty: 3,
  },
];

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  icon: string;
  color: string;
}

export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_cmd', title: 'First Command', description: 'Run any command', unlocked: false, icon: 'terminal', color: '#4ADE80' },
  { id: 'navigator', title: 'Navigator', description: 'Use cd and ls 5 times', unlocked: false, icon: 'compass', color: '#60A5FA' },
  { id: 'file_master', title: 'File Master', description: 'Create 5 files or directories', unlocked: false, icon: 'file', color: '#A78BFA' },
  { id: 'code_breaker', title: 'Code Breaker', description: 'Use grep to search files', unlocked: false, icon: 'key', color: '#FACC15' },
  { id: 'password_pro', title: 'Password Pro', description: 'Read the password guide', unlocked: false, icon: 'lock', color: '#F472B6' },
  { id: 'network_scout', title: 'Network Scout', description: 'Use 3 network commands', unlocked: false, icon: 'radar', color: '#60A5FA' },
  { id: 'log_reader', title: 'Log Reader', description: 'Read system log files', unlocked: false, icon: 'search', color: '#4ADE80' },
  { id: 'encryptor', title: 'Encryptor', description: 'Read the encryption script', unlocked: false, icon: 'shield', color: '#A78BFA' },
  { id: 'firewall_builder', title: 'Firewall Builder', description: 'Read the firewall script', unlocked: false, icon: 'flame', color: '#FB923C' },
  { id: 'mission_complete', title: 'Mission Complete', description: 'Finish all 10 missions', unlocked: false, icon: 'trophy', color: '#FACC15' },
];

export function checkMissionProgress(
  mission: Mission,
  command: string,
  _fs?: { currentDir: string }
): Mission {
  const updated = { ...mission, objectives: mission.objectives.map((o) => ({ ...o })) };

  switch (mission.id) {
    case 1: {
      if (command === 'pwd') updated.objectives[0].completed = true;
      if (command === 'ls') updated.objectives[1].completed = true;
      if (command === 'ls -la' || command.startsWith('ls -')) updated.objectives[2].completed = true;
      if ((command === 'ls -la' || command.startsWith('ls -')) && updated.objectives[2].completed)
        updated.objectives[3].completed = true;
      break;
    }
    case 2: {
      if (command.startsWith('cat readme')) updated.objectives[0].completed = true;
      if (command === 'cd documents' || command === 'cd ./documents') updated.objectives[1].completed = true;
      if (command.startsWith('cat ') && command.includes('passwords')) updated.objectives[2].completed = true;
      if (updated.objectives[0].completed && updated.objectives[1].completed && updated.objectives[2].completed)
        updated.objectives[3].completed = true;
      break;
    }
    case 3: {
      if (command.includes('cd ') && (command.includes('documents') || command.includes('projects')))
        updated.objectives[0].completed = true;
      if (command.includes('cd ') && command.includes('projects')) updated.objectives[1].completed = true;
      if (command === 'pwd') updated.objectives[2].completed = true;
      if (command === 'cd' || command === 'cd ~') updated.objectives[3].completed = true;
      break;
    }
    case 4: {
      if (command.startsWith('touch ')) updated.objectives[0].completed = true;
      if (command.startsWith('mkdir ')) updated.objectives[1].completed = true;
      if (command === 'ls' || command === 'ls -la') updated.objectives[2].completed = true;
      if (command.startsWith('cat ') && updated.objectives[0].completed) updated.objectives[3].completed = true;
      break;
    }
    case 5: {
      if (command.includes('cd ')) updated.objectives[0].completed = true;
      if (command.startsWith('grep ') && command.includes('password')) updated.objectives[1].completed = true;
      if (command.startsWith('grep ') && command.includes('secret')) updated.objectives[2].completed = true;
      if (updated.objectives[1].completed && updated.objectives[2].completed) updated.objectives[3].completed = true;
      break;
    }
    case 6: {
      if (command.includes('cat /var/log/auth') || command.includes('cat var/log/auth')) updated.objectives[0].completed = true;
      if (command.startsWith('head ')) updated.objectives[1].completed = true;
      if (command.startsWith('tail ')) updated.objectives[2].completed = true;
      if (updated.objectives[0].completed && command.includes('auth')) updated.objectives[3].completed = true;
      break;
    }
    case 7: {
      if (command === 'ifconfig' || command === 'ip a') updated.objectives[0].completed = true;
      if (command.startsWith('ping ')) updated.objectives[1].completed = true;
      if (command.startsWith('nmap ')) updated.objectives[2].completed = true;
      if (updated.objectives[0].completed && updated.objectives[1].completed && updated.objectives[2].completed)
        updated.objectives[3].completed = true;
      break;
    }
    case 8: {
      if (command === 'ls -la' || command.startsWith('ls -l')) updated.objectives[0].completed = true;
      if (command.startsWith('chmod 600 ') || command.startsWith('chmod ')) {
        if (command.includes('600')) updated.objectives[1].completed = true;
        if (command.includes('755')) updated.objectives[2].completed = true;
      }
      if (updated.objectives[1].completed && updated.objectives[2].completed) updated.objectives[3].completed = true;
      break;
    }
    case 9: {
      if (command.startsWith('traceroute ')) updated.objectives[0].completed = true;
      if (command === 'netstat') updated.objectives[1].completed = true;
      if (updated.objectives[0].completed) updated.objectives[2].completed = true;
      if (updated.objectives[1].completed) updated.objectives[3].completed = true;
      break;
    }
    case 10: {
      if (command.startsWith('cat ')) {
        if (!updated.objectives[0].completed) updated.objectives[0].completed = true;
      }
      if (command.includes('auth.log')) updated.objectives[1].completed = true;
      if (command === 'ifconfig' || command === 'ping localhost' || command.startsWith('nmap ') || command === 'netstat' || command.startsWith('traceroute')) {
        updated.objectives[2].completed = true;
      }
      if (command === 'ls -la' || command.startsWith('cat .')) updated.objectives[3].completed = true;
      break;
    }
  }

  // Check if all objectives are completed
  updated.completed = updated.objectives.every((o) => o.completed);
  return updated;
}

export function checkAchievements(
  achievements: Achievement[],
  command: string,
  totalCommands: number,
  missionsCompleted: number,
  filesCreated: number,
  networkCommandsUsed: string[]
): Achievement[] {
  return achievements.map((a) => {
    if (a.unlocked) return a;
    const na = { ...a };

    switch (a.id) {
      case 'first_cmd':
        if (totalCommands >= 1) na.unlocked = true;
        break;
      case 'navigator':
        if (command === 'cd' || command === 'ls') {
          // Would need persistent counter in real app
          na.unlocked = totalCommands >= 5;
        }
        break;
      case 'file_master':
        if (filesCreated >= 5) na.unlocked = true;
        break;
      case 'code_breaker':
        if (command.startsWith('grep ')) na.unlocked = true;
        break;
      case 'password_pro':
        if (command.includes('passwords')) na.unlocked = true;
        break;
      case 'network_scout':
        if (networkCommandsUsed.length >= 3) na.unlocked = true;
        break;
      case 'log_reader':
        if (command.includes('auth.log') || command.includes('syslog')) na.unlocked = true;
        break;
      case 'encryptor':
        if (command.includes('encrypt')) na.unlocked = true;
        break;
      case 'firewall_builder':
        if (command.includes('firewall')) na.unlocked = true;
        break;
      case 'mission_complete':
        if (missionsCompleted >= 10) na.unlocked = true;
        break;
    }

    return na;
  });
}
