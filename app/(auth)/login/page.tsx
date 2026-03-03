"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
    const [state, formAction, isPending] = useActionState(
        async (_prev: { error?: string } | null, formData: FormData) => {
            return await loginAction(formData);
        },
        null
    );

    return (
        <Card>
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">NextERP</CardTitle>
                <CardDescription>Sign in to your account</CardDescription>
            </CardHeader>
            <form action={formAction}>
                <CardContent className="space-y-4">
                    {state?.error && (
                        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                            {state.error}
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="you@company.com"
                            required
                            autoComplete="email"
                            autoFocus
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            required
                            autoComplete="current-password"
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 pt-3">
                    <Button type="submit" className="w-full" disabled={isPending}>
                        {isPending ? "Signing in..." : "Sign In"}
                    </Button>
                    <p className="text-sm text-muted-foreground">
                        Don&apos;t have an account?{" "}
                        <Link href="/register" className="text-primary underline-offset-4 hover:underline">
                            Create one
                        </Link>
                    </p>
                </CardFooter>
            </form>
        </Card>
    );
}
