"use client";

import * as React from "react";
import { Bell, AlertTriangle, ShoppingCart, CreditCard, Package, FileText, X, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

export interface NotificationItem {
    id: string;
    type: "overdue_invoice" | "low_stock" | "new_order" | "payment_received" | "po_pending" | "quote_expiring" | "info";
    title: string;
    description: string;
    href?: string;
    createdAt: Date;
    read: boolean;
}

interface NotificationBellProps {
    initialNotifications: NotificationItem[];
}

const typeIcons: Record<string, React.ReactNode> = {
    overdue_invoice: <AlertTriangle className="size-4 text-red-500 shrink-0" />,
    low_stock: <Package className="size-4 text-orange-500 shrink-0" />,
    new_order: <ShoppingCart className="size-4 text-blue-500 shrink-0" />,
    payment_received: <CreditCard className="size-4 text-green-500 shrink-0" />,
    po_pending: <FileText className="size-4 text-purple-500 shrink-0" />,
    quote_expiring: <AlertTriangle className="size-4 text-yellow-500 shrink-0" />,
    info: <Bell className="size-4 text-gray-500 shrink-0" />,
};

function timeAgo(date: Date) {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

export function NotificationBell({ initialNotifications }: NotificationBellProps) {
    const [notifications, setNotifications] = React.useState<NotificationItem[]>(initialNotifications);
    const [open, setOpen] = React.useState(false);

    const unreadCount = notifications.filter((n) => !n.read).length;

    const markAllRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    };

    const markRead = (id: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
    };

    const dismiss = (id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="size-4" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
                <div className="flex items-center justify-between px-4 py-3">
                    <h4 className="text-sm font-semibold">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs" onClick={markAllRead}>
                            <CheckCheck className="mr-1 size-3" />
                            Mark all read
                        </Button>
                    )}
                </div>
                <Separator />
                <ScrollArea className="max-h-80">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <Bell className="size-8 mb-2 opacity-30" />
                            <p className="text-sm">No notifications</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((n) => {
                                const content = (
                                    <div
                                        className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50 ${!n.read ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
                                            }`}
                                        onClick={() => markRead(n.id)}
                                    >
                                        <div className="mt-0.5">{typeIcons[n.type] ?? typeIcons.info}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm truncate ${!n.read ? "font-medium" : ""}`}>{n.title}</p>
                                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.description}</p>
                                            <p className="text-xs text-muted-foreground/70 mt-1">{timeAgo(n.createdAt)}</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-6 shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-100"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                dismiss(n.id);
                                            }}
                                        >
                                            <X className="size-3" />
                                        </Button>
                                    </div>
                                );

                                return n.href ? (
                                    <Link key={n.id} href={n.href} onClick={() => { markRead(n.id); setOpen(false); }} className="block group">
                                        {content}
                                    </Link>
                                ) : (
                                    <div key={n.id} className="group cursor-default">{content}</div>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
                {notifications.length > 0 && (
                    <>
                        <Separator />
                        <div className="p-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-xs"
                                onClick={() => setNotifications([])}
                            >
                                Clear all notifications
                            </Button>
                        </div>
                    </>
                )}
            </PopoverContent>
        </Popover>
    );
}
