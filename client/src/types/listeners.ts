export interface TlsConfig {
  cert: string;
  key: string;
  ca?: string;
}

export interface Listener {
  name: string;
  protocol: string;
  host: string;
  port: number;
  tls?: TlsConfig;
}
