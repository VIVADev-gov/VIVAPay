"use client";

import React, { useEffect, useRef, useState } from "react";
import { Bell, Building2, ChevronDown, LogOut, Menu, Search, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import Logo from "@/components/logo/Logo";
import {
  DashboardHeaderNavDesktop,
  DashboardHeaderNavMobile,
} from "@/components/navegacion/DashboardHeaderNav";
import { useDashboardHeaderNav } from "@/hooks/useDashboardHeaderNav";
import { useLogout } from "@/hooks/useLogout";
import { getDashboardPathForRole } from "@/lib/auth/roles";
import { useAuthStore } from "@/store/auth/auth.store";

export interface NavSection {
    id: string;
    label: string;
    icon?: React.ElementType<{ size?: number; className?: string }>;
    condition?: boolean | (() => boolean);
    badge?: string | number;
    content?: React.ReactNode;
    component?: React.ComponentType<Record<string, unknown>>;
}

interface DashboardHeaderProps {
    title?: string;
    showSearch?: boolean;
    onSearchChange?: (value: string) => void;
    navSections?: NavSection[];
    onSectionChange?: (sectionId: string) => void;
    activeSection?: string;
    onMenuToggle?: () => void;
}

export default function DashboardHeader({
    title,
    showSearch = false,
    onSearchChange,
    navSections = [],
    onSectionChange,
    activeSection: activeSectionProp,
    onMenuToggle,
}: DashboardHeaderProps) {
    const user = useAuthStore((s) => s.user);
    const logout = useLogout();
    const { items: headerNavItems } = useDashboardHeaderNav();
    const [searchValue, setSearchValue] = useState("");
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [activeSection, setActiveSection] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const visibleSections = navSections.filter((section) => {
        if (section.condition === undefined) return true;
        if (typeof section.condition === "boolean") return section.condition;
        if (typeof section.condition === "function") return section.condition();
        return true;
    });

    useEffect(() => {
        if (activeSectionProp) {
            setActiveSection(activeSectionProp);
        }
    }, [activeSectionProp]);

    useEffect(() => {
        if (visibleSections.length > 0 && !activeSection) {
            const firstSection = visibleSections[0];
            setActiveSection(firstSection.id);
            onSectionChange?.(firstSection.id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: only run when sections count changes
    }, [visibleSections.length]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
        };

        if (showUserMenu) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showUserMenu]);

    const handleSectionClick = (sectionId: string) => {
        setActiveSection(sectionId);
        onSectionChange?.(sectionId);
    };

    const handleLogout = () => {
        setShowUserMenu(false);
        logout();
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchValue(value);
        onSearchChange?.(value);
    };

    const dashboardHome = getDashboardPathForRole(user?.role);

    const initials =
        (user?.name ?? "Usuario")
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join("") || "U";

    return (
        <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-card/85 backdrop-blur-md">
            <div className="mx-auto flex min-h-20 w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6 lg:px-8">
                <div className="flex min-w-0 items-center gap-3 md:gap-5">
                    {onMenuToggle ? (
                        <button
                            type="button"
                            onClick={onMenuToggle}
                            className="rounded-2xl border border-border/60 bg-background/70 p-3 text-muted-foreground transition hover:bg-muted hover:text-foreground md:hidden"
                            aria-label="Abrir menú de navegación"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                    ) : null}

                    <Link
                        href={dashboardHome}
                        className="flex items-center gap-3 rounded-2xl bg-background/80 px-3 py-2 shadow-sm transition hover:scale-[1.01] hover:bg-background md:hidden"
                    >
                        <Logo size="small" variant="default" alt="Vivapay" />
                    </Link>

                    {title && (
                        <div className="hidden min-w-0 md:block">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-1.5 rounded-full bg-linear-to-b from-primary to-ring" />
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                        VIVAPAY
                                    </p>
                                    <h1 className="truncate text-2xl font-black text-foreground">
                                        {title}
                                    </h1>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DashboardHeaderNavDesktop items={headerNavItems} />

                {showSearch && (
                    <div className="hidden max-w-lg flex-1 lg:flex">
                        <div className="group relative w-full">
                            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-ring" />
                            <input
                                type="text"
                                placeholder="Buscar..."
                                value={searchValue}
                                onChange={handleSearchChange}
                                className="w-full rounded-2xl border border-input bg-background/85 py-3 pl-12 pr-4 text-foreground shadow-sm transition-all placeholder:text-muted-foreground/60 hover:shadow-md focus:border-ring/50 focus:outline-none focus:ring-2 focus:ring-ring/50"
                            />
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <button
                        className="group relative rounded-2xl border border-border/60 bg-background/70 p-3 text-muted-foreground transition-all duration-200 hover:scale-105 hover:bg-muted hover:text-foreground"
                        aria-label="Notificaciones"
                    >
                        <Bell className="h-5 w-5 group-hover:animate-pulse" />
                        <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-card" />
                    </button>

                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-background/70 px-3 py-2 transition-all duration-200 hover:scale-[1.01] hover:bg-muted"
                        >
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-ring text-sm font-black text-primary-foreground shadow-md transition-shadow group-hover:shadow-lg">
                                {initials}
                            </div>
                            <div className="hidden max-w-44 text-left md:block">
                                <p className="text-sm font-semibold text-foreground">
                                    {user?.name ?? "Usuario"}
                                </p>
                                <p className="truncate text-xs font-medium text-muted-foreground">
                                    {user?.area ?? "Funcionario"}
                                </p>
                            </div>
                            <ChevronDown
                                className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${showUserMenu ? "rotate-180" : ""}`}
                            />
                        </button>

                        {showUserMenu && (
                            <div className="absolute right-0 z-50 mt-3 w-80 overflow-hidden rounded-3xl border border-border/60 bg-card shadow-2xl backdrop-blur-xl">
                                <div className="border-b border-border/60 bg-linear-to-r from-muted/50 to-transparent p-5">
                                    <div className="mb-4 flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-base font-black text-primary-foreground">
                                            {initials}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-bold text-foreground">
                                                {user?.name ?? "Usuario"}
                                            </p>
                                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                                {user?.email ?? ""}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid gap-2 text-xs">
                                        <div className="flex items-center gap-2 rounded-xl bg-background/70 px-3 py-2 text-muted-foreground">
                                            <Building2 className="h-4 w-4 text-primary" />
                                            <span>{user?.area ?? "Unidad no registrada"}</span>
                                        </div>
                                        <div className="flex items-center gap-2 rounded-xl bg-background/70 px-3 py-2 text-muted-foreground">
                                            <ShieldCheck className="h-4 w-4 text-primary" />
                                            <span className="capitalize">
                                                Rol: {user?.role?.toLowerCase() ?? "contratista"}
                                            </span>
                                            <span className="capitalize">
                                                Estado: {user?.status ?? "activo"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-2">
                                    <Link
                                        href="/dashboard/perfil"
                                        onClick={() => setShowUserMenu(false)}
                                        className="group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-foreground transition-all duration-200 hover:bg-muted"
                                    >
                                        <UserRound className="h-4 w-4 text-primary" />
                                        <span>Perfil</span>
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="group mt-1 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-destructive transition-all duration-200 hover:bg-destructive/10"
                                    >
                                        <LogOut className="h-4 w-4 transition-transform group-hover:rotate-12" />
                                        <span>Cerrar sesión</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <DashboardHeaderNavMobile items={headerNavItems} />

            {visibleSections.length > 0 && (
                <div className="border-t border-border/50 bg-muted/20 backdrop-blur-sm">
                    <nav className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-3 scrollbar-hide md:px-6 lg:px-8">
                        <div className="flex min-w-max items-center gap-3">
                            {visibleSections.map((section) => {
                                const Icon = section.icon;
                                const isActive = activeSection === section.id;

                                return (
                                    <button
                                        key={section.id}
                                        onClick={() => handleSectionClick(section.id)}
                                        className={`
                                            group relative flex cursor-pointer items-center gap-2.5 whitespace-nowrap rounded-2xl px-5 py-2.5 text-sm font-semibold
                                            transition-all duration-300
                                            ${isActive
                                                ? "scale-105 bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                                : "text-muted-foreground hover:bg-background/80 hover:text-foreground hover:shadow-sm"
                                            }
                                        `}
                                    >
                                        {Icon && (
                                            <Icon
                                                size={18}
                                                className={
                                                    isActive
                                                        ? "text-primary-foreground transition-all duration-300"
                                                        : "text-muted-foreground transition-all duration-300 group-hover:scale-110 group-hover:text-foreground"
                                                }
                                            />
                                        )}
                                        <span>{section.label}</span>
                                        {section.badge && (
                                            <span className={`
                                                ml-1.5 min-w-5 rounded-full px-2 py-0.5 text-center text-xs font-bold transition-all duration-300
                                                ${isActive
                                                    ? "bg-primary-foreground/20 text-primary-foreground ring-1 ring-primary-foreground/30"
                                                    : "bg-accent text-accent-foreground group-hover:scale-110"
                                                }
                                            `}>
                                                {section.badge}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
}
