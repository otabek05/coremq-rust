import { create } from 'zustand';
import type { Session } from 'src/types/sessions';
import { fetchSessions, deleteSession } from 'src/services/sessions';

/** State shape (data only) */
type SessionState = {
    sessions: Session[];
    page: number;
    size: number;
    totalPages: number;
    totalElements: number;
    loading: boolean;
    error: string | null;
};

/** Actions (functions only) */
type SessionActions = {
    fetch: (page?: number, size?: number, search?: string) => Promise<void>;
    disconnect: (clientId: string) => Promise<void>;
    setPage: (page: number) => void;
    setSize: (size: number) => void;
    clearError: () => void;
    reset: () => void;
};

const initialState: SessionState = {
    sessions: [],
    page: 0,
    size: 10,
    totalPages: 0,
    totalElements: 0,
    loading: false,
    error: null,
};

export const useSessionStore = create<SessionState & SessionActions>((set, get) => ({
    ...initialState,

    fetch: async (page?: number, size?: number, search?: string) => {
        const state = get();
        const p = page ?? state.page;
        const sz = size ?? state.size;
        set({ loading: true, error: null });
        try {
            const res = await fetchSessions(p, sz, search);
            set({
                sessions: res?.data?.content ?? [],
                page: res?.data?.page ?? 0,
                size: sz,
                totalPages: res?.data?.total_pages ?? 0,
                totalElements: res?.data?.total_elements ?? 0,
                loading: false,
            });
        } catch (err: any) {
            set({ error: err?.message || 'Failed to load sessions', loading: false });
        }
    },

    disconnect: async (clientId: string) => {
        try {
            await deleteSession(clientId);
            const { page, size } = get();
            await get().fetch(page, size);
        } catch (err: any) {
            set({ error: err?.message || 'Failed to disconnect client' });
        }
    },

    setPage: (page) => set({ page }),
    setSize: (size) => set({ size }),
    clearError: () => set({ error: null }),
    reset: () => set(initialState),
}));

/** Selectors — subscribe to only what you need to avoid re-renders */
export const selectSessions = (s: SessionState & SessionActions) => s.sessions;
export const selectSessionPagination = (s: SessionState & SessionActions) => ({
    page: s.page,
    size: s.size,
    totalPages: s.totalPages,
    totalElements: s.totalElements,
});
