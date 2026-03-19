export type TlsConfig = {
    cert: string;
    key: string;
    ca?: string;
};

export type Listener = {
    name: string;
    protocol: string;
    host: string;
    port: number;
    tls?: TlsConfig;
};
