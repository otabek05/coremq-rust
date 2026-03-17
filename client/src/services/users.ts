import type { User, CreateUserRequest } from "src/types/users";
import type { ApiResponse } from "src/types/api_response";
import { api } from "./axios";

export async function fetchUsers(): Promise<ApiResponse<User[]>> {
  const res = await api.get<ApiResponse<User[]>>("/api/v1/users");
  return res.data;
}

export async function createUser(data: CreateUserRequest): Promise<ApiResponse<User>> {
  const res = await api.post<ApiResponse<User>>("/api/v1/users", data);
  return res.data;
}
