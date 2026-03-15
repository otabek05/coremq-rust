import { SignInRequest, Token } from "src/types/login";
import { api } from "./axios";
import { ApiResponse } from "src/types/api_response";

export async function signIn(signIn: SignInRequest): Promise<ApiResponse<Token>> {
  const res = await api.post<ApiResponse<Token>>("/api/v1/public/login", signIn);
  return res.data;
}