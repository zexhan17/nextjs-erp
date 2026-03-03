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
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (token?.id) {
                const userId = token.id as string;

                // Get user with companies
                const [dbUser] = await db
                    .select()
                    .from(users)
                    .where(eq(users.id, userId))
                    .limit(1);

                if (dbUser) {
                    const membershipRows = await db
                        .select({
                            companyId: userCompanies.companyId,
                            companyName: companies.name,
                            companySlug: companies.slug,
                            isOwner: userCompanies.isOwner,
                            isDefault: userCompanies.isDefault,
                            isActive: userCompanies.isActive,
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

                    // Determine active company
                    const defaultCompany = userCompanyList.find((c) => c.isDefault) || userCompanyList[0];

                    session.user.id = dbUser.id;
                    session.user.email = dbUser.email;
                    session.user.name = dbUser.name;
                    session.user.image = dbUser.avatar;
                    // @ts-expect-error — extending session type
                    session.user.isSuperAdmin = dbUser.isSuperAdmin;
                    // @ts-expect-error — extending session type
                    session.user.activeCompanyId = defaultCompany?.id ?? null;
                    // @ts-expect-error — extending session type
                    session.user.activeCompanyName = defaultCompany?.name ?? null;
                    // @ts-expect-error — extending session type
                    session.user.companies = userCompanyList;
                }
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
