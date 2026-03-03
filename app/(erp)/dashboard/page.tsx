import { getSessionUser } from "@/lib/session";
import { getCompanyModules } from "@/lib/services/rbac.service";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { db } from "@/lib/db";
import {
    contacts,
    salesOrders,
    products,
    chartOfAccounts,
    invoices,
    purchaseOrders,
    quotations,
    vendorBills,
    payments,
} from "@/lib/db/schema";
import { eq, and, sql, gte, desc, lte, or } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Users,
    ShoppingCart,
    Package,
    DollarSign,
    Plus,
    UserPlus,
    FileText,
    Receipt,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    ArrowUpRight,
    ArrowDownRight,
    CreditCard,
    PackageCheck,
} from "lucide-react";

interface DashboardStats {
    contacts: number;
    customers: number;
    vendors: number;
    salesTotal: string;
    salesCount: number;
    productCount: number;
    revenue: string;
    expenses: string;
    overdueInvoices: number;
    overdueAmount: string;
    pendingQuotations: number;
    pendingQuotationsAmount: string;
    openPurchaseOrders: number;
    openPOAmount: string;
    paidInvoicesMonth: string;
    unpaidBillsAmount: string;
    lowStockProducts: number;
    recentSalesOrders: Array<{ id: string; number: string; customer: string; total: string; status: string; date: Date }>;
    recentInvoices: Array<{ id: string; number: string; customer: string; total: string; status: string; dueDate: Date | null }>;
    recentContacts: Array<{ id: string; name: string; type: string; email: string | null; createdAt: Date }>;
    invoicesByStatus: Array<{ status: string; count: number; total: string }>;
}

async function getDashboardStats(companyId: string, enabledModules: string[]): Promise<DashboardStats> {
    const stats: DashboardStats = {
        contacts: 0, customers: 0, vendors: 0,
        salesTotal: "0", salesCount: 0,
        productCount: 0,
        revenue: "0", expenses: "0",
        overdueInvoices: 0, overdueAmount: "0",
        pendingQuotations: 0, pendingQuotationsAmount: "0",
        openPurchaseOrders: 0, openPOAmount: "0",
        paidInvoicesMonth: "0", unpaidBillsAmount: "0",
        lowStockProducts: 0,
        recentSalesOrders: [], recentInvoices: [], recentContacts: [],
        invoicesByStatus: [],
    };

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const queries: Promise<void>[] = [];

    /* ── Contacts ──────────────────────────────────────────── */
    if (enabledModules.includes("contacts")) {
        queries.push(
            db.select({
                total: sql<number>`count(*)::int`,
                customers: sql<number>`count(*) filter (where ${contacts.type} in ('customer','customer_vendor'))::int`,
                vendors: sql<number>`count(*) filter (where ${contacts.type} in ('vendor','customer_vendor'))::int`,
            }).from(contacts).where(eq(contacts.companyId, companyId))
                .then(([r]) => { stats.contacts = r?.total ?? 0; stats.customers = r?.customers ?? 0; stats.vendors = r?.vendors ?? 0; })
                .catch(() => { /* Silently fail, use defaults */ })
        );
        queries.push(
            db.select({ id: contacts.id, name: contacts.name, type: contacts.type, email: contacts.email, createdAt: contacts.createdAt })
                .from(contacts).where(eq(contacts.companyId, companyId)).orderBy(desc(contacts.createdAt)).limit(5)
                .then((rows) => { stats.recentContacts = rows; })
                .catch(() => { /* Silently fail, use defaults */ })
        );
    }

    /* ── Sales ─────────────────────────────────────────────── */
    if (enabledModules.includes("sales")) {
        queries.push(
            db.select({ count: sql<number>`count(*)::int`, total: sql<string>`COALESCE(SUM(${salesOrders.total}::numeric),0)::text` })
                .from(salesOrders).where(and(eq(salesOrders.companyId, companyId), gte(salesOrders.orderDate, startOfMonth)))
                .then(([r]) => { stats.salesCount = r?.count ?? 0; stats.salesTotal = r?.total ?? "0"; })
                .catch(() => { /* Silently fail, use defaults */ })
        );
        queries.push(
            db.select({ id: salesOrders.id, number: salesOrders.number, customer: contacts.name, total: salesOrders.total, status: salesOrders.status, date: salesOrders.orderDate })
                .from(salesOrders).leftJoin(contacts, eq(salesOrders.customerId, contacts.id))
                .where(eq(salesOrders.companyId, companyId)).orderBy(desc(salesOrders.createdAt)).limit(5)
                .then((rows) => { stats.recentSalesOrders = rows.map((r) => ({ ...r, customer: r.customer ?? "Unknown" })); })
                .catch(() => { /* Silently fail, use defaults */ })
        );
        queries.push(
            db.select({ count: sql<number>`count(*)::int`, total: sql<string>`COALESCE(SUM(${invoices.balanceDue}::numeric),0)::text` })
                .from(invoices)
                .where(and(eq(invoices.companyId, companyId), or(eq(invoices.status, "overdue"), and(lte(invoices.dueDate, now), eq(invoices.status, "sent")))))
                .then(([r]) => { stats.overdueInvoices = r?.count ?? 0; stats.overdueAmount = r?.total ?? "0"; })
                .catch(() => { /* Silently fail, use defaults */ })
        );
        queries.push(
            db.select({ total: sql<string>`COALESCE(SUM(${payments.amount}::numeric),0)::text` })
                .from(payments).where(and(eq(payments.companyId, companyId), gte(payments.paidAt, startOfMonth)))
                .then(([r]) => { stats.paidInvoicesMonth = r?.total ?? "0"; })
                .catch(() => { /* Silently fail, use defaults */ })
        );
        queries.push(
            db.select({ id: invoices.id, number: invoices.number, customer: contacts.name, total: invoices.total, status: invoices.status, dueDate: invoices.dueDate })
                .from(invoices).leftJoin(contacts, eq(invoices.customerId, contacts.id))
                .where(eq(invoices.companyId, companyId)).orderBy(desc(invoices.createdAt)).limit(5)
                .then((rows) => { stats.recentInvoices = rows.map((r) => ({ ...r, customer: r.customer ?? "Unknown" })); })
                .catch(() => { /* Silently fail, use defaults */ })
        );
        queries.push(
            db.select({ status: invoices.status, count: sql<number>`count(*)::int`, total: sql<string>`COALESCE(SUM(${invoices.total}::numeric),0)::text` })
                .from(invoices).where(eq(invoices.companyId, companyId)).groupBy(invoices.status)
                .then((rows) => { stats.invoicesByStatus = rows; })
                .catch(() => { /* Silently fail, use defaults */ })
        );
        queries.push(
            db.select({ count: sql<number>`count(*)::int`, total: sql<string>`COALESCE(SUM(${quotations.total}::numeric),0)::text` })
                .from(quotations).where(and(eq(quotations.companyId, companyId), or(eq(quotations.status, "draft"), eq(quotations.status, "sent"))))
                .then(([r]) => { stats.pendingQuotations = r?.count ?? 0; stats.pendingQuotationsAmount = r?.total ?? "0"; })
                .catch(() => { /* Silently fail, use defaults */ })
        );
    }

    /* ── Inventory ─────────────────────────────────────────── */
    if (enabledModules.includes("inventory")) {
        queries.push(
            db.select({ count: sql<number>`count(*)::int` }).from(products)
                .where(and(eq(products.companyId, companyId), eq(products.isActive, true)))
                .then(([r]) => { stats.productCount = r?.count ?? 0; })
                .catch(() => { /* Silently fail, use defaults */ })
        );
        queries.push(
            db.select({ count: sql<number>`count(*)::int` }).from(products)
                .where(and(eq(products.companyId, companyId), eq(products.isActive, true), eq(products.trackInventory, true), sql`${products.currentStock}::numeric <= ${products.reorderLevel}::numeric`, sql`${products.reorderLevel}::numeric > 0`))
                .then(([r]) => { stats.lowStockProducts = r?.count ?? 0; })
                .catch(() => { /* Silently fail, use defaults */ })
        );
    }

    /* ── Purchase ──────────────────────────────────────────── */
    if (enabledModules.includes("purchase")) {
        queries.push(
            db.select({ count: sql<number>`count(*)::int`, total: sql<string>`COALESCE(SUM(${purchaseOrders.total}::numeric),0)::text` })
                .from(purchaseOrders).where(and(eq(purchaseOrders.companyId, companyId), or(eq(purchaseOrders.status, "draft"), eq(purchaseOrders.status, "sent"), eq(purchaseOrders.status, "confirmed"))))
                .then(([r]) => { stats.openPurchaseOrders = r?.count ?? 0; stats.openPOAmount = r?.total ?? "0"; })
                .catch(() => { /* Silently fail, use defaults */ })
        );
        queries.push(
            db.select({ total: sql<string>`COALESCE(SUM((${vendorBills.total}::numeric - ${vendorBills.amountPaid}::numeric)),0)::text` })
                .from(vendorBills).where(and(eq(vendorBills.companyId, companyId), or(eq(vendorBills.status, "received"), eq(vendorBills.status, "partially_paid"), eq(vendorBills.status, "overdue"))))
                .then(([r]) => { stats.unpaidBillsAmount = r?.total ?? "0"; })
                .catch(() => { /* Silently fail, use defaults */ })
        );
    }

    /* ── Accounting ────────────────────────────────────────── */
    if (enabledModules.includes("accounting")) {
        queries.push(
            db.select({ total: sql<string>`COALESCE(SUM(${chartOfAccounts.balance}::numeric),0)::text` })
                .from(chartOfAccounts).where(and(eq(chartOfAccounts.companyId, companyId), eq(chartOfAccounts.type, "revenue")))
                .then(([r]) => { stats.revenue = r?.total ?? "0"; })
                .catch(() => { /* Silently fail, use defaults */ })
        );
        queries.push(
            db.select({ total: sql<string>`COALESCE(SUM(${chartOfAccounts.balance}::numeric),0)::text` })
                .from(chartOfAccounts).where(and(eq(chartOfAccounts.companyId, companyId), eq(chartOfAccounts.type, "expense")))
                .then(([r]) => { stats.expenses = r?.total ?? "0"; })
                .catch(() => { /* Silently fail, use defaults */ })
        );
    }

    await Promise.allSettled(queries);
    return stats;
}

function fmtCurrency(val: string) {
    const n = parseFloat(val);
    return isNaN(n) ? "$0.00" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Math.abs(n));
}
function fmtDate(d: Date | null) {
    if (!d) return "—";
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d);
}

const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700", confirmed: "bg-blue-100 text-blue-700",
    processing: "bg-yellow-100 text-yellow-700", shipped: "bg-purple-100 text-purple-700",
    delivered: "bg-green-100 text-green-700", cancelled: "bg-red-100 text-red-700",
    sent: "bg-blue-100 text-blue-700", accepted: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700", expired: "bg-gray-100 text-gray-700",
    paid: "bg-green-100 text-green-700", partially_paid: "bg-yellow-100 text-yellow-700",
    overdue: "bg-red-100 text-red-700", refunded: "bg-orange-100 text-orange-700",
};

export default async function DashboardPage() {
    const user = await getSessionUser();
    const enabledModules = await getCompanyModules(user.activeCompanyId!);
    const stats = await getDashboardStats(user.activeCompanyId!, enabledModules);
    const netIncome = parseFloat(stats.revenue) - Math.abs(parseFloat(stats.expenses));

    return (
        <div className="space-y-6">
            <PageHeader title={`Welcome back, ${user.name.split(" ")[0]}`} description={`Here's what's happening at ${user.activeCompanyName}`} />

            {/* ── KPI Row 1 ──────────────────────────────────────── */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {enabledModules.includes("contacts") && (
                    <StatCard title="Total Contacts" value={String(stats.contacts)} description={`${stats.customers} customers · ${stats.vendors} vendors`} icon={<Users className="size-4" />} />
                )}
                {enabledModules.includes("sales") && (
                    <StatCard title="Sales This Month" value={fmtCurrency(stats.salesTotal)} description={`${stats.salesCount} orders this month`} icon={<ShoppingCart className="size-4" />} />
                )}
                {enabledModules.includes("inventory") && (
                    <StatCard title="Products" value={String(stats.productCount)} description={stats.lowStockProducts > 0 ? `${stats.lowStockProducts} low stock` : "All stocked"} icon={<Package className="size-4" />} />
                )}
                {enabledModules.includes("accounting") && (
                    <StatCard title="Revenue" value={fmtCurrency(stats.revenue)} description="Total revenue balance" icon={<DollarSign className="size-4" />} />
                )}
            </div>

            {/* ── KPI Row 2 ──────────────────────────────────────── */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {enabledModules.includes("sales") && (
                    <StatCard title="Overdue Invoices" value={String(stats.overdueInvoices)} description={`${fmtCurrency(stats.overdueAmount)} outstanding`} icon={<AlertTriangle className="size-4" />} />
                )}
                {enabledModules.includes("sales") && (
                    <StatCard title="Payments This Month" value={fmtCurrency(stats.paidInvoicesMonth)} description="Collected from customers" icon={<CreditCard className="size-4" />} />
                )}
                {enabledModules.includes("purchase") && (
                    <StatCard title="Open POs" value={String(stats.openPurchaseOrders)} description={`${fmtCurrency(stats.openPOAmount)} pending`} icon={<PackageCheck className="size-4" />} />
                )}
                {enabledModules.includes("sales") && (
                    <StatCard title="Pending Quotes" value={String(stats.pendingQuotations)} description={`${fmtCurrency(stats.pendingQuotationsAmount)} value`} icon={<FileText className="size-4" />} />
                )}
            </div>

            {/* ── Financial Summary ──────────────────────────────── */}
            {(enabledModules.includes("accounting") || enabledModules.includes("purchase")) && (
                <div className="grid gap-4 md:grid-cols-3">
                    {enabledModules.includes("accounting") && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Net Income</CardTitle>
                                {netIncome >= 0 ? <TrendingUp className="size-4 text-green-600" /> : <TrendingDown className="size-4 text-red-600" />}
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
                                    {netIncome >= 0 ? "+" : "-"}{fmtCurrency(Math.abs(netIncome).toString())}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Revenue minus expenses</p>
                            </CardContent>
                        </Card>
                    )}
                    {enabledModules.includes("sales") && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Accounts Receivable</CardTitle>
                                <ArrowUpRight className="size-4 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{fmtCurrency(stats.overdueAmount)}</div>
                                <p className="text-xs text-muted-foreground mt-1">{stats.overdueInvoices} outstanding invoices</p>
                            </CardContent>
                        </Card>
                    )}
                    {enabledModules.includes("purchase") && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Accounts Payable</CardTitle>
                                <ArrowDownRight className="size-4 text-orange-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{fmtCurrency(stats.unpaidBillsAmount)}</div>
                                <p className="text-xs text-muted-foreground mt-1">Unpaid vendor bills</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* ── Recent Orders & Invoices ───────────────────────── */}
            <div className="grid gap-4 md:grid-cols-2">
                {enabledModules.includes("sales") && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-base font-semibold">Recent Sales Orders</CardTitle>
                            <Button variant="ghost" size="sm" asChild><Link href="/sales/orders">View all <ArrowUpRight className="ml-1 size-3" /></Link></Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            {stats.recentSalesOrders.length === 0 ? (
                                <p className="text-sm text-muted-foreground px-6 pb-4">No orders yet</p>
                            ) : (
                                <div className="divide-y">
                                    {stats.recentSalesOrders.map((o) => (
                                        <Link key={o.id} href={`/sales/orders/${o.id}`} className="flex items-center justify-between px-6 py-3 hover:bg-muted/50 transition-colors">
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate">{o.number}</p>
                                                <p className="text-xs text-muted-foreground truncate">{o.customer} · {fmtDate(o.date)}</p>
                                            </div>
                                            <div className="flex items-center gap-2 ml-2 shrink-0">
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[o.status] ?? "bg-gray-100 text-gray-700"}`}>{o.status.replace(/_/g, " ")}</span>
                                                <span className="text-sm font-medium">{fmtCurrency(o.total)}</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
                {enabledModules.includes("sales") && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-base font-semibold">Recent Invoices</CardTitle>
                            <Button variant="ghost" size="sm" asChild><Link href="/sales/invoices">View all <ArrowUpRight className="ml-1 size-3" /></Link></Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            {stats.recentInvoices.length === 0 ? (
                                <p className="text-sm text-muted-foreground px-6 pb-4">No invoices yet</p>
                            ) : (
                                <div className="divide-y">
                                    {stats.recentInvoices.map((inv) => (
                                        <Link key={inv.id} href={`/sales/invoices/${inv.id}`} className="flex items-center justify-between px-6 py-3 hover:bg-muted/50 transition-colors">
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate">{inv.number}</p>
                                                <p className="text-xs text-muted-foreground truncate">{inv.customer} · Due {fmtDate(inv.dueDate)}</p>
                                            </div>
                                            <div className="flex items-center gap-2 ml-2 shrink-0">
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[inv.status] ?? "bg-gray-100 text-gray-700"}`}>{inv.status.replace(/_/g, " ")}</span>
                                                <span className="text-sm font-medium">{fmtCurrency(inv.total)}</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* ── Bottom: Invoice Breakdown + Quick Actions + Recent Contacts ── */}
            <div className="grid gap-4 md:grid-cols-3">
                {enabledModules.includes("sales") && stats.invoicesByStatus.length > 0 && (
                    <Card>
                        <CardHeader><CardTitle className="text-base font-semibold">Invoice Breakdown</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            {stats.invoicesByStatus.map((item) => (
                                <div key={item.status} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[item.status] ?? "bg-gray-100 text-gray-700"}`}>{item.status.replace(/_/g, " ")}</span>
                                        <span className="text-sm text-muted-foreground">{item.count}</span>
                                    </div>
                                    <span className="text-sm font-medium">{fmtCurrency(item.total)}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}
                <Card>
                    <CardHeader><CardTitle className="text-base font-semibold">Quick Actions</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-2">
                            {enabledModules.includes("contacts") && <Button variant="outline" size="sm" asChild><Link href="/contacts/new"><UserPlus className="mr-2 size-4" />New Contact</Link></Button>}
                            {enabledModules.includes("sales") && <Button variant="outline" size="sm" asChild><Link href="/sales/orders/new"><ShoppingCart className="mr-2 size-4" />New Sale</Link></Button>}
                            {enabledModules.includes("inventory") && <Button variant="outline" size="sm" asChild><Link href="/inventory/products/new"><Plus className="mr-2 size-4" />New Product</Link></Button>}
                            {enabledModules.includes("purchase") && <Button variant="outline" size="sm" asChild><Link href="/purchase/orders/new"><FileText className="mr-2 size-4" />New PO</Link></Button>}
                            {enabledModules.includes("accounting") && <Button variant="outline" size="sm" asChild><Link href="/accounting/journal/new"><Receipt className="mr-2 size-4" />Journal Entry</Link></Button>}
                            {enabledModules.includes("sales") && <Button variant="outline" size="sm" asChild><Link href="/sales/invoices/new"><Receipt className="mr-2 size-4" />New Invoice</Link></Button>}
                        </div>
                    </CardContent>
                </Card>
                {enabledModules.includes("contacts") && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-base font-semibold">Recent Contacts</CardTitle>
                            <Button variant="ghost" size="sm" asChild><Link href="/contacts">View all <ArrowUpRight className="ml-1 size-3" /></Link></Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            {stats.recentContacts.length === 0 ? (
                                <p className="text-sm text-muted-foreground px-6 pb-4">No contacts yet</p>
                            ) : (
                                <div className="divide-y">
                                    {stats.recentContacts.map((c) => (
                                        <Link key={c.id} href={`/contacts/${c.id}`} className="flex items-center justify-between px-6 py-3 hover:bg-muted/50 transition-colors">
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate">{c.name}</p>
                                                <p className="text-xs text-muted-foreground truncate">{c.email ?? "No email"}</p>
                                            </div>
                                            <Badge variant="secondary" className="capitalize text-xs shrink-0">{c.type.replace(/_/g, " ")}</Badge>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* ── Alerts & Modules ───────────────────────────────── */}
            <div className="grid gap-4 md:grid-cols-2">
                {enabledModules.includes("inventory") && stats.lowStockProducts > 0 && (
                    <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-800">
                        <CardHeader className="flex flex-row items-center gap-2 pb-2">
                            <AlertTriangle className="size-4 text-orange-600" />
                            <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-400">Low Stock Alert</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">{stats.lowStockProducts}</p>
                            <p className="text-xs text-orange-600 dark:text-orange-500 mt-1">Products below reorder level</p>
                            <Button variant="outline" size="sm" className="mt-3" asChild><Link href="/inventory/products">View Products</Link></Button>
                        </CardContent>
                    </Card>
                )}
                <Card>
                    <CardHeader><CardTitle className="text-base font-semibold">Enabled Modules</CardTitle></CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {enabledModules.map((mod) => (
                                <span key={mod} className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary capitalize">{mod}</span>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}