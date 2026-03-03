"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { postJournalEntryAction, cancelJournalEntryAction, deleteJournalEntryAction } from "../../actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function JEStatusActions({
    entryId,
    currentStatus,
}: {
    entryId: string;
    currentStatus: string;
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    if (currentStatus !== "draft") return null;

    async function handlePost() {
        startTransition(async () => {
            const res = await postJournalEntryAction(entryId);
            if (res.error) toast.error(res.error);
            else {
                toast.success("Entry posted — account balances updated");
                router.refresh();
            }
        });
    }

    async function handleCancel() {
        if (!confirm("Cancel this journal entry?")) return;
        startTransition(async () => {
            const res = await cancelJournalEntryAction(entryId);
            if (res.error) toast.error(res.error);
            else {
                toast.success("Entry cancelled");
                router.refresh();
            }
        });
    }

    async function handleDelete() {
        if (!confirm("Delete this draft journal entry? This cannot be undone.")) return;
        startTransition(async () => {
            const res = await deleteJournalEntryAction(entryId);
            if (res.error) toast.error(res.error);
            else {
                toast.success("Entry deleted");
                router.push("/accounting/journal");
            }
        });
    }

    return (
        <div className="flex items-center gap-2">
            <Button onClick={handlePost} disabled={isPending}>
                Post Entry
            </Button>
            <Button variant="outline" onClick={handleCancel} disabled={isPending}>
                Cancel Entry
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
                Delete
            </Button>
        </div>
    );
}
