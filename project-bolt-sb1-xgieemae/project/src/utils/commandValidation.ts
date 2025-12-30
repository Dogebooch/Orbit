const DANGEROUS_COMMANDS = [
  'rm -rf /',
  'rm -rf *',
  'rm -rf ~',
  'rm -rf /*',
  'rm -rf ./',
  'rm -rf ../',
  ':(){:|:&};:',
  'mkfs',
  'dd if=/dev/zero',
  'dd if=/dev/random',
  'mv /* /dev/null',
  'chmod -R 777 /',
  'wget',
  'curl',
  '> /dev/sda',
  'cat /dev/urandom',
];

const DANGEROUS_PATTERNS = [
  /rm\s+-rf\s+[/~*]/,
  /rm\s+-fr\s+[/~*]/,
  /sudo\s+rm\s+-rf/,
  /mkfs\./,
  /dd\s+if=/,
  />\s*\/dev\/sd/,
  /chmod\s+-R\s+777\s+\//,
  /mv\s+\/.*\s+\/dev\/null/,
  /fork.*bomb/i,
  /:\(\)\{.*\|\:.*\}/,
];

const SUDO_COMMANDS = [
  'sudo',
  'su',
  'doas',
];

export interface ValidationResult {
  isValid: boolean;
  isDangerous: boolean;
  needsConfirmation: boolean;
  warningMessage?: string;
  category?: 'dangerous' | 'elevated' | 'destructive' | 'safe';
}

export function validateCommand(command: string): ValidationResult {
  const trimmedCommand = command.trim().toLowerCase();

  if (!trimmedCommand) {
    return { isValid: false, isDangerous: false, needsConfirmation: false };
  }

  for (const dangerous of DANGEROUS_COMMANDS) {
    if (trimmedCommand.includes(dangerous.toLowerCase())) {
      return {
        isValid: false,
        isDangerous: true,
        needsConfirmation: false,
        warningMessage: 'This command is potentially destructive and has been blocked for safety.',
        category: 'dangerous',
      };
    }
  }

  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(trimmedCommand)) {
      return {
        isValid: false,
        isDangerous: true,
        needsConfirmation: false,
        warningMessage: 'This command pattern is potentially destructive and has been blocked for safety.',
        category: 'dangerous',
      };
    }
  }

  for (const sudoCmd of SUDO_COMMANDS) {
    if (trimmedCommand.startsWith(sudoCmd)) {
      return {
        isValid: true,
        isDangerous: false,
        needsConfirmation: true,
        warningMessage: 'This command requires elevated privileges. Make sure you understand what it does.',
        category: 'elevated',
      };
    }
  }

  if (
    trimmedCommand.startsWith('rm ') ||
    trimmedCommand.startsWith('del ') ||
    trimmedCommand.startsWith('rmdir ')
  ) {
    return {
      isValid: true,
      isDangerous: false,
      needsConfirmation: true,
      warningMessage: 'This command will delete files or directories. Proceed with caution.',
      category: 'destructive',
    };
  }

  if (
    trimmedCommand.includes('format') ||
    trimmedCommand.includes('fdisk') ||
    trimmedCommand.includes('parted')
  ) {
    return {
      isValid: true,
      isDangerous: false,
      needsConfirmation: true,
      warningMessage: 'This command can modify disk partitions. Proceed with extreme caution.',
      category: 'destructive',
    };
  }

  return {
    isValid: true,
    isDangerous: false,
    needsConfirmation: false,
    category: 'safe',
  };
}

export function sanitizeCommand(command: string): string {
  return command.trim().replace(/[;&|`$()]/g, '');
}

export function parseCommand(command: string): { cmd: string; args: string[] } {
  const parts = command.trim().split(/\s+/);
  return {
    cmd: parts[0] || '',
    args: parts.slice(1),
  };
}
