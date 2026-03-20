import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User { 
    username : string ;
    email : string ;
    name : string ;
}

interface AuthState {
  token: string | null;
  refresh : string | null;
  user : null | User , 
  isAuthenticated: boolean;
  setToken: (token: string , refresh : string) => void;
  removeToken: () => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  setUser : (user : User | null) => void;
}

export const useAuthStore = create<AuthState, [["zustand/persist", AuthState]]>(
  persist(
    (set) => ({
      token: null,
      isAuthenticated: false,
      user : null,
      refresh : null,
      setToken: (token: string , refresh : string) => set({ token , refresh , isAuthenticated: true }),
      removeToken: () => set({ token: null , refresh : null , isAuthenticated: false , user : null}),
      setIsAuthenticated: (isAuthenticated: boolean) => set({ isAuthenticated }),
      setUser : (user : User | null) => set({ user }),
    }),
    {
      name: "auth",
    },
  ),
);
