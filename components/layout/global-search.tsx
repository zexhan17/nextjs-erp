"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    LayoutDashboard,
    Users,
    ShoppingCart,
    Package,
    Calculator,
    FileText,
    Receipt,
    Settings,
    Plus,
    Search,
    PackageCheck,
    ClipboardList,
    Warehouse,
    CreditCard,
    BookOpen,
} from "lucide-react";

interface GlobalSearchProps {
    enabledModules: string[];
}

interface SearchItem {
    label: string;
    href: string;
    icon: React.ReactNode;
    keywords?: string[];
    module?: string;
}

const navItems: SearchItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="mr-2 size-4" />, keywords: ["home", "overview"] },
    { label: "Contacts", href: "/contacts", icon: <Users className="mr-2 size-4" />, module: "contacts", keywords: ["customers", "vendors", "people"] },
    { label: "New Contact", href: "/contacts/new", icon: <Plus className="mr-2 size-4" />, module: "contacts", keywords: ["add customer", "add vendor"] },
    { label: "Sales Orders", href: "/sales/orders", icon: <ShoppingCart className="mr-2 size-4" />, module: "sales", keywords: ["orders"] },
    { label: "New Sales Order", href: "/sales/orders/new", icon: <Plus className="mr-2 size-4" />, module: "sales", keywords: ["new order", "create order"] },
    { label: "Quotations", href: "/sales/quotations", icon: <FileText className="mr-2 size-4" />, module: "sales", keywords: ["quotes", "proposals"] },
    { label: "Invoices", href: "/sales/invoices", icon: <Receipt className="mr-2 size-4" />, module: "sales", keywords: ["bills", "billing"] },
    { label: "New Invoice", href: "/sales/invoices/new", icon: <Plus className="mr-2 size-4" />, module: "sales", keywords: ["create invoice"] },
    { label: "Payments", href: "/sales/payments", icon: <CreditCard className="mr-2 size-4" />, module: "sales", keywords: ["transactions"] },
    { label: "Products", href: "/inventory/products", icon: <Package className="mr-2 size-4" />, module: "inventory", keywords: ["items", "stock"] },
    { label: "New Product", href: "/inventory/products/new", icon: <Plus className="mr-2 size-4" />, module: "inventory", keywords: ["add product", "create product"] },
    { label: "Categories", href: "/inventory/categories", icon: <Package className="mr-2 size-4" />, module: "inventory", keywords: ["product categories"] },
    { label: "Warehouses", href: "/inventory/warehouses", icon: <Warehouse className="mr-2 size-4" />, module: "inventory", keywords: ["storage", "locations"] },
    { label: "Stock Moves", href: "/inventory/stock-moves", icon: <ClipboardList className="mr-2 size-4" />, module: "inventory", keywords: ["transfers", "movements"] },
    { label: "Purchase Orders", href: "/purchase/orders", icon: <PackageCheck className="mr-2 size-4" />, module: "purchase", keywords: ["PO", "procurement"] },
    { label: "New Purchase Order", href: "/purchase/orders/new", icon: <Plus className="mr-2 size-4" />, module: "purchase", keywords: ["new PO", "create PO"] },
    { label: "Vendor Bills", href: "/purchase/bills", icon: <FileText className="mr-2 size-4" />, module: "purchase", keywords: ["vendor invoices"] },
    { label: "Accounting", href: "/accounting", icon: <Calculator className="mr-2 size-4" />, module: "accounting", keywords: ["finance", "books"] },
    { label: "Chart of Accounts", href: "/accounting/accounts", icon: <BookOpen className="mr-2 size-4" />, module: "accounting", keywords: ["COA", "ledger"] },
    { label: "Journal Entry", href: "/accounting/journal/new", icon: <Plus className="mr-2 size-4" />, module: "accounting", keywords: ["new entry", "posting"] },
    { label: "Taxes", href: "/accounting/taxes", icon: <Calculator className="mr-2 size-4" />, module: "accounting", keywords: ["tax rates", "VAT", "GST"] },
    { label: "Settings", href: "/settings", icon: <Settings className="mr-2 size-4" />, module: "settings", keywords: ["preferences", "configuration"] },
    { label: "Company Settings", href: "/settings/company", icon: <Settings className="mr-2 size-4" />, module: "settings", keywords: ["company info"] },
    { label: "Users", href: "/settings/users", icon: <Users className="mr-2 size-4" />, module: "settings", keywords: ["team", "user management"] },
    { label: "Modules", href: "/settings/modules", icon: <Package className="mr-2 size-4" />, module: "settings", keywords: ["apps", "enable disable"] },
];

export function GlobalSearch({ enabledModules }: GlobalSearchProps) {
    const [open, setOpen] = React.useState(false);
    const router = useRouter();

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "s" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((prev) => !prev);
            }
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((prev) => !prev);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const filtered = navItems.filter(
        (item) => !item.module || enabledModules.includes(item.module)
    );

    const pages = filtered.filter((i) => !i.label.startsWith("New"));
    const actions = filtered.filter((i) => i.label.startsWith("New") || i.href.endsWith("/new"));

    const runCommand = (href: string) => {
        setOpen(false);
        router.push(href);
    };

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
                <Search className="size-4" />
                <span className="hidden md:inline">Search...</span>
                <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 md:inline-flex">
                    <span className="text-xs">⌘</span>S
                </kbd>
            </button>
            <CommandDialog open={open} onOpenChange={setOpen} title="Global Search" description="Search pages, actions, and settings">
                <CommandInput placeholder="Type to search pages, actions..." />
                <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    <CommandGroup heading="Pages">
                        {pages.map((item) => (
                            <CommandItem
                                key={item.href}
                                value={`${item.label} ${item.keywords?.join(" ") ?? ""}`}
                                onSelect={() => runCommand(item.href)}
                            >
                                {item.icon}
                                {item.label}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading="Quick Actions">
                        {actions.map((item) => (
                            <CommandItem
                                key={item.href}
                                value={`${item.label} ${item.keywords?.join(" ") ?? ""}`}
                                onSelect={() => runCommand(item.href)}
                            >
                                {item.icon}
                                {item.label}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    );
}
