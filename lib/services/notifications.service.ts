import { db } from "@/lib/db";
import { invoices, products, salesOrders, purchaseOrders, quotations } from "@/lib/db/schema";
import { eq, and, sql, or, lte, gte } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import type { NotificationItem } from "@/components/layout/notification-bell";

/**
 * Wrap a promise with a timeout so a slow DB doesn't block page rendering.
 * Resolves to `undefined` on timeout instead of rejecting the whole batch.
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
        promise,
        new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Notification query timed out after ${ms}ms`)), ms)
        ),
    ]);
}

async function _generateNotifications(companyId: string, enabledModules: string[]): Promise<NotificationItem[]> {
    const notifications: NotificationItem[] = [];
    const now = new Date();
    const queries: Promise<void>[] = [];

    const QUERY_TIMEOUT = 5000; // 5s per query max

    // Overdue invoices
    if (enabledModules.includes("sales")) {
        queries.push(
            withTimeout(db.select({
                count: sql<number>`count(*)::int`,
                total: sql<string>`COALESCE(SUM(${invoices.balanceDue}::numeric), 0)::text`,
            })
                .from(invoices)
                .where(and(
                    eq(invoices.companyId, companyId),
                    or(
                        eq(invoices.status, "overdue"),
                        and(lte(invoices.dueDate, now), eq(invoices.status, "sent"))
                    )
                ))
                .then(([r]) => {
                    const count = r?.count ?? 0;
                    if (count > 0) {
                        const total = parseFloat(r?.total ?? "0");
                        const fmtTotal = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(total);
                        notifications.push({
                            id: "overdue-invoices",
                            type: "overdue_invoice",
                            title: `${count} overdue invoice${count > 1 ? "s" : ""}`,
                            description: `${fmtTotal} total outstanding. Review and follow up.`,
                            href: "/sales/invoices",
                            createdAt: now,
                            read: false,
                        });
                    }
                }), QUERY_TIMEOUT)
        );

        // Recent sales orders today
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        queries.push(
            withTimeout(db.select({
                count: sql<number>`count(*)::int`,
                total: sql<string>`COALESCE(SUM(${salesOrders.total}::numeric), 0)::text`,
            })
                .from(salesOrders)
                .where(and(
                    eq(salesOrders.companyId, companyId),
                    gte(salesOrders.createdAt, startOfDay),
                ))
                .then(([r]) => {
                    const count = r?.count ?? 0;
                    if (count > 0) {
                        const total = parseFloat(r?.total ?? "0");
                        const fmtTotal = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(total);
                        notifications.push({
                            id: "new-orders-today",
                            type: "new_order",
                            title: `${count} new order${count > 1 ? "s" : ""} today`,
                            description: `${fmtTotal} in new sales orders.`,
                            href: "/sales/orders",
                            createdAt: now,
                            read: false,
                        });
                    }
                }), QUERY_TIMEOUT)
        );

        // Expiring quotations (within 7 days)
        const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        queries.push(
            withTimeout(db.select({ count: sql<number>`count(*)::int` })
                .from(quotations)
                .where(and(
                    eq(quotations.companyId, companyId),
                    eq(quotations.status, "sent"),
                    lte(quotations.validUntil, in7Days),
                    gte(quotations.validUntil, now),
                ))
                .then(([r]) => {
                    const count = r?.count ?? 0;
                    if (count > 0) {
                        notifications.push({
                            id: "expiring-quotations",
                            type: "quote_expiring",
                            title: `${count} quotation${count > 1 ? "s" : ""} expiring soon`,
                            description: "Review and follow up before they expire.",
                            href: "/sales/quotations",
                            createdAt: new Date(now.getTime() - 30 * 60 * 1000),
                            read: false,
                        });
                    }
                }), QUERY_TIMEOUT)
        );
    }

    // Low stock alerts
    if (enabledModules.includes("inventory")) {
        queries.push(
            withTimeout(db.select({ count: sql<number>`count(*)::int` })
                .from(products)
                .where(and(
                    eq(products.companyId, companyId),
                    eq(products.isActive, true),
                    eq(products.trackInventory, true),
                    sql`${products.currentStock}::numeric <= ${products.reorderLevel}::numeric`,
                    sql`${products.reorderLevel}::numeric > 0`
                ))
                .then(([r]) => {
                    const count = r?.count ?? 0;
                    if (count > 0) {
                        notifications.push({
                            id: "low-stock",
                            type: "low_stock",
                            title: `${count} product${count > 1 ? "s" : ""} low on stock`,
                            description: "Items below reorder level need restocking.",
                            href: "/inventory/products",
                            createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
                            read: false,
                        });
                    }
                }), QUERY_TIMEOUT)
        );
    }

    // Pending purchase orders
    if (enabledModules.includes("purchase")) {
        queries.push(
            withTimeout(db.select({ count: sql<number>`count(*)::int` })
                .from(purchaseOrders)
                .where(and(
                    eq(purchaseOrders.companyId, companyId),
                    or(eq(purchaseOrders.status, "draft"), eq(purchaseOrders.status, "sent"))
                ))
                .then(([r]) => {
                    const count = r?.count ?? 0;
                    if (count > 0) {
                        notifications.push({
                            id: "pending-po",
                            type: "po_pending",
                            title: `${count} purchase order${count > 1 ? "s" : ""} pending`,
                            description: "Review and confirm or send to vendors.",
                            href: "/purchase/orders",
                            createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
                            read: false,
                        });
                    }
                }), QUERY_TIMEOUT)
        );
    }

    // Run all queries concurrently; settle all so one failure doesn't break everything
    const results = await Promise.allSettled(queries);
    for (const result of results) {
        if (result.status === "rejected") {
            console.error("[Notifications] Query failed:", result.reason);
        }
    }

    // Sort: most recent first
    notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return notifications;
}

/**
 * Cached version of generateNotifications.
 * Revalidates every 60 seconds so notifications stay reasonably fresh
 * without hammering the DB on every page navigation.
 */
const _cachedGenerateNotifications = unstable_cache(
    _generateNotifications,
    ["notifications"],
    { revalidate: 60, tags: ["notifications"] }
);

/**
 * Public entry point. Restores Date objects lost during JSON serialization
 * performed by unstable_cache.
 */
export async function generateNotifications(
    companyId: string,
    enabledModules: string[]
): Promise<NotificationItem[]> {
    const items = await _cachedGenerateNotifications(companyId, enabledModules);
    return items.map((n) => ({ ...n, createdAt: new Date(n.createdAt) }));
}
