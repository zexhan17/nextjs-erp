import { notFound } from "next/navigation";
import { getJournalEntryAction, getAccountsAction } from "../../../actions";
import { JournalEntryEditForm } from "./journal-entry-edit-form";

export default async function EditJournalEntryPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const [entry, accounts] = await Promise.all([
        getJournalEntryAction(id),
        getAccountsAction(),
    ]);

    if (!entry) notFound();
    if (entry.status !== "draft") notFound();

    return <JournalEntryEditForm entry={entry} accounts={accounts} />;
}
