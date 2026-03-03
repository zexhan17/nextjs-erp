import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/types";

/**
 * Get the current authenticated session user with company info.
 * Throws if not authenticated.
 */
export async function getSessionUser(): Promise<SessionUser> {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("UNAUTHORIZED");
    }

    return {
        id: session.user.id,
        email: session.user.email ?? "",
        name: session.user.name ?? "",
        avatar: session.user.image,
        // @ts-expect-error — extended session
        isSuperAdmin: session.user.isSuperAdmin ?? false,
        // @ts-expect-error — extended session
        activeCompanyId: session.user.activeCompanyId ?? null,
        // @ts-expect-error — extended session
        activeCompanyName: session.user.activeCompanyName ?? null,
        // @ts-expect-error — extended session
        companies: session.user.companies ?? [],
    };
}

/**
 * Get session user or null (no throw).
 */
export async function getOptionalSessionUser(): Promise<SessionUser | null> {
    try {
        return await getSessionUser();
    } catch {
        return null;
    }
}
