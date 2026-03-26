import { useMutation, useQuery } from "@tanstack/react-query";
import { endpoints } from "@/api/endpoints";
import { useAuthStore, useUserStore } from "@/stores";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

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

export const useGetUser = () => {
  const { setUser } = useUserStore();

  const { data, isSuccess, isError, error } = useQuery({
    queryKey: ["GetUser"],
    queryFn: () => endpoints.profile(),
  });

  useEffect(() => {
    if (isSuccess) {
      setUser(data.data);
    }
    if (isError) {
      toast.error(error.message);
    }
  }, [isSuccess, isError, error]);

  return { data, isSuccess, isError, error };
};
