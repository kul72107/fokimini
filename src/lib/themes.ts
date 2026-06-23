export interface TerminalTheme {
  id: string;
  name: string;
  bodyBg: string;
  textColor: string;
  promptColor: string;
  outputColor: string;
  errorColor: string;
  successColor: string;
  warningColor: string;
  pathColor: string;
  headerBg: string;
  cursorColor: string;
  fontFamily: string;
  fontSize: string;
  unlocked: boolean;
  unlockRequirement: string;
}

export const DEFAULT_THEMES: TerminalTheme[] = [
  {
    id: 'default',
    name: 'Midnight Purple',
    bodyBg: '#1a1a2e',
    textColor: '#F5F3FF',
    promptColor: '#4ADE80',
    outputColor: '#A78BFA',
    errorColor: '#F87171',
    successColor: '#4ADE80',
    warningColor: '#FACC15',
    pathColor: '#60A5FA',
    headerBg: '#3B0764',
    cursorColor: '#4ADE80',
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: '14px',
    unlocked: true,
    unlockRequirement: 'Unlocked by default',
  },
  {
    id: 'hacker',
    name: 'Cyber Green',
    bodyBg: '#0a0a0a',
    textColor: '#4ADE80',
    promptColor: '#22c55e',
    outputColor: '#4ADE80',
    errorColor: '#ef4444',
    successColor: '#22c55e',
    warningColor: '#eab308',
    pathColor: '#60A5FA',
    headerBg: '#000000',
    cursorColor: '#4ADE80',
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: '14px',
    unlocked: false,
    unlockRequirement: 'Complete Mission 3',
  },
  {
    id: 'sunset',
    name: 'Sunset Hacker',
    bodyBg: '#2d1b69',
    textColor: '#FDE68A',
    promptColor: '#FACC15',
    outputColor: '#FDE68A',
    errorColor: '#F87171',
    successColor: '#4ADE80',
    warningColor: '#FB923C',
    pathColor: '#93C5FD',
    headerBg: '#4c1d95',
    cursorColor: '#FACC15',
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: '14px',
    unlocked: false,
    unlockRequirement: 'Complete Mission 5',
  },
  {
    id: 'ocean',
    name: 'Ocean Blue',
    bodyBg: '#0c1e3e',
    textColor: '#BAE6FD',
    promptColor: '#22d3ee',
    outputColor: '#7DD3FC',
    errorColor: '#F87171',
    successColor: '#4ADE80',
    warningColor: '#FACC15',
    pathColor: '#C084FC',
    headerBg: '#0f3057',
    cursorColor: '#22d3ee',
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: '14px',
    unlocked: false,
    unlockRequirement: 'Complete Mission 7',
  },
  {
    id: 'cyberpaw',
    name: 'Rainbow Cat',
    bodyBg: '#3B0764',
    textColor: '#FFFFFF',
    promptColor: '#F472B6',
    outputColor: '#A78BFA',
    errorColor: '#F87171',
    successColor: '#4ADE80',
    warningColor: '#FACC15',
    pathColor: '#60A5FA',
    headerBg: '#5B21B6',
    cursorColor: '#F472B6',
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: '14px',
    unlocked: false,
    unlockRequirement: 'Complete all Missions',
  },
];

export function getThemeColors(theme: TerminalTheme) {
  return {
    '--term-body-bg': theme.bodyBg,
    '--term-text': theme.textColor,
    '--term-prompt': theme.promptColor,
    '--term-output': theme.outputColor,
    '--term-error': theme.errorColor,
    '--term-success': theme.successColor,
    '--term-warning': theme.warningColor,
    '--term-path': theme.pathColor,
    '--term-header-bg': theme.headerBg,
    '--term-cursor': theme.cursorColor,
  } as Record<string, string>;
}
