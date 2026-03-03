import Link from "next/link";
import { getJournalEntriesAction } from "../actions";
import { JournalClient } from "./journal-client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function JournalEntriesPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | undefined>>;
}) {
    const params = await searchParams;
    const page = parseInt(params.page ?? "1", 10);
    const search = params.search ?? "";
    const status = params.status ?? "all";

    const { data, total } = await getJournalEntriesAction({ page, search, status });

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">Journal Entries</h2>
                    <p className="text-sm text-muted-foreground">
                        Record and manage double-entry accounting transactions.
                    </p>
                </div>
                <Link href="/accounting/journal/new">
                    <Button>
                        <Plus className="mr-2 size-4" />
                        New Entry
                    </Button>
                </Link>
            </div>
            <JournalClient
                entries={data}
                total={total}
                page={page}
                search={search}
                status={status}
            />
        </div>
    );
}
