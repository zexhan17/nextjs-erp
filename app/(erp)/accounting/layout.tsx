"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BookOpen, FileSpreadsheet, Calculator, CalendarDays } from "lucide-react";

const accountingNav = [
    { title: "Chart of Accounts", href: "/accounting/accounts", icon: BookOpen },
    { title: "Journal Entries", href: "/accounting/journal", icon: FileSpreadsheet },
    { title: "Tax Rates", href: "/accounting/taxes", icon: Calculator },
    { title: "Fiscal Years", href: "/accounting/fiscal-years", icon: CalendarDays },
];

export default function AccountingLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="space-y-6">
            <div className="border-b">
                <nav className="flex gap-4 overflow-x-auto px-1">
                    {accountingNav.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-2 border-b-2 px-1 pb-3 pt-2 text-sm font-medium transition-colors whitespace-nowrap",
                                    isActive
                                        ? "border-primary text-primary"
                                        : "border-transparent text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Icon className="size-4" />
                                {item.title}
                            </Link>
                        );
                    })}
                </nav>
            </div>
            {children}
        </div>
    );
}
