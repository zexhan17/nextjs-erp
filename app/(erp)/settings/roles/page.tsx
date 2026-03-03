import { db } from "@/lib/db";
import { roles, rolePermissions, permissions, userRoles } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getSessionUser } from "@/lib/session";
import { RolesClient } from "./roles-client";

export default async function RolesSettingsPage() {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return <div>No active company.</div>;

    const companyId = user.activeCompanyId;

    // Get all roles for this company with member count
    const companyRoles = await db
        .select({
            id: roles.id,
            name: roles.name,
            description: roles.description,
            isSystem: roles.isSystem,
            createdAt: roles.createdAt,
        })
        .from(roles)
        .where(eq(roles.companyId, companyId))
        .orderBy(roles.name);

    // Get member count per role
    const roleMemberCounts = await db
        .select({
            roleId: userRoles.roleId,
            count: sql<number>`count(*)::int`,
        })
        .from(userRoles)
        .where(eq(userRoles.companyId, companyId))
        .groupBy(userRoles.roleId);

    const memberCountMap = Object.fromEntries(
        roleMemberCounts.map((r) => [r.roleId, r.count])
    );

    const rolesWithCount = companyRoles.map((r) => ({
        ...r,
        memberCount: memberCountMap[r.id] ?? 0,
    }));

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold">Roles & Permissions</h2>
                <p className="text-sm text-muted-foreground">
                    Define roles and manage what each role can access.
                </p>
            </div>
            <RolesClient roles={rolesWithCount} />
        </div>
    );
}
