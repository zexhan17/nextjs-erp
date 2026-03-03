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

    const enabledModules = await getCompanyModules(user.activeCompanyId);
    const notifications = await generateNotifications(user.activeCompanyId, enabledModules);

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
