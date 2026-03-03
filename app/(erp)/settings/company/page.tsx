import { db } from "@/lib/db";
import { companies } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/session";
import { CompanyForm } from "./company-form";

export default async function CompanySettingsPage() {
    const user = await getSessionUser();
    if (!user.activeCompanyId) {
        return <div>No active company. Please create or join a company.</div>;
    }

    const [company] = await db
        .select()
        .from(companies)
        .where(eq(companies.id, user.activeCompanyId))
        .limit(1);

    if (!company) {
        return <div>Company not found.</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold">Company Profile</h2>
                <p className="text-sm text-muted-foreground">
                    Update your company information and business settings.
                </p>
            </div>
            <CompanyForm company={company} />
        </div>
    );
}
