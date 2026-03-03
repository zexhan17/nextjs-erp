import { getAccountsAction } from "../../actions";
import { JournalEntryForm } from "./journal-entry-form";

export default async function NewJournalEntryPage() {
    const accountsList = await getAccountsAction();

    return <JournalEntryForm accounts={accountsList} />;
}
