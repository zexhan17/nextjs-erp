import { type ReactNode, type ElementType } from "react";
import { PackageOpen } from "lucide-react";

interface EmptyStateProps {
    icon?: ElementType;
    title: string;
    description?: string;
    action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                {Icon ? <Icon className="size-6 text-muted-foreground" /> : <PackageOpen className="size-6 text-muted-foreground" />}
            </div>
            <h3 className="mt-4 text-lg font-semibold">{title}</h3>
            {description && (
                <p className="mt-2 text-sm text-muted-foreground max-w-sm">{description}</p>
            )}
            {action && <div className="mt-6">{action}</div>}
        </div>
    );
}
