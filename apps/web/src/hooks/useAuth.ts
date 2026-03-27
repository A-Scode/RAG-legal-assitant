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

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (email: string) => endpoints.forgotPassword(email),
    onSuccess: () => {
      toast.success("Password reset link sent to your email");
    },
    onError: (error: any) => {
      console.error(error);
      toast.error(error.response?.data?.detail || "Failed to send reset link");
    },
  });
};


export const useRegister = () => {
  return useMutation({
    mutationFn: (data: any) => endpoints.register(data),
    onSuccess: () => {
      toast.success("Registered successfully");
    },
    onError: (error: any) => {
      console.error(error);
      toast.error(error.response?.data?.detail || "Failed to register");
    },
  });
};

export const useGetOtp = () => {
  return useMutation({
    mutationFn: (data: { email: string; otp_type: "register" | "forget-password" }) =>
      endpoints.getOtp(data.email, data.otp_type),
    onSuccess: () => {
      toast.success("OTP sent to your email");
    },
    onError: (error: any) => {
      console.error(error);
      toast.error(error.response?.data?.detail || "Failed to send OTP");
    },
  });
};

