export type TopicInfo = {
    topic: string;
    subscriber_count: number;
};

export type PublishRequest = {
    topic: string;
    payload: string;
    qos: number;
    retain: boolean;
};
