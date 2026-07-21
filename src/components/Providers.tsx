"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { FamilyStoreProvider } from "@/context/FamilyStore";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider
      // Avoid long hangs if session fetch is slow on cellular / iPad
      refetchInterval={0}
      refetchOnWindowFocus={false}
    >
      <FamilyStoreProvider>{children}</FamilyStoreProvider>
    </SessionProvider>
  );
}
