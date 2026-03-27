import axios from "axios";
import { useAuthStore } from "@/stores";
import { logout } from "@/lib/utils";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_BASE;

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response.status === 401) {
      axios
        .post("token/refresh/", { refresh: useAuthStore.getState().refresh })
        .then((response) => {
          useAuthStore
            .getState()
            .setToken(response.data.access, response.data.refresh);
        })
        .catch(() => {
          logout();
          toast.info("Session Expired , Please Login Again");
        });
    }
    return Promise.reject(error);
  },
);

export const endpoints = {
  login: (username: string, password: string) =>
    api.post("token/", { username, password }),
  register: (data: any) => api.post("register/", data),
  refresh: (refresh: string) => api.post("token/refresh/", { refresh }),
  profile: () => api.get("profile/"),
  updateProfile: (data: any) => api.put("profile/", data),
  forgotPassword: (email: string) => api.post("password-reset/", { email }),
  getOtp: (email: string, otp_type: "register" | "forget-password") =>
    api.post("otp/", { email, otp_type }),
  createChatSession: (title: string) =>
    api.post("chat-sessions/", { title }),
  getChatSessions: () => api.get("chat-sessions/"),
  deleteChatSession: (session_id: string) =>
    api.delete(`chat-sessions/${session_id}/`),
  updateChatSession: (session_id: string, title: string) =>
    api.put(`chat-sessions/${session_id}/`, { title }),
  getChatSession: (session_id: string) =>
    api.get(`chat-sessions/${session_id}/`),
};
