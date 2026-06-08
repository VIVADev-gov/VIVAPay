"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader } from "@/components/loaders/loader";
import { useAuthStore } from "@/store/auth/auth.store";
import DashboardHeader, { NavSection } from "./DashboardHeader";

export interface DashboardLayoutProps {
    children: React.ReactNode;
    title?: string;
    showSearch?: boolean;
    onSearchChange?: (value: string) => void;
    navSections?: NavSection[];
    onSectionChange?: (sectionId: string) => void;
    activeSection?: string;
    className?: string;
}

export default function DashboardLayout({
    children,
    title,
    showSearch = false,
    onSearchChange,
    navSections = [],
    onSectionChange,
    activeSection,
    className = "",
}: DashboardLayoutProps) {
    const router = useRouter();
    const token = useAuthStore((s) => s.token);
    const user = useAuthStore((s) => s.user);
    const isHydrated = useAuthStore((s) => s.isHydrated);

    useEffect(() => {
        if (!isHydrated) return;
        if (!token || !user) {
            router.replace("/auth/login");
        }
    }, [isHydrated, router, token, user]);

    if (!isHydrated || !token || !user) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-background via-muted/40 to-background">
                <div className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-card p-8 text-card-foreground">
                    <Loader size="md" label="Validando sesión" />
                    <div className="text-center">
                        <p className="text-sm font-semibold text-foreground">Validando sesión</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Estamos preparando tu dashboard.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-background via-muted/30 to-background">
            <DashboardHeader
                title={title}
                showSearch={showSearch}
                onSearchChange={onSearchChange}
                navSections={navSections}
                onSectionChange={onSectionChange}
                activeSection={activeSection}
            />
            <main className={`mx-auto w-full max-w-7xl px-4 py-6 md:px-6 lg:px-8 ${className}`}>
                <div className="rounded-4xl border border-border/70 bg-card/80 p-5 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
