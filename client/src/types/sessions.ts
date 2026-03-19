export type Session = {
  client_id: string;
  username: string;
  clean_session: boolean;
  remote_addr: string;
  connected_port: number;
  connected_at: string;
  subscriptions: Record<string, any>;
};
