"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Filter } from "lucide-react";

export function AccountLedgerFilters({
    accountId,
    startDate,
    endDate,
}: {
    accountId: string;
    startDate: string;
    endDate: string;
}) {
    const router = useRouter();

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const start = formData.get("startDate") as string;
        const end = formData.get("endDate") as string;

        const sp = new URLSearchParams();
        if (start) sp.set("startDate", start);
        if (end) sp.set("endDate", end);
        sp.set("page", "1");

        router.push(`/accounting/accounts/${accountId}?${sp.toString()}`);
    }

    function handleClear() {
        router.push(`/accounting/accounts/${accountId}`);
    }

    return (
        <Card>
            <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="space-y-1">
                        <Label htmlFor="startDate" className="text-xs">From Date</Label>
                        <Input
                            id="startDate"
                            name="startDate"
                            type="date"
                            defaultValue={startDate}
                            className="w-40"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="endDate" className="text-xs">To Date</Label>
                        <Input
                            id="endDate"
                            name="endDate"
                            type="date"
                            defaultValue={endDate}
                            className="w-40"
                        />
                    </div>
                    <Button type="submit" variant="secondary" size="sm">
                        <Filter className="mr-2 size-4" />
                        Filter
                    </Button>
                    {(startDate || endDate) && (
                        <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
                            Clear
                        </Button>
                    )}
                </form>
            </CardContent>
        </Card>
    );
}
