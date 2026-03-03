"use server";

import { db } from "@/lib/db";
import { companies, companyModules, users, userCompanies, userRoles, roles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getSessionUser } from "@/lib/session";
import { revalidatePath } from "next/cache";
import bcryptjs from "bcryptjs";
import type { ModuleCode } from "@/lib/types";

// ============================================================================
// COMPANY SETTINGS
// ============================================================================

export async function updateCompanyAction(prevState: unknown, formData: FormData) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const website = formData.get("website") as string;
    const taxId = formData.get("taxId") as string;
    const street = formData.get("street") as string;
    const city = formData.get("city") as string;
    const state = formData.get("state") as string;
    const zip = formData.get("zip") as string;
    const country = formData.get("country") as string;
    const currency = formData.get("currency") as string;
    const timezone = formData.get("timezone") as string;

    if (!name) return { error: "Company name is required" };

    await db
        .update(companies)
        .set({
            name: name.trim(),
            email: email?.trim() || null,
            phone: phone?.trim() || null,
            website: website?.trim() || null,
            taxId: taxId?.trim() || null,
            street: street?.trim() || null,
            city: city?.trim() || null,
            state: state?.trim() || null,
            zip: zip?.trim() || null,
            country: country?.trim() || null,
            currency: currency || "USD",
            timezone: timezone || "UTC",
            updatedAt: new Date(),
        })
        .where(eq(companies.id, user.activeCompanyId));

    revalidatePath("/settings/company");
    return { success: true };
}

// ============================================================================
// MODULE MANAGEMENT
// ============================================================================

export async function toggleModuleAction(moduleCode: ModuleCode, enabled: boolean) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    // Check if record exists
    const [existing] = await db
        .select()
        .from(companyModules)
        .where(
            and(
                eq(companyModules.companyId, user.activeCompanyId),
                eq(companyModules.moduleCode, moduleCode)
            )
        )
        .limit(1);

    if (existing) {
        await db
            .update(companyModules)
            .set({ isEnabled: enabled })
            .where(eq(companyModules.id, existing.id));
    } else {
        await db.insert(companyModules).values({
            companyId: user.activeCompanyId,
            moduleCode,
            isEnabled: enabled,
            enabledBy: user.id,
        });
    }

    revalidatePath("/settings/modules");
    revalidatePath("/", "layout"); // refresh sidebar
    return { success: true };
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

export async function inviteUserAction(prevState: unknown, formData: FormData) {
    const currentUser = await getSessionUser();
    if (!currentUser.activeCompanyId) return { error: "No active company" };

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const roleId = formData.get("roleId") as string;

    if (!name || !email || !password) {
        return { error: "Name, email, and password are required" };
    }

    // Check if user exists
    let [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase().trim()))
        .limit(1);

    if (!existingUser) {
        // Create new user
        const passwordHash = await bcryptjs.hash(password, 12);
        const [newUser] = await db
            .insert(users)
            .values({
                name: name.trim(),
                email: email.toLowerCase().trim(),
                passwordHash,
                status: "active",
            })
            .returning();
        existingUser = newUser;
    }

    // Check if already a member
    const [existingMembership] = await db
        .select()
        .from(userCompanies)
        .where(
            and(
                eq(userCompanies.userId, existingUser.id),
                eq(userCompanies.companyId, currentUser.activeCompanyId)
            )
        )
        .limit(1);

    if (existingMembership) {
        return { error: "User is already a member of this company" };
    }

    // Add to company
    await db.insert(userCompanies).values({
        userId: existingUser.id,
        companyId: currentUser.activeCompanyId,
        isOwner: false,
        isDefault: existingUser.id === existingUser.id, // if it's their first company
    });

    // Assign role if provided
    if (roleId) {
        await db.insert(userRoles).values({
            userId: existingUser.id,
            roleId,
            companyId: currentUser.activeCompanyId,
        });
    }

    revalidatePath("/settings/users");
    return { success: true };
}

export async function removeUserAction(prevState: unknown, userId: string) {
    const currentUser = await getSessionUser();
    if (!currentUser.activeCompanyId) return { error: "No active company" };

    if (userId === currentUser.id) {
        return { error: "You cannot remove yourself" };
    }

    // Remove from company
    await db
        .delete(userCompanies)
        .where(
            and(
                eq(userCompanies.userId, userId),
                eq(userCompanies.companyId, currentUser.activeCompanyId)
            )
        );

    // Remove roles for this company
    await db
        .delete(userRoles)
        .where(
            and(
                eq(userRoles.userId, userId),
                eq(userRoles.companyId, currentUser.activeCompanyId)
            )
        );

    revalidatePath("/settings/users");
    return { success: true };
}

// ============================================================================
// ROLE MANAGEMENT
// ============================================================================

export async function createRoleAction(prevState: unknown, formData: FormData) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    if (!name) return { error: "Role name is required" };

    await db.insert(roles).values({
        companyId: user.activeCompanyId,
        name: name.trim(),
        description: description?.trim() || null,
        isSystem: false,
    });

    revalidatePath("/settings/roles");
    return { success: true };
}

export async function deleteRoleAction(prevState: unknown, roleId: string) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    // Don't delete system roles
    const [role] = await db
        .select()
        .from(roles)
        .where(
            and(
                eq(roles.id, roleId),
                eq(roles.companyId, user.activeCompanyId)
            )
        )
        .limit(1);

    if (!role) return { error: "Role not found" };
    if (role.isSystem) return { error: "Cannot delete system roles" };

    await db.delete(roles).where(eq(roles.id, roleId));

    revalidatePath("/settings/roles");
    return { success: true };
}

// ============================================================================
// ROLE — UPDATE
// ============================================================================

export async function updateRoleAction(roleId: string, formData: FormData) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    const name = (formData.get("name") as string)?.trim();
    const description = (formData.get("description") as string)?.trim();

    if (!name) return { error: "Role name is required" };

    const [role] = await db
        .select()
        .from(roles)
        .where(and(eq(roles.id, roleId), eq(roles.companyId, user.activeCompanyId)))
        .limit(1);

    if (!role) return { error: "Role not found" };
    if (role.isSystem) return { error: "Cannot edit system roles" };

    await db.update(roles).set({
        name,
        description: description || null,
        updatedAt: new Date(),
    }).where(eq(roles.id, roleId));

    revalidatePath("/settings/roles");
    return { success: true };
}

// ============================================================================
// USER — CHANGE ROLE
// ============================================================================

export async function updateUserRoleAction(userId: string, roleId: string) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    // Remove existing roles for this user in this company
    await db.delete(userRoles).where(
        and(eq(userRoles.userId, userId), eq(userRoles.companyId, user.activeCompanyId))
    );

    // Assign new role if provided
    if (roleId) {
        await db.insert(userRoles).values({
            userId,
            roleId,
            companyId: user.activeCompanyId,
        });
    }

    revalidatePath("/settings/users");
    return { success: true };
}
