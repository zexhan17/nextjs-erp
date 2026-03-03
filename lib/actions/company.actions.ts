"use server";

import { db } from "@/lib/db";
import { userCompanies, sessions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getSessionUser } from "@/lib/session";
import { revalidatePath } from "next/cache";

/**
 * Switch the user's active company.
 */
export async function switchCompanyAction(companyId: string) {
    const user = await getSessionUser();

    // Verify user belongs to this company
    const [membership] = await db
        .select()
        .from(userCompanies)
        .where(
            and(
                eq(userCompanies.userId, user.id),
                eq(userCompanies.companyId, companyId),
                eq(userCompanies.isActive, true)
            )
        )
        .limit(1);

    if (!membership) {
        return { error: "You don't have access to this company" };
    }

    // Set all companies to non-default
    await db
        .update(userCompanies)
        .set({ isDefault: false })
        .where(eq(userCompanies.userId, user.id));

    // Set selected company as default
    await db
        .update(userCompanies)
        .set({ isDefault: true })
        .where(
            and(
                eq(userCompanies.userId, user.id),
                eq(userCompanies.companyId, companyId)
            )
        );

    revalidatePath("/", "layout");
    return { success: true };
}
