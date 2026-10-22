import {test} from 'node:test';
import assert from 'node:assert/strict';
import {netSecService} from './netSecService.ts';
import {sshService} from './sshService.ts';
test('no invented live gateway or network audit',()=>{
 const audit=netSecService.runDefensiveAudit();assert.equal(audit.sourceVerified,false);
 assert.equal(audit.checks.some(c=>c.status==='PASS'),false);
 assert.equal(netSecService.getGatewayStatus().dhcpClients.length,0);
 assert.equal(netSecService.getKaliToolchain().length,0);
 assert.equal(netSecService.quarantineDevice('192.168.1.105'),false);
 assert.throws(()=>netSecService.generateUciFirewallConfig(),/NOT_CONNECTED/);
});
test('no fabricated SSH connection or remote output',()=>{
 assert.equal(sshService.getSessions().length,0);
 assert.throws(()=>sshService.createSession('root@192.168.1.1:22'),/NOT_CONNECTED/);
 const result=sshService.executeRemoteCommand('root@192.168.1.1:22','uname -a');
 assert.equal(result.exitCode,255);assert.equal(result.stdout,'');
 assert.match(result.stderr,/NOT_CONNECTED/);
});
