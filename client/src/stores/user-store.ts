import { create } from "zustand";
import type { User, CreateUserRequest } from "src/types/users";
import { fetchUsers, createUser } from "src/services/users";

type UserState = {
  users: User[];
  loading: boolean;
  error: string | null;
}

type UserActions = {
  fetch: () => Promise<void>;
  create: (data: CreateUserRequest) => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

const initialState: UserState = {
  users: [],
  loading: false,
  error: null,
};

export const useUserStore = create<UserState & UserActions>((set, get) => ({
  ...initialState,

  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetchUsers();
      set({ users: res?.data ?? [], loading: false });
    } catch (err: any) {
      set({ error: err?.message || "Failed to load users", loading: false });
    }
  },

  create: async (data: CreateUserRequest) => {
    try {
      await createUser(data);
      await get().fetch();
      return true;
    } catch (err: any) {
      set({ error: err?.message || "Failed to create user" });
      return false;
    }
  },

  clearError: () => set({ error: null }),
  reset: () => set(initialState),
}));

export const selectUsers = (s: UserState & UserActions) => s.users;
