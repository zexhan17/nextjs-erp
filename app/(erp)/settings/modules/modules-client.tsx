"use client";

import { useTransition } from "react";
import { toggleModuleAction } from "../actions";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Package,
    Users,
    ShoppingCart,
    PackageCheck,
    Target,
    Warehouse,
    Factory,
    CheckCircle,
    Calculator,
    Monitor,
    UserCog,
    FolderKanban,
    LifeBuoy,
    Building,
    Wrench,
    Car,
    FileText,
    BarChart3,
    Repeat,
    Settings,
    type LucideIcon,
    AlertCircle,
    Lock,
} from "lucide-react";
import type { ModuleCode, ModuleDefinition } from "@/lib/types";

const iconMap: Record<string, LucideIcon> = {
    Package,
    Users,
    ShoppingCart,
    PackageCheck,
    Target,
    Warehouse,
    Factory,
    CheckCircle,
    Calculator,
    Monitor,
    UserCog,
    FolderKanban,
    LifeBuoy,
    Building,
    Wrench,
    Car,
    FileText,
    BarChart3,
    Repeat,
    Settings,
};

const categoryColors: Record<string, string> = {
    core: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    operations: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    finance: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    people: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    support: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
};

interface ModuleItem extends ModuleDefinition {
    isEnabled: boolean;
    enabledAt: Date | null;
    dependenciesMet: boolean;
}

export function ModulesClient({ modules }: { modules: ModuleItem[] }) {
    const [isPending, startTransition] = useTransition();

    // Group by category
    const grouped = modules.reduce<Record<string, ModuleItem[]>>((acc, mod) => {
        if (!acc[mod.category]) acc[mod.category] = [];
        acc[mod.category].push(mod);
        return acc;
    }, {});

    const categoryLabels: Record<string, string> = {
        core: "Core Modules",
        operations: "Operations",
        finance: "Finance",
        people: "People",
        support: "Support",
    };

    const categoryOrder = ["core", "operations", "finance", "people", "support"];

    function handleToggle(moduleCode: ModuleCode, enabled: boolean) {
        startTransition(async () => {
            await toggleModuleAction(moduleCode, enabled);
        });
    }

    return (
        <TooltipProvider>
            <div className="space-y-8">
                {categoryOrder
                    .filter((cat) => grouped[cat]?.length)
                    .map((category) => (
                        <div key={category} className="space-y-3">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                {categoryLabels[category]}
                            </h3>
                            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                {grouped[category]
                                    .sort((a, b) => a.sortOrder - b.sortOrder)
                                    .map((mod) => {
                                        const Icon = iconMap[mod.icon] ?? Package;
                                        const canToggle = !mod.isCore && mod.dependenciesMet;
                                        const missingDeps = mod.dependsOn.filter(
                                            (dep) => !modules.find((m) => m.code === dep)?.isEnabled
                                        );

                                        return (
                                            <Card
                                                key={mod.code}
                                                className={
                                                    mod.isEnabled
                                                        ? "border-primary/30 bg-primary/5"
                                                        : "opacity-75"
                                                }
                                            >
                                                <CardHeader className="pb-2">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-center gap-2.5">
                                                            <div
                                                                className={`flex items-center justify-center rounded-md p-1.5 ${mod.isEnabled
                                                                        ? "bg-primary/10 text-primary"
                                                                        : "bg-muted text-muted-foreground"
                                                                    }`}
                                                            >
                                                                <Icon className="size-4" />
                                                            </div>
                                                            <div>
                                                                <CardTitle className="text-sm font-medium">
                                                                    {mod.name}
                                                                </CardTitle>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {mod.isCore ? (
                                                                <Tooltip>
                                                                    <TooltipTrigger>
                                                                        <Lock className="size-3.5 text-muted-foreground" />
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        Core module — always enabled
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            ) : !mod.dependenciesMet ? (
                                                                <Tooltip>
                                                                    <TooltipTrigger>
                                                                        <AlertCircle className="size-3.5 text-amber-500" />
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        Requires: {missingDeps.join(", ")}
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            ) : null}
                                                            <Switch
                                                                checked={mod.isEnabled}
                                                                disabled={mod.isCore || !mod.dependenciesMet || isPending}
                                                                onCheckedChange={(checked) =>
                                                                    handleToggle(mod.code, checked)
                                                                }
                                                            />
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="pt-0">
                                                    <CardDescription className="text-xs">
                                                        {mod.description}
                                                    </CardDescription>
                                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                                        <Badge
                                                            variant="outline"
                                                            className={`text-[10px] px-1.5 py-0 ${categoryColors[mod.category] ?? ""
                                                                }`}
                                                        >
                                                            {mod.category}
                                                        </Badge>
                                                        {mod.dependsOn.length > 0 && (
                                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                                needs: {mod.dependsOn.join(", ")}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                            </div>
                        </div>
                    ))}
            </div>
        </TooltipProvider>
    );
}
