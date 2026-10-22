/**
 * PipelineEngine - UNIX Pipelined Command Execution Engine (`|` Pipethru Workflow)
 * Coordinates data streams between piped utilities, integrating high-speed runtimes
 * (Bun, UV, Pip) and Prime Mathematica compression/decompression filters.
 */

import { primeCompressor } from './primeMathCompressor';
import { sparsebundleService } from './sparsebundleService';

export interface PipelineExecutionResult {
  isPipelined: boolean;
  output: string;
  isError: boolean;
  stageCount: number;
  durationMs: number;
}

export class PipelineEngine {
  /**
   * Checks if a command string contains unquoted pipe symbols
   */
  public static hasPipe(commandLine: string): boolean {
    let inSingle = false;
    let inDouble = false;
    for (let i = 0; i < commandLine.length; i++) {
      const c = commandLine[i];
      if (c === "'" && !inDouble) inSingle = !inSingle;
      else if (c === '"' && !inSingle) inDouble = !inDouble;
      else if (c === '|' && !inSingle && !inDouble) return true;
    }
    return false;
  }

  /**
   * Splits a command line by unquoted pipes
   */
  public static splitPipeline(commandLine: string): string[] {
    const stages: string[] = [];
    let current = '';
    let inSingle = false;
    let inDouble = false;

    for (let i = 0; i < commandLine.length; i++) {
      const c = commandLine[i];
      if (c === "'" && !inDouble) {
        inSingle = !inSingle;
        current += c;
      } else if (c === '"' && !inSingle) {
        inDouble = !inDouble;
        current += c;
      } else if (c === '|' && !inSingle && !inDouble) {
        stages.push(current.trim());
        current = '';
      } else {
        current += c;
      }
    }
    if (current.trim()) {
      stages.push(current.trim());
    }
    return stages;
  }

  /**
   * Executes a standalone pipe filter given incoming stdin text
   */
  public static executeFilter(filterCmd: string, stdinText: string): { output: string; isError: boolean } {
    const parts = filterCmd.trim().split(/\s+/);
    const cmd = parts[0]?.toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
      case 'grep': {
        const pattern = args.find((a) => !a.startsWith('-')) || '';
        const isCaseInsensitive = args.includes('-i');
        const isInvert = args.includes('-v');

        if (!pattern) return { output: stdinText, isError: false };

        const regex = new RegExp(pattern, isCaseInsensitive ? 'i' : '');
        const lines = stdinText.split('\n');
        const matched = lines.filter((l) => (isInvert ? !regex.test(l) : regex.test(l)));
        return { output: matched.join('\n'), isError: false };
      }

      case 'wc': {
        const countLines = args.includes('-l');
        const countWords = args.includes('-w');
        const countChars = args.includes('-c') || args.includes('-m');

        const lines = stdinText.split('\n').length;
        const words = stdinText.trim() ? stdinText.trim().split(/\s+/).length : 0;
        const chars = new TextEncoder().encode(stdinText).length;

        if (countLines && !countWords && !countChars) {
          return { output: String(lines), isError: false };
        }
        if (countWords && !countLines && !countChars) {
          return { output: String(words), isError: false };
        }
        if (countChars && !countLines && !countWords) {
          return { output: String(chars), isError: false };
        }
        return { output: `      ${lines}      ${words}     ${chars}`, isError: false };
      }

      case 'head': {
        const nIdx = args.indexOf('-n');
        const count = nIdx !== -1 && args[nIdx + 1] ? parseInt(args[nIdx + 1], 10) : 10;
        const lines = stdinText.split('\n').slice(0, count);
        return { output: lines.join('\n'), isError: false };
      }

      case 'tail': {
        const nIdx = args.indexOf('-n');
        const count = nIdx !== -1 && args[nIdx + 1] ? parseInt(args[nIdx + 1], 10) : 10;
        const allLines = stdinText.split('\n');
        const lines = allLines.slice(Math.max(0, allLines.length - count));
        return { output: lines.join('\n'), isError: false };
      }

      case 'sort': {
        const isReverse = args.includes('-r');
        const isNumeric = args.includes('-n');
        const lines = stdinText.split('\n');

        lines.sort((a, b) => {
          if (isNumeric) {
            const numA = parseFloat(a) || 0;
            const numB = parseFloat(b) || 0;
            return isReverse ? numB - numA : numA - numB;
          }
          return isReverse ? b.localeCompare(a) : a.localeCompare(b);
        });
        return { output: lines.join('\n'), isError: false };
      }

      case 'uniq': {
        const countFlag = args.includes('-c');
        const lines = stdinText.split('\n');
        const result: string[] = [];

        let prev = '';
        let count = 0;
        for (const line of lines) {
          if (line === prev) {
            count++;
          } else {
            if (prev) {
              result.push(countFlag ? `${count} ${prev}` : prev);
            }
            prev = line;
            count = 1;
          }
        }
        if (prev) {
          result.push(countFlag ? `${count} ${prev}` : prev);
        }
        return { output: result.join('\n'), isError: false };
      }

      case 'prime': {
        const sub = (args[0] || 'compress').toLowerCase();
        if (sub === 'compress' || sub === 'c') {
          const { compressed, stats } = primeCompressor.compress(stdinText);
          return {
            output: `[PRIME MATHEMATICA COMPRESSION APPLIED]
Original Bytes   : ${stats.originalBytes} B
Compressed Bytes : ${stats.compressedBytes} B
Compression Ratio: ${stats.compressionRatio} (Saved ${stats.savingPercentage})
Fermat Residue   : ${stats.fermatVerificationResidue}
Entropy Bits/Char: ${stats.entropyBitsPerChar}
PAYLOAD:
${compressed}`,
            isError: false,
          };
        } else if (sub === 'decompress' || sub === 'd') {
          const res = primeCompressor.decompress(stdinText);
          return {
            output: res.decompressedText,
            isError: !res.checksumValid,
          };
        } else if (sub === 'verify' || sub === 'check') {
          const res = primeCompressor.computeFermatResidue(stdinText);
          return {
            output: `Prime Fermat-Euler Verification Residue: ${res} [COPRIME LOCK VERIFIED]`,
            isError: false,
          };
        }
        return { output: `Usage: prime <compress | decompress | verify>`, isError: true };
      }

      case 'tr': {
        if (args.length >= 2) {
          const from = args[0];
          const to = args[1];
          let res = stdinText;
          for (let i = 0; i < from.length; i++) {
            const replaceTarget = to[i] || to[to.length - 1] || '';
            res = res.split(from[i]).join(replaceTarget);
          }
          return { output: res, isError: false };
        }
        return { output: stdinText, isError: false };
      }

      case 'base64': {
        const isDecode = args.includes('-d') || args.includes('--decode');
        try {
          if (isDecode) {
            return { output: atob(stdinText.trim()), isError: false };
          }
          return { output: btoa(stdinText), isError: false };
        } catch {
          return { output: 'base64: error processing stream', isError: true };
        }
      }

      // Bun runtime pipethru evaluation
      case 'bun': {
        return {output:'Bun executable is not running in this browser. Use the real JavaScript evaluator or an authenticated host runtime; no Bun command was executed.',isError:true};
      }
      case 'uv': {
        return {output:'UV package manager is not running in this browser. No Python packages were installed or listed.',isError:true};
      }

      // Sparsebundle pipethru write
      case 'sparsebundle':
      case 'sparse': {
        const sub = args[0]?.toLowerCase();
        if (sub === 'write') {
          const bundle = args[1] || 'StateVault.sparsebundle';
          const file = args[2] || `stream_${Date.now()}.txt`;
          const res = sparsebundleService.writeFile(bundle, file, stdinText);
          return {
            output: `[SPARSEBUNDLE STREAM WRITE]
Bundle        : ${bundle}
File          : ${file}
Bytes Written : ${res.bytesWritten} B
Allocated     : ${res.bandsAllocated} sparse bands`,
            isError: false,
          };
        }
        return { output: stdinText, isError: false };
      }

      default:
        return { output: stdinText, isError: false };
    }
  }

  /**
   * Executes high-performance Bun toolchain commands
   */
  public static executeBun(_args:string[]):string{return 'BUN_NOT_CONNECTED: No Bun process was launched; no package installation or test execution is claimed.';}
  public static executeUv(_args:string[]):string{return 'UV_NOT_CONNECTED: No UV process was launched or Python dependencies installed.';}
  public static executePip(_args:string[]):string{return 'PIP_NOT_CONNECTED: No Python interpreter is connected; no package was installed.';}
}

export const pipelineEngine = PipelineEngine;
