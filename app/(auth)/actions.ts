"use server";

import { signIn, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, companies, userCompanies, companyModules, roles, userRoles, sequences } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcryptjs from "bcryptjs";
import { redirect } from "next/navigation";
import { MODULE_CODES } from "@/lib/types";

// ============================================================================
// LOGIN
// ============================================================================

export async function loginAction(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
        return { error: "Email and password are required" };
    }

    try {
        await signIn("credentials", {
            email: email.toLowerCase().trim(),
            password,
            redirect: false,
        });
    } catch {
        return { error: "Invalid email or password" };
    }

    redirect("/dashboard");
}

// ============================================================================
// REGISTER (creates user + their first company)
// ============================================================================

export async function registerAction(formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const companyName = formData.get("companyName") as string;

    if (!name || !email || !password || !companyName) {
        return { error: "All fields are required" };
    }

    if (password.length < 8) {
        return { error: "Password must be at least 8 characters" };
    }

    // Check duplicate email
    const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email.toLowerCase().trim()))
        .limit(1);

    if (existing) {
        return { error: "An account with this email already exists" };
    }

    const passwordHash = await bcryptjs.hash(password, 12);

    // Create user
    const [user] = await db
        .insert(users)
        .values({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            passwordHash,
            status: "active",
        })
        .returning();

    // Create company
    const slug = companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 100);

    const [company] = await db
        .insert(companies)
        .values({
            name: companyName.trim(),
            slug: `${slug}-${Date.now().toString(36)}`,
        })
        .returning();

    // Link user as owner
    await db.insert(userCompanies).values({
        userId: user.id,
        companyId: company.id,
        isOwner: true,
        isDefault: true,
    });

    // Create admin role for the company
    const [adminRole] = await db
        .insert(roles)
        .values({
            companyId: company.id,
            name: "Admin",
            description: "Full access to all company features",
            isSystem: true,
        })
        .returning();

    // Assign admin role
    await db.insert(userRoles).values({
        userId: user.id,
        roleId: adminRole.id,
        companyId: company.id,
    });

    // Enable core modules + common starter modules
    const coreModules: (typeof MODULE_CODES)[number][] = [
        "settings",
        "contacts",
        "inventory",
        "sales",
        "purchase",
        "accounting",
    ];

    await db.insert(companyModules).values(
        coreModules.map((code) => ({
            companyId: company.id,
            moduleCode: code,
            isEnabled: true,
            enabledBy: user.id,
        }))
    );

    // Create default sequences
    const defaultSequences = [
        { code: "sales_order", prefix: "SO" },
        { code: "purchase_order", prefix: "PO" },
        { code: "invoice", prefix: "INV" },
        { code: "bill", prefix: "BILL" },
        { code: "payment", prefix: "PAY" },
        { code: "delivery", prefix: "DO" },
        { code: "receipt", prefix: "REC" },
        { code: "manufacturing_order", prefix: "MO" },
        { code: "quality_inspection", prefix: "QC" },
        { code: "maintenance_request", prefix: "MR" },
        { code: "ticket", prefix: "TK" },
        { code: "expense", prefix: "EXP" },
    ];

    await db.insert(sequences).values(
        defaultSequences.map((s) => ({
            companyId: company.id,
            code: s.code,
            prefix: s.prefix,
            currentYear: new Date().getFullYear(),
        }))
    );

    // Auto-login
    try {
        await signIn("credentials", {
            email: email.toLowerCase().trim(),
            password,
            redirect: false,
        });
    } catch {
        // sign-in after register can fail silently, user can log in manually
    }

    redirect("/dashboard");
}

// ============================================================================
// LOGOUT
// ============================================================================

export async function logoutAction() {
    await signOut({ redirect: false });
    redirect("/login");
}
