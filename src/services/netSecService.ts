/** Evidence-only NetSec service. Unverified network and gateway data never appears as live. */
export interface OpenWrtFirewallRule {name:string;src?:string;dest?:string;target:'ACCEPT'|'DROP'|'REJECT';proto?:string;srcPort?:string;destPort?:string;enabled:boolean;}
export interface OpenWrtClientLease {ip:string;mac:string;hostname:string;interface:string;leaseExpires:string;isQuarantined:boolean;}
export interface SecurityAuditCheck {id:string;category:'KERNEL'|'FIREWALL'|'WIRELESS'|'SSH'|'DNS';title:string;status:'PASS'|'WARN'|'FAIL';value:string;recommendation?:string;}
export interface NetSecAuditReport {timestamp:string;gatewayIp:string;securityScore:number;checks:SecurityAuditCheck[];quarantinedIps:string[];totalDevices:number;sourceVerified:boolean;}
class NetSecService {
  getKaliToolchain(): Array<{name:string;status:string;category:string;description:string}> { return []; }
  runDefensiveAudit(): NetSecAuditReport {
    return {timestamp:new Date().toISOString(),gatewayIp:'NOT_CONNECTED',securityScore:0,
      checks:[{id:'LIVE-TELEMETRY',category:'SSH',title:'Authenticated gateway evidence',
      status:'WARN',value:'Not connected: no verifiable firewall, device or SSH telemetry exists.'}],
      quarantinedIps:[],totalDevices:0,sourceVerified:false};
  }
  getGatewayStatus() {
    return {gatewayIp:'NOT_CONNECTED',model:'UNVERIFIED',kernel:'UNVERIFIED',uptime:'UNVERIFIED',cpuLoad:'UNVERIFIED',
      memory:{totalMb:0,freeMb:0,cachedMb:0},interfaces:[] as Array<{name:string;ip?:string;ssid?:string;band?:string;enc?:string;type?:string;txBytes?:string;rxBytes?:string;status:string}>,
      firewallRules:[] as OpenWrtFirewallRule[],dhcpClients:[] as OpenWrtClientLease[],quarantinedCount:0};
  }
  quarantineDevice(_ip:string):boolean{return false;}
  releaseDevice(_ip:string):boolean{return false;}
  isQuarantined(_ip:string):boolean{return false;}
  generateUciFirewallConfig():string{
    throw new Error('GATEWAY_NOT_CONNECTED: No verified current UCI configuration is available. Nothing has been applied.');
  }
}
export const netSecService = new NetSecService();
