"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ShoppingCart, FileText, Receipt, CreditCard } from "lucide-react";

const salesNav = [
    { title: "Orders", href: "/sales/orders", icon: ShoppingCart },
    { title: "Quotations", href: "/sales/quotations", icon: FileText },
    { title: "Invoices", href: "/sales/invoices", icon: Receipt },
    { title: "Payments", href: "/sales/payments", icon: CreditCard },
];

export default function SalesLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="space-y-6">
            <div className="border-b">
                <nav className="flex gap-4 overflow-x-auto px-1">
                    {salesNav.map((item) => {
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
