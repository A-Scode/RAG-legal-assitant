import { useMutation } from "@tanstack/react-query";
import { endpoints } from "@/api/endpoints";
import { useAuthStore } from "@/stores";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

export const useLogin = () => {
  const naviate = useNavigate();

  return useMutation({
    mutationFn: (data: { username: string; password: string }) =>
      endpoints.login(data.username, data.password),
    onSuccess: (data) => {
      useAuthStore.getState().setToken(data.data.access, data.data.refresh);
      toast.success("Logged in successfully");
      naviate({ to: "/app/chat" });
    },
    onError: (error) => {
      console.log(error);
      toast.error("Invalid credentials");
    },
  });
};
