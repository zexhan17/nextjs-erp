import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getCompanyModules } from "@/lib/services/rbac.service";
import { generateNotifications } from "@/lib/services/notifications.service";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";

export default async function ERPLayout({ children }: { children: React.ReactNode }) {
    let user;
    try {
        user = await getSessionUser();
    } catch {
        redirect("/login");
    }

    if (!user.activeCompanyId) {
        // User has no company — shouldn't happen with normal flow
        redirect("/login");
    }

    let enabledModules: Awaited<ReturnType<typeof getCompanyModules>> = [];
    try {
        enabledModules = await getCompanyModules(user.activeCompanyId);
    } catch (err) {
        console.error("[ERPLayout] Failed to load company modules:", err);
    }

    // Load notifications with error handling — don't crash layout on failure
    let notifications: Awaited<ReturnType<typeof generateNotifications>> = [];
    try {
        notifications = await generateNotifications(user.activeCompanyId, enabledModules);
    } catch (err) {
        console.error("[ERPLayout] Failed to load notifications:", err);
    }

    return (
        <SidebarProvider>
            <AppSidebar user={user} enabledModules={enabledModules} />
            <SidebarInset>
                <TopBar user={user} enabledModules={enabledModules} notifications={notifications} />
                <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
            </SidebarInset>
            <Toaster richColors position="top-right" />
        </SidebarProvider>
    );
}
