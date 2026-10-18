/**
 * Syntax Highlighting Service for HyperTerminal Polyglot Quine OS
 * Lexes, tokenizes, and color-codes command strings, flags, and arguments
 * based on their specific function within the custom OS environment.
 */

export type TokenType =
  | 'command-3d'
  | 'command-ai'
  | 'command-vfs'
  | 'command-core'
  | 'command-dev'
  | 'command-system'
  | 'command-unknown'
  | 'flag'
  | 'topology'
  | 'sentiment'
  | 'subcommand'
  | 'toggle'
  | 'path'
  | 'hexcolor'
  | 'number'
  | 'string'
  | 'operator'
  | 'argument'
  | 'whitespace';

export interface SyntaxToken {
  text: string;
  type: TokenType;
  colorClass: string;
  categoryLabel?: string;
  description?: string;
}

export interface SyntaxAnalysis {
  tokens: SyntaxToken[];
  primaryCommand?: string;
  commandCategory?: string;
  flags: string[];
  hasError: boolean;
  errorHint?: string;
}

// 1. Command Registries categorized by Custom OS subsystem
const COMMAND_SUBSYSTEMS = {
  '3d': new Set([
    'render',
    'topology',
    'color',
    'gravity',
    'speed',
    'turbulence',
    'burst',
    'calm',
    'shatter',
    'sentiment',
  ]),
  ai: new Set([
    'gemini',
    'ask',
    'ai',
    'voice',
    'speak',
    'mic',
    'listen',
    '963',
  ]),
  vfs: new Set([
    'ls',
    'cd',
    'pwd',
    'cat',
    'touch',
    'mkdir',
    'rm',
    'edit',
    'nano',
    'tree',
    'find',
    'grep',
    'vfs',
  ]),
  core: new Set([
    'satcom',
    'singularity',
    'swarm',
    'arbitrage',
    'voip',
    'mcp',
    'quine',
    'd3',
    'ping',
    'netstat',
    'curl',
    'fetch',
    'stream',
  ]),
  dev: new Set([
    'node',
    'js',
    'git',
    'macro',
  ]),
  system: new Set([
    'help',
    'clear',
    'uptime',
    'whoami',
    'date',
    'telemetry',
    'dock',
    'opacity',
    'canvas',
    'mode',
    'exit',
    'echo',
    'history',
    'contrast',
    'chromevox',
  ]),
};

// 2. Specialized OS values
const TOPOLOGIES = new Set([
  'torus',
  'tesseract',
  'singularity',
  'neural',
  'galaxy',
  'spindle',
  'dna',
  'mandala',
]);

const SENTIMENTS = new Set([
  'analytical',
  'energetic',
  'alarm',
  'tranquil',
  'cosmic',
  'chaos',
  'ethereal',
  'hyper',
  'melancholy',
  'dormant',
]);

const TOGGLES = new Set([
  'on',
  'off',
  'true',
  'false',
  'enable',
  'disable',
  'mute',
  'unmute',
]);

const SUBCOMMANDS = new Set([
  'status',
  'ping',
  'rebound',
  'evolve',
  'collapse',
  'scan',
  'reoptimize',
  'spawn',
  'record',
  'stop',
  'play',
  'list',
  'export',
  'reset',
  'bottom',
  'float',
  'fullscreen',
  'commit',
  'log',
  'diff',
  'push',
  'pull',
  'tune',
  'eval',
  'explain',
  'shape',
  'force',
  'streamgraph',
  'radar',
  'chord',
  'density',
  'profile',
  'sovereign',
  'quantum',
  'cyber',
  'tranquil',
  'palette',
  'panel',
]);

const OPERATORS = new Set(['|', '&&', '||', ';', '>', '>>', '<', '&']);

/**
 * Classifies a single token based on position, command context, and regex patterns
 */
function classifyToken(
  tokenText: string,
  indexInLine: number,
  isCommandPosition: boolean,
  currentCommand: string | null
): { type: TokenType; colorClass: string; categoryLabel?: string; description?: string } {
  // 1. Shell operators
  if (OPERATORS.has(tokenText)) {
    return {
      type: 'operator',
      colorClass: 'text-rose-500 font-extrabold',
      categoryLabel: 'OPERATOR',
      description: 'Pipeline control or redirect operator',
    };
  }

  // 2. Command position (first word or immediately following operator)
  if (isCommandPosition) {
    const lower = tokenText.toLowerCase();
    if (COMMAND_SUBSYSTEMS['3d'].has(lower)) {
      return {
        type: 'command-3d',
        colorClass: 'text-cyan-400 font-bold drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]',
        categoryLabel: '3D RENDER',
        description: 'Polymorphic 3D/4D visualizer directive',
      };
    }
    if (COMMAND_SUBSYSTEMS.ai.has(lower)) {
      return {
        type: 'command-ai',
        colorClass: 'text-fuchsia-400 font-bold drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]',
        categoryLabel: 'AI & VOICE',
        description: 'Neural intelligence & acoustic speech synthesis',
      };
    }
    if (COMMAND_SUBSYSTEMS.vfs.has(lower)) {
      return {
        type: 'command-vfs',
        colorClass: 'text-emerald-400 font-bold drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]',
        categoryLabel: 'VFS FILE',
        description: 'Virtual filesystem file & directory operation',
      };
    }
    if (COMMAND_SUBSYSTEMS.core.has(lower)) {
      return {
        type: 'command-core',
        colorClass: 'text-pink-400 font-bold drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]',
        categoryLabel: 'CORE SWARM',
        description: 'Autonomous cluster, SATCOM relay, or singularity module',
      };
    }
    if (COMMAND_SUBSYSTEMS.dev.has(lower)) {
      return {
        type: 'command-dev',
        colorClass: 'text-amber-400 font-bold drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]',
        categoryLabel: 'DEV EXEC',
        description: 'Sandboxed code execution or VCS engine',
      };
    }
    if (COMMAND_SUBSYSTEMS.system.has(lower)) {
      return {
        type: 'command-system',
        colorClass: 'text-sky-300 font-bold drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]',
        categoryLabel: 'SYS CONTROL',
        description: 'HyperTerminal operating system core instruction',
      };
    }

    return {
      type: 'command-unknown',
      colorClass: 'text-slate-200 underline decoration-amber-500/60 decoration-wavy',
      categoryLabel: 'UNREGISTERED',
      description: 'Command not recognized in custom OS catalog',
    };
  }

  // 3. Flags: -la, -f, --state, --verbose, etc.
  if (/^--?[a-zA-Z0-9_\-]+$/.test(tokenText)) {
    return {
      type: 'flag',
      colorClass: 'text-amber-300 font-semibold tracking-wide drop-shadow-[0_0_4px_rgba(252,211,77,0.4)]',
      categoryLabel: 'FLAG',
      description: 'System operational modifier or parameter flag',
    };
  }

  // 4. Hex color literals: #00f2ff, #a855f7
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(tokenText)) {
    return {
      type: 'hexcolor',
      colorClass: 'text-pink-300 font-mono font-semibold underline decoration-pink-500/50',
      categoryLabel: 'HEX COLOR',
      description: 'Custom chromatic RGB shader coordinate',
    };
  }

  // 5. Numerical values, frequencies, and decimals: 1.50, 432, 963, 0.066
  if (/^-?\d+(\.\d+)?(ms|hz|s|px|%)?$/i.test(tokenText)) {
    return {
      type: 'number',
      colorClass: 'text-yellow-300 font-mono font-medium',
      categoryLabel: 'VALUE',
      description: 'Numeric scalar, physics tensor, or frequency',
    };
  }

  // 6. Quoted string literals
  if (
    (tokenText.startsWith('"') && tokenText.endsWith('"') && tokenText.length >= 2) ||
    (tokenText.startsWith("'") && tokenText.endsWith("'") && tokenText.length >= 2) ||
    tokenText.startsWith('"') ||
    tokenText.startsWith("'")
  ) {
    return {
      type: 'string',
      colorClass: 'text-green-300 italic',
      categoryLabel: 'STRING',
      description: 'Quoted string literal payload',
    };
  }

  const lower = tokenText.toLowerCase();

  // 7. Topologies
  if (TOPOLOGIES.has(lower) || currentCommand === 'render' || currentCommand === 'topology') {
    if (TOPOLOGIES.has(lower)) {
      return {
        type: 'topology',
        colorClass: 'text-violet-300 font-semibold drop-shadow-[0_0_5px_rgba(196,181,253,0.5)]',
        categoryLabel: 'TOPOLOGY',
        description: 'Polymorphic 3D/4D visual geometry matrix',
      };
    }
  }

  // 8. Sentiments
  if (SENTIMENTS.has(lower) || currentCommand === 'sentiment') {
    if (SENTIMENTS.has(lower)) {
      return {
        type: 'sentiment',
        colorClass: 'text-rose-300 font-semibold drop-shadow-[0_0_5px_rgba(253,164,175,0.4)]',
        categoryLabel: 'SENTIMENT',
        description: 'Emotional neural environment modulation preset',
      };
    }
  }

  // 9. Toggles
  if (TOGGLES.has(lower)) {
    return {
      type: 'toggle',
      colorClass: 'text-teal-300 font-bold',
      categoryLabel: 'STATE',
      description: 'Binary hardware/audio execution state',
    };
  }

  // 10. Subcommands
  if (SUBCOMMANDS.has(lower)) {
    return {
      type: 'subcommand',
      colorClass: 'text-emerald-300 font-medium',
      categoryLabel: 'SUBCOMMAND',
      description: 'Targeted action verb within command domain',
    };
  }

  // 11. Paths and filenames: contains /, starts with ., or has file extension
  if (
    tokenText.includes('/') ||
    tokenText.startsWith('.') ||
    tokenText.startsWith('~') ||
    /\.(txt|md|js|json|sh|html|ts|png|svg)$/i.test(tokenText)
  ) {
    return {
      type: 'path',
      colorClass: 'text-cyan-200 underline decoration-cyan-500/40 decoration-dotted',
      categoryLabel: 'PATH / FILE',
      description: 'Virtual File System node path or target artifact',
    };
  }

  // 12. General Argument
  return {
    type: 'argument',
    colorClass: 'text-slate-100',
    categoryLabel: 'ARGUMENT',
    description: 'Command input parameter or expression',
  };
}

/**
 * Tokenizes a command line string into syntax highlighted tokens
 * preserving all whitespace, quotes, and punctuation.
 */
export function tokenizeCommandLine(input: string): SyntaxToken[] {
  if (!input) return [];

  const tokens: SyntaxToken[] = [];
  let i = 0;
  const len = input.length;
  let isCommandPos = true;
  let currentCmd: string | null = null;

  while (i < len) {
    const char = input[i];

    // 1. Whitespace block
    if (/\s/.test(char)) {
      let spaceStr = '';
      while (i < len && /\s/.test(input[i])) {
        spaceStr += input[i];
        i++;
      }
      tokens.push({
        text: spaceStr,
        type: 'whitespace',
        colorClass: '',
      });
      continue;
    }

    // 2. Operators (| && || ; > >> < &)
    if (OPERATORS.has(char) || (char === '&' && input[i + 1] === '&') || (char === '|' && input[i + 1] === '|')) {
      let op = char;
      if (
        (char === '&' && input[i + 1] === '&') ||
        (char === '|' && input[i + 1] === '|') ||
        (char === '>' && input[i + 1] === '>')
      ) {
        op += input[i + 1];
        i += 2;
      } else {
        i++;
      }
      const classified = classifyToken(op, tokens.length, false, currentCmd);
      tokens.push({
        text: op,
        ...classified,
      });
      // Next non-whitespace is a command position
      isCommandPos = true;
      currentCmd = null;
      continue;
    }

    // 3. Quoted strings (either '...' or "...")
    if (char === '"' || char === "'") {
      const quoteType = char;
      let str = quoteType;
      i++;
      while (i < len) {
        const c = input[i];
        str += c;
        if (c === '\\' && i + 1 < len) {
          str += input[i + 1];
          i += 2;
          continue;
        }
        if (c === quoteType) {
          i++;
          break;
        }
        i++;
      }
      const classified = classifyToken(str, tokens.length, isCommandPos, currentCmd);
      tokens.push({
        text: str,
        ...classified,
      });
      if (isCommandPos) {
        currentCmd = str.replace(/['"]/g, '');
        isCommandPos = false;
      }
      continue;
    }

    // 4. Standard word token (until space or operator or quote)
    let word = '';
    while (
      i < len &&
      !/\s/.test(input[i]) &&
      !OPERATORS.has(input[i]) &&
      input[i] !== '"' &&
      input[i] !== "'"
    ) {
      word += input[i];
      i++;
    }

    const classified = classifyToken(word, tokens.length, isCommandPos, currentCmd);
    tokens.push({
      text: word,
      ...classified,
    });

    if (isCommandPos) {
      currentCmd = word.toLowerCase();
      isCommandPos = false;
    }
  }

  return tokens;
}

/**
 * Analyzes the command line and returns structured syntax metrics
 */
export function analyzeCommandSyntax(input: string): SyntaxAnalysis {
  const tokens = tokenizeCommandLine(input);
  const words = tokens.filter((t) => t.type !== 'whitespace');

  let primaryCommand: string | undefined;
  let commandCategory: string | undefined;
  const flags: string[] = [];
  let hasError = false;
  let errorHint: string | undefined;

  for (const token of words) {
    if (token.type.startsWith('command-')) {
      if (!primaryCommand) {
        primaryCommand = token.text;
        commandCategory = token.categoryLabel;
        if (token.type === 'command-unknown') {
          hasError = true;
          errorHint = `Unknown command '${token.text}'. Type 'help' for available system instructions.`;
        }
      }
    } else if (token.type === 'flag') {
      flags.push(token.text);
    }
  }

  return {
    tokens,
    primaryCommand,
    commandCategory,
    flags,
    hasError,
    errorHint,
  };
}
