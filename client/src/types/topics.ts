export interface TopicInfo {
  topic: string;
  subscriber_count: number;
}

export interface PublishRequest {
  topic: string;
  payload: string;
  qos: number;
  retain: boolean;
}
