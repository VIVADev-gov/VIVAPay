"use client";

import { PrimeReactProvider } from "primereact/api";
import type { APIOptions } from "primereact/api";

const primeReactValue: Partial<APIOptions> = {
    appendTo: "self" as const,
};

export function PrimeProvider({ children }: { children: React.ReactNode }) {
    return (
        <PrimeReactProvider value={primeReactValue}>
            {children}
        </PrimeReactProvider>
    );
}
