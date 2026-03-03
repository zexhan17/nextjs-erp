import { cache } from "react";
import { db } from "@/lib/db";
import { userRoles, rolePermissions, permissions, companyModules } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import type { ModuleCode } from "@/lib/types";

/**
 * Check if a user has a specific permission in a specific company.
 * Permission format: "module:resource:action" e.g. "sales:order:create"
 */
export async function checkPermission(
    userId: string,
    companyId: string,
    permissionCode: string
): Promise<boolean> {
    // Get all role IDs for this user in this company
    const userRoleRows = await db
        .select({ roleId: userRoles.roleId })
        .from(userRoles)
        .where(
            and(eq(userRoles.userId, userId), eq(userRoles.companyId, companyId))
        );

    if (userRoleRows.length === 0) return false;

    const roleIds = userRoleRows.map((r) => r.roleId);

    // Check if any of their roles have this permission
    const found = await db
        .select({ id: rolePermissions.id })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(
            and(
                inArray(rolePermissions.roleId, roleIds),
                eq(permissions.code, permissionCode)
            )
        )
        .limit(1);

    return found.length > 0;
}

/**
 * Get all permissions for a user in a company.
 */
export async function getUserPermissions(
    userId: string,
    companyId: string
): Promise<string[]> {
    const userRoleRows = await db
        .select({ roleId: userRoles.roleId })
        .from(userRoles)
        .where(
            and(eq(userRoles.userId, userId), eq(userRoles.companyId, companyId))
        );

    if (userRoleRows.length === 0) return [];

    const roleIds = userRoleRows.map((r) => r.roleId);

    const permRows = await db
        .select({ code: permissions.code })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(inArray(rolePermissions.roleId, roleIds));

    return [...new Set(permRows.map((r) => r.code))];
}

/**
 * Get enabled modules for a company.
 * Cached per-request via React cache() to deduplicate across layout + page.
 * Retries once on transient errors (e.g. Neon cold-start timeouts).
 */
export const getCompanyModules = cache(async (companyId: string): Promise<ModuleCode[]> => {
    const query = () =>
        db
            .select({ moduleCode: companyModules.moduleCode })
            .from(companyModules)
            .where(
                and(
                    eq(companyModules.companyId, companyId),
                    eq(companyModules.isEnabled, true)
                )
            );

    let rows;
    try {
        rows = await query();
    } catch {
        // Retry once — handles Neon cold-start ETIMEDOUT
        rows = await query();
    }

    return rows.map((r) => r.moduleCode) as ModuleCode[];
});

/**
 * Check if a module is enabled for a company.
 */
export async function isModuleEnabled(
    companyId: string,
    moduleCode: ModuleCode
): Promise<boolean> {
    const [row] = await db
        .select({ isEnabled: companyModules.isEnabled })
        .from(companyModules)
        .where(
            and(
                eq(companyModules.companyId, companyId),
                eq(companyModules.moduleCode, moduleCode)
            )
        )
        .limit(1);

    return row?.isEnabled ?? false;
}
