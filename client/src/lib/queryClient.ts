import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Set up headers
  let headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};

  // Add admin-id header for admin routes
  if (url.includes('/api/admin')) {
    try {
      const adminUserData = localStorage.getItem("adminUser");
      if (adminUserData) {
        const adminUser = JSON.parse(adminUserData);
        if (adminUser && adminUser.id) {
          headers["admin-id"] = adminUser.id.toString();
        }
      }
    } catch (error) {
      console.error("Error adding admin authentication:", error);
    }
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    // Set up headers for admin authentication
    let headers: Record<string, string> = {};

    // Add admin-id header for admin routes
    if (url.includes('/api/admin')) {
      try {
        const adminUserData = localStorage.getItem("adminUser");
        if (adminUserData) {
          const adminUser = JSON.parse(adminUserData);
          if (adminUser && adminUser.id) {
            headers["admin-id"] = adminUser.id.toString();
          }
        }
      } catch (error) {
        console.error("Error adding admin authentication:", error);
      }
    }

    const res = await fetch(url, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: 30000, // Refetch data every 30 seconds
      refetchOnWindowFocus: true, // Refetch when window is focused
      staleTime: 10000, // Data becomes stale after 10 seconds
      retry: 1,
      onError: (error) => {
        console.error('Query error:', error);
      },
    },
    mutations: {
      retry: false,
      // Automatically invalidate related queries after mutations
      onSuccess: () => {
        // This is a global success handler that gets called after every mutation
        // The specific invalidation logic is implemented in each component's mutation
      },
    },
  },
});