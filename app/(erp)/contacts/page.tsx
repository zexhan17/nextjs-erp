import { getContactsAction } from "./actions";
import { ContactsClient } from "./contacts-client";
import { PageHeader } from "@/components/shared/page-header";

interface Props {
    searchParams: Promise<{
        page?: string;
        search?: string;
        type?: string;
        isOrganization?: string;
    }>;
}

export default async function ContactsPage({ searchParams }: Props) {
    const params = await searchParams;
    const page = parseInt(params.page || "1", 10);
    const { data, total } = await getContactsAction({
        page,
        limit: 25,
        search: params.search,
        type: params.type,
        isOrganization: params.isOrganization,
    });

    return (
        <div className="space-y-6">
            <PageHeader
                title="Contacts"
                description="Manage your customers, vendors, and other contacts."
            />
            <ContactsClient
                contacts={data}
                total={total}
                page={page}
                search={params.search ?? ""}
                typeFilter={params.type ?? "all"}
            />
        </div>
    );
}
