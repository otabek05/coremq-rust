import { create } from "zustand";
import type { TopicInfo } from "src/types/topics";
import { fetchTopics } from "src/services/topics";

type TopicState = {
  topics: TopicInfo[];
  totalSubscriptions: number;
  loading: boolean;
  error: string | null;
}

type TopicActions = {
  fetch: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const initialState: TopicState = {
  topics: [],
  totalSubscriptions: 0,
  loading: false,
  error: null,
};

export const useTopicStore = create<TopicState & TopicActions>((set) => ({
  ...initialState,

  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetchTopics();
      const list = res?.data ?? [];
      const total = list.reduce((sum, t) => sum + t.subscriber_count, 0);
      set({ topics: list, totalSubscriptions: total, loading: false });
    } catch (err: any) {
      set({ error: err?.message || "Failed to load topics", loading: false });
    }
  },

  clearError: () => set({ error: null }),
  reset: () => set(initialState),
}));

export const selectTopics = (s: TopicState & TopicActions) => s.topics;
export const selectTopicStats = (s: TopicState & TopicActions) => ({
  count: s.topics.length,
  totalSubscriptions: s.totalSubscriptions,
});
