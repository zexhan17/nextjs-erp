"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const reportNav = [
    { title: "Trial Balance", href: "/accounting/reports/trial-balance" },
    { title: "Balance Sheet", href: "/accounting/reports/balance-sheet" },
    { title: "Income Statement", href: "/accounting/reports/income-statement" },
    { title: "General Ledger", href: "/accounting/reports/general-ledger" },
];

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-xl font-semibold">Financial Reports</h2>
                <p className="text-sm text-muted-foreground">
                    Generate and review financial statements for your company.
                </p>
            </div>
            <div className="flex flex-wrap gap-2">
                {reportNav.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                                isActive
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            {item.title}
                        </Link>
                    );
                })}
            </div>
            {children}
        </div>
    );
}
