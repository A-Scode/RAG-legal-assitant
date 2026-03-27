import { QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient({
    defaultOptions:{
        queries:{
            gcTime: 10 * 60 * 1000,
            retry:1,
            refetchOnWindowFocus:false,
            staleTime: 5 * 60 * 1000,
        }
    }
});

export default queryClient;