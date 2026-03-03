import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { users, userCompanies, companies, sessions as sessionsTable } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import bcryptjs from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const email = credentials.email as string;
                const password = credentials.password as string;

                const [user] = await db
                    .select()
                    .from(users)
                    .where(eq(users.email, email.toLowerCase()))
                    .limit(1);

                if (!user || !user.passwordHash) return null;
                if (user.status !== "active") return null;

                const valid = await bcryptjs.compare(password, user.passwordHash);
                if (!valid) return null;

                // Update last login
                await db
                    .update(users)
                    .set({ lastLoginAt: new Date() })
                    .where(eq(users.id, user.id));

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.avatar,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger }) {
            // Only fetch from DB on sign-in or explicit update — NOT on every request
            if (user || trigger === "update") {
                const userId = (user?.id ?? token.id) as string;
                token.id = userId;

                const [dbUser] = await db
                    .select()
                    .from(users)
                    .where(eq(users.id, userId))
                    .limit(1);

                if (dbUser) {
                    token.email = dbUser.email;
                    token.name = dbUser.name;
                    token.picture = dbUser.avatar;
                    token.isSuperAdmin = dbUser.isSuperAdmin;

                    const membershipRows = await db
                        .select({
                            companyId: userCompanies.companyId,
                            companyName: companies.name,
                            companySlug: companies.slug,
                            isOwner: userCompanies.isOwner,
                            isDefault: userCompanies.isDefault,
                        })
                        .from(userCompanies)
                        .innerJoin(companies, eq(userCompanies.companyId, companies.id))
                        .where(
                            and(
                                eq(userCompanies.userId, userId),
                                eq(userCompanies.isActive, true)
                            )
                        );

                    const userCompanyList = membershipRows.map((r) => ({
                        id: r.companyId,
                        name: r.companyName,
                        slug: r.companySlug,
                        isOwner: r.isOwner,
                        isDefault: r.isDefault,
                    }));

                    const defaultCompany = userCompanyList.find((c) => c.isDefault) || userCompanyList[0];
                    token.activeCompanyId = defaultCompany?.id ?? null;
                    token.activeCompanyName = defaultCompany?.name ?? null;
                    token.companies = userCompanyList;
                }
            }
            return token;
        },
        async session({ session, token }) {
            // Read everything from the token — zero DB queries
            if (token?.id) {
                session.user.id = token.id as string;
                session.user.email = token.email as string;
                session.user.name = token.name as string;
                session.user.image = token.picture as string | undefined;
                // @ts-expect-error — extending session type
                session.user.isSuperAdmin = token.isSuperAdmin ?? false;
                // @ts-expect-error — extending session type
                session.user.activeCompanyId = token.activeCompanyId ?? null;
                // @ts-expect-error — extending session type
                session.user.activeCompanyName = token.activeCompanyName ?? null;
                // @ts-expect-error — extending session type
                session.user.companies = token.companies ?? [];
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    secret: process.env.AUTH_SECRET,
});
