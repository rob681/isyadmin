import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "@isyadmin/db";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Credenciales requeridas");
        }

        const user = await db.user.findFirst({
          where: { email: credentials.email, isActive: true },
          include: {
            tenant: { select: { id: true, isActive: true, type: true, planTier: true } },
          },
        });

        if (!user) {
          throw new Error("Credenciales inválidas");
        }

        if (!user.tenant.isActive) {
          throw new Error("Tu cuenta ha sido desactivada.");
        }

        if (!user.passwordHash) {
          throw new Error("Debes configurar tu contraseña primero.");
        }

        const isValid = await compare(credentials.password, user.passwordHash);
        if (!isValid) {
          throw new Error("Credenciales inválidas");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatarUrl,
          tenantId: user.tenantId,
          tenantType: user.tenant.type,
          planTier: user.tenant.planTier,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.avatarUrl = (user as any).avatarUrl;
        token.tenantId = (user as any).tenantId;
        token.tenantType = (user as any).tenantType;
        token.planTier = (user as any).planTier;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).avatarUrl = token.avatarUrl;
        (session.user as any).tenantId = token.tenantId;
        (session.user as any).tenantType = token.tenantType;
        (session.user as any).planTier = token.planTier;
      }
      return session;
    },
  },
};
