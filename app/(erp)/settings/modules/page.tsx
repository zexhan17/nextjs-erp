import { db } from "@/lib/db";
import { companyModules } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/session";
import { MODULE_REGISTRY, type ModuleCode } from "@/lib/types";
import { ModulesClient } from "./modules-client";

export default async function ModulesSettingsPage() {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return <div>No active company.</div>;

    // Get currently enabled modules
    const enabledModules = await db
        .select({
            moduleCode: companyModules.moduleCode,
            isEnabled: companyModules.isEnabled,
            enabledAt: companyModules.enabledAt,
        })
        .from(companyModules)
        .where(eq(companyModules.companyId, user.activeCompanyId));

    const enabledMap = Object.fromEntries(
        enabledModules.map((m) => [m.moduleCode, { isEnabled: m.isEnabled, enabledAt: m.enabledAt }])
    );

    // Build module list with status
    const modules = MODULE_REGISTRY.map((mod) => ({
        ...mod,
        isEnabled: enabledMap[mod.code]?.isEnabled ?? false,
        enabledAt: enabledMap[mod.code]?.enabledAt ?? null,
        // Check if all dependencies are enabled
        dependenciesMet: mod.dependsOn.every(
            (dep) => enabledMap[dep as ModuleCode]?.isEnabled
        ),
    }));

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold">Modules</h2>
                <p className="text-sm text-muted-foreground">
                    Enable or disable modules for your company. Core modules cannot be turned off.
                    Some modules require other modules to be enabled first.
                </p>
            </div>
            <ModulesClient modules={modules} />
        </div>
    );
}
