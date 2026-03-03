import { db } from "@/lib/db";
import { users, userCompanies, userRoles, roles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getSessionUser } from "@/lib/session";
import { UsersClient } from "./users-client";

export default async function UsersSettingsPage() {
    const currentUser = await getSessionUser();
    if (!currentUser.activeCompanyId) {
        return <div>No active company.</div>;
    }

    const companyId = currentUser.activeCompanyId;

    // Get all users for this company
    const memberships = await db
        .select({
            userId: userCompanies.userId,
            isOwner: userCompanies.isOwner,
            userName: users.name,
            userEmail: users.email,
            userStatus: users.status,
            userAvatar: users.avatar,
            lastLogin: users.lastLoginAt,
        })
        .from(userCompanies)
        .innerJoin(users, eq(users.id, userCompanies.userId))
        .where(eq(userCompanies.companyId, companyId));

    // Get roles for this company (for the invite dialog)
    const companyRoles = await db
        .select({ id: roles.id, name: roles.name, isSystem: roles.isSystem })
        .from(roles)
        .where(eq(roles.companyId, companyId));

    // Get role assignments
    const roleAssignments = await db
        .select({
            userId: userRoles.userId,
            roleId: userRoles.roleId,
            roleName: roles.name,
        })
        .from(userRoles)
        .innerJoin(roles, eq(roles.id, userRoles.roleId))
        .where(eq(userRoles.companyId, companyId));

    // Map roles to users
    const usersWithRoles = memberships.map((m) => ({
        ...m,
        roles: roleAssignments
            .filter((r) => r.userId === m.userId)
            .map((r) => ({ id: r.roleId, name: r.roleName })),
    }));

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold">Users</h2>
                <p className="text-sm text-muted-foreground">
                    Manage who has access to this company. Invite new team members or remove existing ones.
                </p>
            </div>
            <UsersClient
                users={usersWithRoles}
                currentUserId={currentUser.id}
                roles={companyRoles}
            />
        </div>
    );
}
