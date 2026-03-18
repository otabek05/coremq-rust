import { Pagination } from "src/types/pagination";
import { Session } from "src/types/sessions";
import { api } from "./axios";
import { ApiResponse } from "src/types/api_response";


export async function fetchSessions(
  page = 0,
  size = 10,
  search = ""
): Promise<ApiResponse < Pagination<Session>>> {
  const res = await api.get<ApiResponse <Pagination<Session>>>("/api/v1/sessions", {
    params: { page, size, search },
  });
  return res.data;

}

export async function deleteSession(clientId: string) {
  await api.delete(`/api/v1/sessions/${clientId}`);
}