import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserState {
  
}

export const useUserStore = create<UserState, [["zustand/persist", UserState]]>(
  persist(
    (set) => ({
    }),
    {
      name: "user",
    },
  ),
);
