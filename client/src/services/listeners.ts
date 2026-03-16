import type { Listener } from "src/types/listeners";
import { api } from "./axios";

export async function fetchListeners(): Promise<Listener[]> {
  const res = await api.get<Listener[]>("/api/v1/listeners");
  return res.data;
}

export async function stopListener(port: number): Promise<void> {
  await api.delete(`/api/v1/listeners/${port}`);
}
