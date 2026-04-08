import { db } from "@isyadmin/db";

export interface Session {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    tenantId?: string;
    avatarUrl?: string;
  };
}

export interface Context {
  db: typeof db;
  session: Session | null;
}

export function createContext(session: Session | null): Context {
  return { db, session };
}
