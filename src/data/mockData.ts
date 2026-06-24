// ===========================
// Leaderboard Mock Data
// ===========================

export interface LeaderboardPlayer {
  rank: number;
  username: string;
  level: number;
  xp: number;
  badges: number;
  streak: number;
  isCurrentUser: boolean;
  avatarColor: string;
}

export const leaderboardData: LeaderboardPlayer[] = [
  { rank: 1, username: "CyberKitty99", level: 24, xp: 24500, badges: 32, streak: 45, isCurrentUser: false, avatarColor: "#FACC15" },
  { rank: 2, username: "HackMaster_Luna", level: 22, xp: 22100, badges: 28, streak: 32, isCurrentUser: false, avatarColor: "#60A5FA" },
  { rank: 3, username: "PawScanner", level: 20, xp: 19800, badges: 26, streak: 28, isCurrentUser: false, avatarColor: "#F472B6" },
  { rank: 4, username: "MeowFirewall", level: 19, xp: 18700, badges: 25, streak: 21, isCurrentUser: false, avatarColor: "#4ADE80" },
  { rank: 5, username: "CryptoKitten", level: 18, xp: 17600, badges: 24, streak: 19, isCurrentUser: false, avatarColor: "#A78BFA" },
  { rank: 6, username: "NinjaWhiskers", level: 17, xp: 16500, badges: 22, streak: 17, isCurrentUser: false, avatarColor: "#FB923C" },
  { rank: 7, username: "BytePaw", level: 17, xp: 16200, badges: 23, streak: 15, isCurrentUser: false, avatarColor: "#34D399" },
  { rank: 8, username: "TerminalTabby", level: 16, xp: 15400, badges: 21, streak: 14, isCurrentUser: false, avatarColor: "#F87171" },
  { rank: 9, username: "PacketPurr", level: 15, xp: 14800, badges: 20, streak: 12, isCurrentUser: false, avatarColor: "#22D3EE" },
  { rank: 10, username: "HexHisser", level: 15, xp: 14500, badges: 19, streak: 11, isCurrentUser: false, avatarColor: "#C084FC" },
  { rank: 11, username: "CyberClaw", level: 14, xp: 13800, badges: 19, streak: 10, isCurrentUser: false, avatarColor: "#FBBF24" },
  { rank: 12, username: "DataMouser", level: 14, xp: 13500, badges: 18, streak: 9, isCurrentUser: false, avatarColor: "#A3E635" },
  { rank: 13, username: "PhishFeline", level: 13, xp: 12800, badges: 17, streak: 8, isCurrentUser: false, avatarColor: "#67E8F9" },
  { rank: 14, username: "RootRascal", level: 13, xp: 12500, badges: 17, streak: 7, isCurrentUser: false, avatarColor: "#FDA4AF" },
  { rank: 15, username: "ProxyPouncer", level: 12, xp: 11800, badges: 16, streak: 6, isCurrentUser: false, avatarColor: "#FACC15" },
  { rank: 16, username: "ScriptStray", level: 12, xp: 11500, badges: 16, streak: 5, isCurrentUser: false, avatarColor: "#A78BFA" },
  { rank: 17, username: "VirusVanquisher", level: 11, xp: 10800, badges: 15, streak: 5, isCurrentUser: false, avatarColor: "#4ADE80" },
  { rank: 18, username: "WormWhacker", level: 11, xp: 10500, badges: 15, streak: 4, isCurrentUser: false, avatarColor: "#FB923C" },
  { rank: 19, username: "TrojanTamer", level: 10, xp: 9800, badges: 14, streak: 3, isCurrentUser: false, avatarColor: "#60A5FA" },
  { rank: 20, username: "PixelPaw42", level: 10, xp: 9500, badges: 14, streak: 2, isCurrentUser: false, avatarColor: "#F472B6" },
  { rank: 21, username: "CyberPouncer", level: 9, xp: 8800, badges: 13, streak: 2, isCurrentUser: false, avatarColor: "#34D399" },
  { rank: 22, username: "NetNuzzle", level: 8, xp: 8200, badges: 12, streak: 1, isCurrentUser: false, avatarColor: "#F87171" },
  { rank: 23, username: "BitBopper", level: 8, xp: 8000, badges: 12, streak: 1, isCurrentUser: false, avatarColor: "#A78BFA" },
  { rank: 24, username: "FirewallFur", level: 7, xp: 7200, badges: 11, streak: 1, isCurrentUser: false, avatarColor: "#FACC15" },
  { rank: 25, username: "MalwareMittens", level: 7, xp: 7000, badges: 10, streak: 0, isCurrentUser: false, avatarColor: "#22D3EE" },
];

export const currentUserRank = 42;

// ===========================
// Weekly Challenge Data
// ===========================

export interface WeeklyChallenge {
  title: string;
  description: string;
  currentProgress: number;
  totalRequired: number;
  rewardXP: number;
  rewardBadge: string;
  endsAt: Date;
}

export const weeklyChallenge: WeeklyChallenge = {
  title: "Complete 5 Password Missions",
  description: "Test your password skills across 5 different difficulty levels!",
  currentProgress: 3,
  totalRequired: 5,
  rewardXP: 500,
  rewardBadge: "Password Master",
  endsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000), // 2 days, 7 hours from now
};

// ===========================
// Badge Data
// ===========================

export type BadgeRarity = "common" | "rare" | "epic" | "legendary";
export type BadgeCategory = "Beginner" | "Explorer" | "Hacker" | "Master" | "Legend";

export interface Badge {
  id: number;
  name: string;
  description: string;
  rarity: BadgeRarity;
  category: BadgeCategory;
  icon: string; // lucide icon name
  unlocked: boolean;
  earnedAt?: string;
  progress?: string;
}

export const allBadges: Badge[] = [
  // Beginner
  { id: 1, name: "First Login", description: "Welcome to CyberPaws!", rarity: "common", category: "Beginner", icon: "LogIn", unlocked: true, earnedAt: "Jan 15, 2025" },
  { id: 2, name: "Password Pro", description: "Complete the Password Quest tutorial", rarity: "common", category: "Beginner", icon: "Lock", unlocked: true, earnedAt: "Jan 16, 2025" },
  { id: 3, name: "First Mission", description: "Complete any mission for the first time", rarity: "common", category: "Beginner", icon: "Target", unlocked: true, earnedAt: "Jan 16, 2025" },
  { id: 4, name: "Terminal Newbie", description: "Use the Linux Terminal for the first time", rarity: "common", category: "Beginner", icon: "Terminal", unlocked: true, earnedAt: "Jan 17, 2025" },
  { id: 5, name: "Phishing Spotter", description: "Catch your first phishing email", rarity: "common", category: "Beginner", icon: "Mail", unlocked: true, earnedAt: "Jan 18, 2025" },
  { id: 6, name: "Profile Setup", description: "Customize your profile", rarity: "common", category: "Beginner", icon: "User", unlocked: true, earnedAt: "Jan 20, 2025" },
  { id: 7, name: "3-Day Streak", description: "Login 3 days in a row", rarity: "common", category: "Beginner", icon: "Flame", unlocked: true, earnedAt: "Jan 22, 2025" },
  { id: 8, name: "Team Player", description: "Join a team competition", rarity: "common", category: "Beginner", icon: "Users", unlocked: true, earnedAt: "Jan 25, 2025" },
  // Explorer
  { id: 9, name: "Game Explorer", description: "Try 5 different games", rarity: "rare", category: "Explorer", icon: "Gamepad2", unlocked: true, earnedAt: "Feb 1, 2025" },
  { id: 10, name: "Terminal Ninja", description: "Execute 20 terminal commands", rarity: "rare", category: "Explorer", icon: "Keyboard", unlocked: true, earnedAt: "Feb 5, 2025" },
  { id: 11, name: "Network Scout", description: "Complete the network map mission", rarity: "rare", category: "Explorer", icon: "Globe", unlocked: true, earnedAt: "Feb 8, 2025" },
  { id: 12, name: "Crypto Wizard", description: "Solve 10 encryption puzzles", rarity: "rare", category: "Explorer", icon: "Key", unlocked: true, earnedAt: "Feb 12, 2025" },
  { id: 13, name: "Speed Runner", description: "Complete a mission under 2 minutes", rarity: "rare", category: "Explorer", icon: "Zap", unlocked: true, earnedAt: "Feb 15, 2025" },
  { id: 14, name: "Perfect Score", description: "Get 100% on any mission", rarity: "rare", category: "Explorer", icon: "Star", unlocked: true, earnedAt: "Feb 18, 2025" },
  { id: 15, name: "Weekly Warrior", description: "Complete 3 weekly challenges", rarity: "rare", category: "Explorer", icon: "Calendar", unlocked: false, progress: "1/3" },
  { id: 16, name: "Firewall Builder", description: "Set up a firewall in the game", rarity: "rare", category: "Explorer", icon: "Shield", unlocked: false, progress: "0/1" },
  // Hacker
  { id: 17, name: "Malware Hunter", description: "Detect and remove 15 malware samples", rarity: "epic", category: "Hacker", icon: "Bug", unlocked: true, earnedAt: "Mar 1, 2025" },
  { id: 18, name: "SQL Master", description: "Complete all SQL Safari levels", rarity: "epic", category: "Hacker", icon: "Database", unlocked: true, earnedAt: "Mar 5, 2025" },
  { id: 19, name: "Bug Bounty", description: "Find 10 hidden bugs across games", rarity: "epic", category: "Hacker", icon: "Search", unlocked: true, earnedAt: "Mar 10, 2025" },
  { id: 20, name: "Social Engineer", description: "Complete all phishing levels", rarity: "epic", category: "Hacker", icon: "Eye", unlocked: false, progress: "8/10" },
  { id: 21, name: "Packet Analyzer", description: "Analyze 25 network packets", rarity: "epic", category: "Hacker", icon: "Wifi", unlocked: false, progress: "15/25" },
  { id: 22, name: "7-Day Streak", description: "Login 7 days in a row", rarity: "epic", category: "Hacker", icon: "Flame", unlocked: true, earnedAt: "Mar 15, 2025" },
  { id: 23, name: "Certificate Champ", description: "Complete the certificate puzzle", rarity: "epic", category: "Hacker", icon: "Award", unlocked: false, progress: "2/5" },
  { id: 24, name: "Cipher Breaker", description: "Decode all cipher types", rarity: "epic", category: "Hacker", icon: "Unlock", unlocked: false, progress: "3/8" },
  // Master
  { id: 25, name: "Firewall Master", description: "Master all firewall configurations", rarity: "legendary", category: "Master", icon: "ShieldCheck", unlocked: false, progress: "4/12" },
  { id: 26, name: "Night Owl", description: "Complete a mission after 10 PM", rarity: "legendary", category: "Master", icon: "Moon", unlocked: true, earnedAt: "Mar 20, 2025" },
  { id: 27, name: "Early Bird", description: "Complete a mission before 7 AM", rarity: "legendary", category: "Master", icon: "Sun", unlocked: false, progress: "0/1" },
  { id: 28, name: "Speed Demon", description: "Complete 10 missions under 1 minute", rarity: "legendary", category: "Master", icon: "Timer", unlocked: false, progress: "4/10" },
  { id: 29, name: "Streak Master", description: "Maintain a 14-day login streak", rarity: "legendary", category: "Master", icon: "Trophy", unlocked: false, progress: "10/14" },
  { id: 30, name: "All-Star", description: "Earn 5 perfect scores in a row", rarity: "legendary", category: "Master", icon: "Medal", unlocked: false, progress: "2/5" },
  { id: 31, name: "Helper", description: "Help 5 other players in chat", rarity: "legendary", category: "Master", icon: "Heart", unlocked: true, earnedAt: "Mar 22, 2025" },
  { id: 32, name: "Explorer Max", description: "Complete all Explorer badges", rarity: "legendary", category: "Master", icon: "Compass", unlocked: false, progress: "6/8" },
  // Legend
  { id: 33, name: "Legendary Hacker", description: "Reach Level 20", rarity: "legendary", category: "Legend", icon: "Crown", unlocked: false, progress: "12/20" },
  { id: 34, name: "Badge Collector", description: "Collect 30 badges", rarity: "legendary", category: "Legend", icon: "Bookmark", unlocked: false, progress: "18/30" },
  { id: 35, name: "Grand Master", description: "Complete all missions on Hard", rarity: "legendary", category: "Legend", icon: "Gem", unlocked: false, progress: "8/25" },
  { id: 36, name: "Cyber Guardian", description: "The ultimate achievement", rarity: "legendary", category: "Legend", icon: "Sparkles", unlocked: false, progress: "18/36" },
];

// ===========================
// Team Data
// ===========================

export interface Team {
  rank: number;
  name: string;
  color: string;
  members: number;
  totalXP: number;
  initial: string;
}

export const teamsData: Team[] = [
  { rank: 1, name: "Purple Hackers", color: "#7C3AED", members: 24, totalXP: 425000, initial: "P" },
  { rank: 2, name: "Pink Defenders", color: "#F472B6", members: 19, totalXP: 398000, initial: "D" },
  { rank: 3, name: "Green Guardians", color: "#4ADE80", members: 22, totalXP: 385000, initial: "G" },
  { rank: 4, name: "Blue Coders", color: "#60A5FA", members: 16, totalXP: 342000, initial: "B" },
  { rank: 5, name: "Orange Crushers", color: "#FB923C", members: 14, totalXP: 310000, initial: "O" },
];

// ===========================
// Profile Mock Data
// ===========================

export interface SkillData {
  name: string;
  value: number;
  color: string;
}

export const profileSkills: SkillData[] = [
  { name: "Password Security", value: 85, color: "#FACC15" },
  { name: "Phishing Detection", value: 70, color: "#60A5FA" },
  { name: "Network Skills", value: 55, color: "#F472B6" },
  { name: "Encryption", value: 60, color: "#7C3AED" },
  { name: "Malware Defense", value: 45, color: "#4ADE80" },
  { name: "Web Security", value: 50, color: "#F87171" },
];

export interface ActivityItem {
  id: number;
  action: string;
  detail: string;
  time: string;
  icon: string;
  color: string;
}

export const activityData: ActivityItem[] = [
  { id: 1, action: "Completed 'Password Quest'", detail: "+150 XP \u2022 Perfect Score!", time: "2 hours ago", icon: "CheckCircle", color: "#4ADE80" },
  { id: 2, action: "Earned 'Terminal Ninja' badge", detail: "Explorer achievement unlocked", time: "5 hours ago", icon: "Star", color: "#FACC15" },
  { id: 3, action: "Reached Level 12", detail: "3,450 XP total", time: "Yesterday", icon: "TrendingUp", color: "#7C3AED" },
  { id: 4, action: "Completed 'SQL Safari'", detail: "+120 XP", time: "Yesterday", icon: "Database", color: "#60A5FA" },
  { id: 5, action: "Started Weekly Challenge", detail: "1 / 5 progress", time: "2 days ago", icon: "Target", color: "#FB923C" },
  { id: 6, action: "7-day streak achieved!", detail: "Keep it going!", time: "2 days ago", icon: "Flame", color: "#F87171" },
  { id: 7, action: "Completed 'Firewall Defender'", detail: "+200 XP \u2022 Hard Mode", time: "3 days ago", icon: "Shield", color: "#4ADE80" },
  { id: 8, action: "Earned 'Malware Hunter' badge", detail: "Epic achievement!", time: "3 days ago", icon: "Bug", color: "#A78BFA" },
  { id: 9, action: "Helped a teammate", detail: "+50 XP \u2022 Social bonus", time: "4 days ago", icon: "Heart", color: "#F472B6" },
  { id: 10, action: "Completed 'Crypto Cat'", detail: "+180 XP", time: "4 days ago", icon: "Key", color: "#FACC15" },
  { id: 11, action: "Found a hidden easter egg", detail: "Secret area discovered!", time: "5 days ago", icon: "Search", color: "#22D3EE" },
  { id: 12, action: "Daily login bonus", detail: "+25 XP", time: "5 days ago", icon: "LogIn", color: "#7C3AED" },
  { id: 13, action: "Completed 'Network Navigator'", detail: "+140 XP \u2022 All nodes found", time: "6 days ago", icon: "Globe", color: "#60A5FA" },
  { id: 14, action: "Earned 'Speed Runner' badge", detail: "Completed in 1:24", time: "1 week ago", icon: "Zap", color: "#FACC15" },
  { id: 15, action: "Joined team 'Purple Hackers'", detail: "Team competition started", time: "1 week ago", icon: "Users", color: "#7C3AED" },
];

export interface MissionEntry {
  id: number;
  name: string;
  category: string;
  categoryColor: string;
  difficulty: number;
  score: number;
  xp: number;
  status: "completed" | "in-progress";
  date: string;
}

export const missionHistory: MissionEntry[] = [
  { id: 1, name: "Password Quest", category: "Passwords", categoryColor: "#FACC15", difficulty: 1, score: 100, xp: 150, status: "completed", date: "Mar 24, 2025" },
  { id: 2, name: "SQL Safari", category: "Databases", categoryColor: "#60A5FA", difficulty: 2, score: 95, xp: 120, status: "completed", date: "Mar 23, 2025" },
  { id: 3, name: "Firewall Defender", category: "Firewalls", categoryColor: "#F87171", difficulty: 3, score: 88, xp: 200, status: "completed", date: "Mar 22, 2025" },
  { id: 4, name: "Crypto Cat", category: "Encryption", categoryColor: "#7C3AED", difficulty: 2, score: 92, xp: 180, status: "completed", date: "Mar 21, 2025" },
  { id: 5, name: "Network Navigator", category: "Networking", categoryColor: "#F472B6", difficulty: 2, score: 85, xp: 140, status: "completed", date: "Mar 20, 2025" },
  { id: 6, name: "Phishing Detective", category: "Phishing", categoryColor: "#FB923C", difficulty: 1, score: 100, xp: 130, status: "completed", date: "Mar 19, 2025" },
  { id: 7, name: "Malware Hunter", category: "Malware", categoryColor: "#4ADE80", difficulty: 3, score: 78, xp: 220, status: "completed", date: "Mar 18, 2025" },
  { id: 8, name: "Cert Champion", category: "Certificates", categoryColor: "#A78BFA", difficulty: 2, score: 90, xp: 160, status: "completed", date: "Mar 17, 2025" },
  { id: 9, name: "Stego Spy", category: "Steganography", categoryColor: "#22D3EE", difficulty: 3, score: 72, xp: 190, status: "completed", date: "Mar 16, 2025" },
  { id: 10, name: "XSS Xpert", category: "Web Security", categoryColor: "#F472B6", difficulty: 2, score: 88, xp: 170, status: "completed", date: "Mar 15, 2025" },
  { id: 11, name: "Terminal Basics", category: "Terminal", categoryColor: "#4ADE80", difficulty: 1, score: 100, xp: 100, status: "completed", date: "Mar 14, 2025" },
  { id: 12, name: "Packet Tracer", category: "Networking", categoryColor: "#F472B6", difficulty: 2, score: 82, xp: 145, status: "completed", date: "Mar 13, 2025" },
  { id: 13, name: "Hash Cracker", category: "Encryption", categoryColor: "#7C3AED", difficulty: 3, score: 65, xp: 210, status: "completed", date: "Mar 12, 2025" },
  { id: 14, name: "Social Engineer", category: "Phishing", categoryColor: "#FB923C", difficulty: 2, score: 91, xp: 155, status: "completed", date: "Mar 11, 2025" },
  { id: 15, name: "Backup Master", category: "Data Safety", categoryColor: "#60A5FA", difficulty: 1, score: 100, xp: 110, status: "completed", date: "Mar 10, 2025" },
  { id: 16, name: "Port Scanner", category: "Networking", categoryColor: "#F472B6", difficulty: 2, score: 80, xp: 150, status: "completed", date: "Mar 9, 2025" },
  { id: 17, name: "Virus Vault", category: "Malware", categoryColor: "#4ADE80", difficulty: 3, score: 70, xp: 230, status: "completed", date: "Mar 8, 2025" },
  { id: 18, name: "Cookie Safe", category: "Web Security", categoryColor: "#F472B6", difficulty: 1, score: 100, xp: 125, status: "completed", date: "Mar 7, 2025" },
  { id: 19, name: "Binary Breaker", category: "Coding", categoryColor: "#A78BFA", difficulty: 3, score: 60, xp: 250, status: "completed", date: "Mar 6, 2025" },
  { id: 20, name: "PenTest Pro", category: "Pentesting", categoryColor: "#FACC15", difficulty: 3, score: 55, xp: 300, status: "completed", date: "Mar 5, 2025" },
  { id: 21, name: "Security Audit", category: "Audit", categoryColor: "#FB923C", difficulty: 2, score: 87, xp: 165, status: "completed", date: "Mar 4, 2025" },
  { id: 22, name: "Regex Racer", category: "Coding", categoryColor: "#A78BFA", difficulty: 2, score: 93, xp: 175, status: "completed", date: "Mar 3, 2025" },
  { id: 23, name: "Linux Legend", category: "Terminal", categoryColor: "#4ADE80", difficulty: 3, score: 75, xp: 200, status: "completed", date: "Mar 2, 2025" },
  { id: 24, name: "DNS Detective", category: "Networking", categoryColor: "#F472B6", difficulty: 2, score: 86, xp: 140, status: "completed", date: "Mar 1, 2025" },
  { id: 25, name: "Cipher King", category: "Encryption", categoryColor: "#7C3AED", difficulty: 3, score: 68, xp: 225, status: "in-progress", date: "Feb 28, 2025" },
];

export interface UserProfile {
  username: string;
  level: number;
  currentXP: number;
  xpForNextLevel: number;
  title: string;
  streak: number;
  gamesPlayed: number;
  missionsCompleted: number;
  totalXP: number;
  badgesEarned: number;
  totalBadges: number;
  globalRank: number;
  joinedDate: string;
  totalPlayTime: string;
  favoriteGame: string;
  strongestSkill: string;
}

export const userProfile: UserProfile = {
  username: "CyberKitty99",
  level: 12,
  currentXP: 3450,
  xpForNextLevel: 5000,
  title: "Junior Security Analyst",
  streak: 15,
  gamesPlayed: 47,
  missionsCompleted: 28,
  totalXP: 12450,
  badgesEarned: 18,
  totalBadges: 36,
  globalRank: 42,
  joinedDate: "January 15, 2025",
  totalPlayTime: "36h 45m",
  favoriteGame: "Password Quest",
  strongestSkill: "Password Security",
};
