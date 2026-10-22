/** Real SSH truth boundary. Never fabricate a TCP handshake, command, latency, or output. */
export interface SshSession {
  id:string; target:string; user:string; host:string; port:number;
  cipherSuite:string; kexAlgorithm:string; connectedAt:number;
  lastKeepalive:number; latencyMs:number;
  status:'CONNECTED'|'RECONNECTING'|'CLOSED'; identityKey:string;
}
export interface SshCommandResult {
  sessionId:string; command:string; exitCode:number;
  stdout:string; stderr:string; durationMs:number;
}
class SshService {
  getSessions(): SshSession[] { return []; }
  getSession(_id:string): SshSession | undefined { return undefined; }
  createSession(_target:string,_identityKey='id_ed25519'): SshSession {
    throw new Error('SSH_NOT_CONNECTED: A real authenticated SSH bridge and an authorized device connection are required. No session was opened.');
  }
  disconnect(_idOrTarget:string): boolean { return false; }
  executeRemoteCommand(sessionIdOrTarget:string,cmd:string): SshCommandResult {
    return {sessionId:sessionIdOrTarget,command:cmd,exitCode:255,stdout:'',
      stderr:'SSH_NOT_CONNECTED: No authenticated remote session or verified command receipt is available.',
      durationMs:0};
  }
}
export const sshService = new SshService();
