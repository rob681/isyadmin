import { appRouter, createContext } from "@isyadmin/api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function createServerCaller() {
  const session = await getServerSession(authOptions);

  const ctx = createContext(
    session?.user
      ? {
          user: {
            id: (session.user as any).id,
            email: session.user.email!,
            name: session.user.name!,
            role: (session.user as any).role,
            tenantId: (session.user as any).tenantId,
          },
        }
      : null
  );

  return appRouter.createCaller(ctx);
}
