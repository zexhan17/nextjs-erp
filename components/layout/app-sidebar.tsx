"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarRail,
} from "@/components/ui/sidebar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { navigationConfig } from "@/lib/config/navigation";
import type { ModuleCode, SessionUser } from "@/lib/types";
import { logoutAction } from "@/app/(auth)/actions";
import { switchCompanyAction } from "@/lib/actions/company.actions";
import {
    LayoutDashboard, Users, Target, ShoppingCart, PackageCheck, Package, Warehouse,
    Factory, CheckCircle, Calculator, Monitor, UserCog, FolderKanban, LifeBuoy,
    Building, Wrench, Car, FileText, BarChart3, RefreshCw, Settings, ChevronDown,
    ChevronsUpDown, LogOut, Building2, Plus,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import React from "react";

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    LayoutDashboard, Users, Target, ShoppingCart, PackageCheck, Package, Warehouse,
    Factory, CheckCircle, Calculator, Monitor, UserCog, FolderKanban, LifeBuoy,
    Building, Wrench, Car, FileText, BarChart3, RefreshCw, Settings, Building2,
};

function getIcon(name: string) {
    return iconMap[name] || Package;
}

interface AppSidebarProps {
    user: SessionUser;
    enabledModules: ModuleCode[];
}

export function AppSidebar({ user, enabledModules }: AppSidebarProps) {
    const pathname = usePathname();

    // Filter nav items based on enabled modules
    const filteredGroups = navigationConfig
        .map((group) => ({
            ...group,
            items: group.items.filter(
                (item) => !item.module || enabledModules.includes(item.module)
            ),
        }))
        .filter((group) => group.items.length > 0);

    return (
        <Sidebar collapsible="icon" variant="sidebar">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
                                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
                                        {user.activeCompanyName?.charAt(0)?.toUpperCase() || "N"}
                                    </div>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">
                                            {user.activeCompanyName || "No Company"}
                                        </span>
                                        <span className="truncate text-xs text-muted-foreground">
                                            Enterprise
                                        </span>
                                    </div>
                                    <ChevronsUpDown className="ml-auto size-4" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
                                align="start"
                                side="bottom"
                                sideOffset={4}
                            >
                                <DropdownMenuLabel className="text-xs text-muted-foreground">
                                    Companies
                                </DropdownMenuLabel>
                                {user.companies.map((company) => (
                                    <DropdownMenuItem
                                        key={company.id}
                                        onClick={() => switchCompanyAction(company.id)}
                                        className="gap-2 p-2"
                                    >
                                        <div className="flex size-6 items-center justify-center rounded-sm bg-primary/10 text-xs font-bold">
                                            {company.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="truncate">{company.name}</span>
                                        {company.id === user.activeCompanyId && (
                                            <span className="ml-auto text-xs text-muted-foreground">Active</span>
                                        )}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {filteredGroups.map((group) => (
                    <SidebarGroup key={group.label}>
                        <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {group.items.map((item) => {
                                    const Icon = getIcon(item.icon);
                                    const isActive =
                                        pathname === item.href ||
                                        pathname.startsWith(item.href + "/");

                                    // determine if any child is active so we can open the collapsible by default
                                    const hasActiveChild =
                                        item.children?.some(
                                            (c) =>
                                                pathname === c.href ||
                                                pathname.startsWith(c.href + "/")
                                        );

                                    if (item.children && item.children.length > 0) {
                                        return (
                                            <SidebarMenuItem key={item.href}>
                                                {/* Use Radix Collapsible to hide/show the submenu */}
                                                <Collapsible defaultOpen={isActive || hasActiveChild}>
                                                    <div className="relative flex w-full items-center">
                                                        <CollapsibleTrigger asChild>
                                                            <SidebarMenuButton
                                                                asChild
                                                                isActive={isActive || hasActiveChild}
                                                                tooltip={item.title}
                                                            >
                                                                {/* clicking the main label still navigates to the first child
                                                                    or the item's own href */}
                                                                <Link
                                                                    href={
                                                                        item.children[0]?.href || item.href
                                                                    }
                                                                    className="flex w-full items-center gap-2"
                                                                >
                                                                    <Icon className="size-4" />
                                                                    <span>{item.title}</span>
                                                                </Link>
                                                            </SidebarMenuButton>
                                                        </CollapsibleTrigger>

                                                        {/* arrow button toggles the collapsible */}
                                                        <CollapsibleTrigger asChild>
                                                            <button
                                                                className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-transform data-[state=open]:rotate-180 group-data-[collapsible=icon]:hidden"
                                                                aria-label="Expand submenu"
                                                            >
                                                                <ChevronDown className="size-4" />
                                                            </button>
                                                        </CollapsibleTrigger>
                                                    </div>

                                                    <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                                                        <SidebarMenuSub>
                                                            {item.children.map((child) => {
                                                                const isChildActive =
                                                                    pathname === child.href ||
                                                                    pathname.startsWith(child.href + "/");
                                                                return (
                                                                    <SidebarMenuSubItem
                                                                        key={child.href}
                                                                    >
                                                                        <SidebarMenuSubButton
                                                                            asChild
                                                                            isActive={isChildActive}
                                                                        >
                                                                            <Link href={child.href}>
                                                                                <span>{child.title}</span>
                                                                            </Link>
                                                                        </SidebarMenuSubButton>
                                                                    </SidebarMenuSubItem>
                                                                );
                                                            })}
                                                        </SidebarMenuSub>
                                                    </CollapsibleContent>
                                                </Collapsible>
                                            </SidebarMenuItem>
                                        );
                                    }

                                    return (
                                        <SidebarMenuItem key={item.href}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={isActive}
                                                tooltip={item.title}
                                            >
                                                <Link href={item.href}>
                                                    <Icon className="size-4" />
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
                                    <Avatar className="size-8">
                                        <AvatarFallback className="text-xs">
                                            {user.name
                                                .split(" ")
                                                .map((n) => n[0])
                                                .join("")
                                                .toUpperCase()
                                                .slice(0, 2)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">{user.name}</span>
                                        <span className="truncate text-xs text-muted-foreground">
                                            {user.email}
                                        </span>
                                    </div>
                                    <ChevronsUpDown className="ml-auto size-4" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
                                side="bottom"
                                align="end"
                                sideOffset={4}
                            >
                                <DropdownMenuLabel className="p-0 font-normal">
                                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                        <Avatar className="size-8">
                                            <AvatarFallback className="text-xs">
                                                {user.name
                                                    .split(" ")
                                                    .map((n) => n[0])
                                                    .join("")
                                                    .toUpperCase()
                                                    .slice(0, 2)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="grid flex-1 text-left text-sm leading-tight">
                                            <span className="truncate font-semibold">{user.name}</span>
                                            <span className="truncate text-xs text-muted-foreground">
                                                {user.email}
                                            </span>
                                        </div>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/settings/company">
                                        <Settings className="mr-2 size-4" />
                                        Settings
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => logoutAction()}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <LogOut className="mr-2 size-4" />
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
