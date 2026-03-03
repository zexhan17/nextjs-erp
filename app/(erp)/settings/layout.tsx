"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Building, Users, Shield, Puzzle, FileText } from "lucide-react";

const settingsNav = [
    { title: "Company", href: "/settings/company", icon: Building },
    { title: "Users", href: "/settings/users", icon: Users },
    { title: "Roles", href: "/settings/roles", icon: Shield },
    { title: "Modules", href: "/settings/modules", icon: Puzzle },
    // documentation lives outside the ERP app but we surface it here as an external link
    { title: "Docs", href: "/docs", icon: FileText, external: true },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                <p className="text-sm text-muted-foreground">
                    Manage your company settings, users, roles, and modules.
                </p>
            </div>
            <div className="flex flex-col gap-6 md:flex-row">
                <nav className="flex md:w-48 md:flex-col gap-1">
                    {settingsNav.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        if (item.external) {
                            // open docs in new tab
                            return (
                                <a
                                    key={item.href}
                                    href={item.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cn(
                                        "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                        "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <Icon className="size-4" />
                                    {item.title}
                                </a>
                            );
                        }
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <Icon className="size-4" />
                                {item.title}
                            </Link>
                        );
                    })}
                </nav>
                <div className="flex-1 min-w-0">{children}</div>
            </div>
        </div>
    );
}
