import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter, createContext } from "@isyadmin/api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function resolveSession(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    return {
      user: {
        id: (session.user as any).id,
        email: session.user.email!,
        name: session.user.name!,
        role: (session.user as any).role,
        tenantId: (session.user as any).tenantId,
      },
    };
  }
  return null;
}

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => {
      const session = await resolveSession(req);
      return createContext(session);
    },
    onError: ({ path, error }) => {
      console.error(`[tRPC] ${path ?? "unknown"}: ${error.message}`);
    },
  });

export { handler as GET, handler as POST };
