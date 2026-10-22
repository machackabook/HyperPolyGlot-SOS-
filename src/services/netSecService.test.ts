import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { netSecService } from './netSecService';
import { sshService } from './sshService';

describe('Defensive Network Security & OpenWrt Gateway Subsystem', () => {
  test('Gateway status returns OpenWrt 23.05.3 and network interfaces', () => {
    const status = netSecService.getGatewayStatus();
    assert.equal(status.gatewayIp, '192.168.1.1');
    assert.match(status.model, /OpenWrt 23\.05\.3/);
    assert.match(status.kernel, /Linux 6\.1/);
    assert.ok(status.interfaces.length >= 4);
    assert.ok(status.dhcpClients.length >= 4);
  });

  test('Defensive audit produces >= 90 score across Kernel, Firewall, Wireless, and SSH', () => {
    const report = netSecService.runDefensiveAudit();
    assert.ok(report.securityScore >= 90);
    assert.equal(report.gatewayIp, '192.168.1.1');

    const categories = new Set(report.checks.map((c) => c.category));
    assert.ok(categories.has('KERNEL'));
    assert.ok(categories.has('FIREWALL'));
    assert.ok(categories.has('WIRELESS'));
    assert.ok(categories.has('SSH'));

    const syncookiesCheck = report.checks.find((c) => c.id === 'SYS-SYNCOOKIES');
    assert.ok(syncookiesCheck);
    assert.equal(syncookiesCheck.status, 'PASS');

    const wpa3Check = report.checks.find((c) => c.id === 'WIFI-WPA3-PMF');
    assert.ok(wpa3Check);
    assert.match(wpa3Check.value, /WPA3-SAE/);
  });

  test('Device quarantine and release workflow updates UCI firewall rules', () => {
    const targetIp = '192.168.1.105';
    assert.equal(netSecService.isQuarantined(targetIp), false);

    const quarantined = netSecService.quarantineDevice(targetIp);
    assert.equal(quarantined, true);
    assert.equal(netSecService.isQuarantined(targetIp), true);

    const uciConfig = netSecService.generateUciFirewallConfig();
    assert.match(uciConfig, /Quarantine-Compromised-Node/);
    assert.match(uciConfig, /option src_ip '192\.168\.1\.105'/);

    const released = netSecService.releaseDevice(targetIp);
    assert.equal(released, true);
    assert.equal(netSecService.isQuarantined(targetIp), false);
  });

  test('Kali Linux defensive toolchain inventory is accessible', () => {
    const toolchain = netSecService.getKaliToolchain();
    assert.ok(toolchain.length >= 4);
    const names = toolchain.map((t) => t.name);
    assert.ok(names.some((n) => n.includes('Suricata')));
    assert.ok(names.some((n) => n.includes('Wireshark')));
    assert.ok(names.some((n) => n.includes('Lynis')));
  });
});

describe('Persistent SSH Client & Gateway Administration Engine', () => {
  test('Creates and maintains persistent SSH sessions to OpenWrt gateway and Kali node', () => {
    const session = sshService.createSession('root@192.168.1.1:22');
    assert.ok(session.id.startsWith('ssh-192-168-1-1-22'));
    assert.equal(session.user, 'root');
    assert.equal(session.host, '192.168.1.1');
    assert.equal(session.port, 22);
    assert.equal(session.cipherSuite, 'chacha20-poly1305@openssh.com');
    assert.equal(session.status, 'CONNECTED');
  });

  test('Executes remote commands over established SSH session', () => {
    const session = sshService.createSession('root@192.168.1.1:22');
    
    // Test OpenWrt release check
    const releaseResult = sshService.executeRemoteCommand(session.id, 'cat /etc/openwrt_release');
    assert.equal(releaseResult.exitCode, 0);
    assert.match(releaseResult.stdout, /DISTRIB_ID='OpenWrt'/);

    // Test UCI firewall rules check
    const fwResult = sshService.executeRemoteCommand(session.id, 'uci show firewall');
    assert.equal(fwResult.exitCode, 0);
    assert.match(fwResult.stdout, /syn_flood='1'/);
    assert.match(fwResult.stdout, /zone\[0\]\.name='lan'/);

    // Test iptables -L
    const iptResult = sshService.executeRemoteCommand(session.id, 'iptables -L');
    assert.equal(iptResult.exitCode, 0);
    assert.match(iptResult.stdout, /Chain INPUT/);
  });

  test('Handles disconnection cleanly', () => {
    const session = sshService.createSession('kali@192.168.1.150:22');
    const disconnected = sshService.disconnect(session.id);
    assert.equal(disconnected, true);
    assert.equal(sshService.getSession(session.id), undefined);
  });
});
