import { useMutation, useQuery } from "@tanstack/react-query";
import { endpoints } from "@/api/endpoints";
import { toast } from "sonner";

export const useCreateChatSession = () => {
  return useMutation({
    mutationFn: (title: string) => endpoints.createChatSession(title),
    onSuccess: () => {
      toast.success("Chat session created successfully");
    },
    onError: (error: any) => {
      console.error(error);
      toast.error(
        error.response?.data?.detail || "Failed to create chat session",
      );
    },
  });
};

export const useGetChatSessions = () => {
  return useQuery({
    queryKey: ["chat-sessions"],
    queryFn: () => endpoints.getChatSessions(),
  });
};

export const useUpdateChatSession = () => {
  return useMutation({
    mutationFn: ({ session_id, title }: { session_id: string; title: string }) => 
      endpoints.updateChatSession(session_id, title),
    onSuccess: () => {
      toast.success("Chat session updated successfully");
    },
    onError: (error: any) => {
      console.error(error);
      toast.error(
        error.response?.data?.detail || "Failed to update chat session",
      );
    },
  });
}

export const useDeleteChatSession = () => {
  return useMutation({
    mutationFn: (session_id: string) => endpoints.deleteChatSession(session_id),
    onSuccess: () => {
      toast.success("Chat session deleted successfully");
    },
    onError: (error: any) => {
      console.error(error);
      toast.error(
        error.response?.data?.detail || "Failed to delete chat session",
      );
    },
  });
}
