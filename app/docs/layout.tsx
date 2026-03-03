import { docsSections } from "./nav";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-background">
            {/* Mobile Navigation */}
            <div className="lg:hidden border-b sticky top-0 z-40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
                <ScrollArea>
                    <nav className="flex gap-3 p-4">
                        {docsSections.map((sec) => (
                            <a
                                key={sec.id}
                                href={`#${sec.id}`}
                                className="text-sm font-medium text-primary hover:text-primary/80 whitespace-nowrap transition-colors px-3 py-2 rounded-md hover:bg-muted"
                            >
                                {sec.title}
                            </a>
                        ))}
                    </nav>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </div>

            <div className="flex container mx-auto max-w-7xl">
                {/* Desktop Sidebar */}
                <aside className="hidden lg:flex flex-col w-64 border-r pt-8 pr-6">
                    <div className="space-y-6 sticky top-20 max-h-[calc(100vh-5rem)]">
                        <div>
                            <h3 className="text-sm font-semibold text-muted-foreground mb-4 px-3">Documentation</h3>
                            <ScrollArea className="h-full">
                                <nav className="space-y-1">
                                    {docsSections.map((sec) => (
                                        <a
                                            key={sec.id}
                                            href={`#${sec.id}`}
                                            className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors px-3 py-2.5 rounded-md hover:bg-muted/60 active:text-primary"
                                        >
                                            {sec.title}
                                        </a>
                                    ))}
                                </nav>
                                <Separator className="mt-6" />
                                <ScrollBar orientation="vertical" className="w-2.5" />
                            </ScrollArea>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 px-4 py-8 lg:py-12 lg:px-8">
                    <article className="max-w-3xl">
                        {children}
                    </article>
                </main>
            </div>
        </div>
    );
}
