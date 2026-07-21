"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { FamilyStoreProvider } from "@/context/FamilyStore";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <FamilyStoreProvider>{children}</FamilyStoreProvider>
    </SessionProvider>
  );
}
