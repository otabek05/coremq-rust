import { ApiResponse } from "src/types/api_response";
import { TopicInfo, PublishRequest } from "src/types/topics";
import { api } from "./axios";

export async function fetchTopics(): Promise<ApiResponse<TopicInfo[]>> {
  const res = await api.get<ApiResponse<TopicInfo[]>>("/api/v1/topics");
  return res.data;
}

export async function publishMessage(request: PublishRequest): Promise<ApiResponse<string>> {
  const res = await api.post<ApiResponse<string>>("/api/v1/publish", request);
  return res.data;
}
