import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  state: string | null;
  city: string | null;
  occupation: string | null;
  details: string | null;
};

interface UserState {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState, [["zustand/persist", UserState]]>(
  persist(
    (set) => ({
      user: null,
      setUser: (user: User) => {
        set({ user });
      },
      clearUser: () => {
        set({ user: null });
      },
    }),
    {
      name: "user",
    }
  ),
);
