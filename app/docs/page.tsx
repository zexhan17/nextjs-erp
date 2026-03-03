import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";

const sections = [
    {
        id: "getting-started",
        title: "Getting Started",
        description: "Your first steps in the ERP system",
        content: (
            <>
                <div className="space-y-4">
                    <p>
                        Welcome to your Enterprise Resource Planning (ERP) system! This guide will help you understand
                        how to use each module to manage your business operations efficiently.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-blue-900">💡 Tip:</p>
                        <p className="text-sm text-blue-800 mt-1">
                            The system is organized by business function. Start with the Dashboard to get an overview,
                            then explore each module based on your role.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm mb-2">What is ERP?</h4>
                        <p className="text-sm text-muted-foreground">
                            An ERP system helps you manage all aspects of your business — from sales and purchases
                            to inventory and accounting — in one place. This keeps everything organized, reduces
                            manual work, and gives you better visibility into your business.
                        </p>
                    </div>
                </div>
            </>
        ),
    },
    {
        id: "dashboard",
        title: "Dashboard",
        description: "Get a quick overview of your business",
        content: (
            <>
                <div className="space-y-4">
                    <p>
                        The Dashboard is your home page. When you log in, you'll see quick statistics about your
                        business organized by module. It gives you a bird's-eye view without needing to open
                        individual modules.
                    </p>
                    <div>
                        <h4 className="font-semibold text-sm mb-2">What You'll See:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                            <li><strong>Total Customers:</strong> How many customers you have in the system</li>
                            <li><strong>Pending Orders:</strong> Orders waiting to be fulfilled or completed</li>
                            <li><strong>Stock Levels:</strong> Overview of inventory in your warehouses</li>
                            <li><strong>Outstanding Invoices:</strong> Payments you're waiting to receive</li>
                            <li><strong>Accounts Receivable:</strong> Total money owed to you by customers</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm mb-2">Quick Actions:</h4>
                        <p className="text-sm text-muted-foreground">
                            Click on any stat card to jump directly to that module to take action or view more details.
                        </p>
                    </div>
                </div>
            </>
        ),
    },
    {
        id: "contacts",
        title: "Contacts",
        description: "Manage your customers and suppliers",
        content: (
            <>
                <div className="space-y-4">
                    <p>
                        The Contacts module stores information about everyone you do business with — customers who
                        buy from you and suppliers who sell to you.
                    </p>
                    <div>
                        <h4 className="font-semibold text-sm mb-2">Who Uses This:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                            <li>Sales team — to find customer details before creating orders</li>
                            <li>Purchase team — to find supplier information when buying</li>
                            <li>Customer service — to look up account history and addresses</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm mb-2">Common Tasks:</h4>
                        <ul className="space-y-2 text-sm">
                            <li className="flex gap-2">
                                <span className="font-medium min-w-fit">Add a New Contact:</span>
                                <span className="text-muted-foreground">Click "New" to create a customer or supplier record with their name, phone, email, and address.</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="font-medium min-w-fit">Find a Contact:</span>
                                <span className="text-muted-foreground">Use the search bar or scroll through the list to find an existing contact.</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="font-medium min-w-fit">Update Info:</span>
                                <span className="text-muted-foreground">Click on any contact to view and edit their details, banking info, and addresses.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </>
        ),
    },
    {
        id: "sales",
        title: "Sales",
        description: "Track customer orders and payments",
        content: (
            <>
                <div className="space-y-4">
                    <p>
                        The Sales module handles everything related to selling — from creating a quote for a potential
                        customer to invoicing them after delivery.
                    </p>
                    <div>
                        <h4 className="font-semibold text-sm mb-2">Key Sections:</h4>
                        <div className="space-y-3 text-sm">
                            <div>
                                <span className="font-medium block mb-1">📋 Orders</span>
                                <span className="text-muted-foreground">Create and track sales orders from customers. Each order contains line items (products), quantities, and prices.</span>
                            </div>
                            <div>
                                <span className="font-medium block mb-1">📄 Invoices</span>
                                <span className="text-muted-foreground">Generate invoices from orders to send to customers for payment. Track which invoices have been paid.</span>
                            </div>
                            <div>
                                <span className="font-medium block mb-1">🎯 Quotations</span>
                                <span className="text-muted-foreground">Send price quotes to potential customers before they commit to an order.</span>
                            </div>
                            <div>
                                <span className="font-medium block mb-1">💰 Payments</span>
                                <span className="text-muted-foreground">Record when customers pay their invoices. Track payment status and amounts.</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm mb-2">Typical Sales Flow:</h4>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                            <li>Send a Quotation to a customer</li>
                            <li>Customer agrees → Create a Sales Order</li>
                            <li>Items are shipped → Generate an Invoice</li>
                            <li>Customer pays → Record the Payment</li>
                        </ol>
                    </div>
                </div>
            </>
        ),
    },
    {
        id: "purchase",
        title: "Purchase",
        description: "Manage orders and payments to suppliers",
        content: (
            <>
                <div className="space-y-4">
                    <p>
                        The Purchase module handles buying from suppliers — creating purchase orders and tracking
                        vendor bills and payments.
                    </p>
                    <div>
                        <h4 className="font-semibold text-sm mb-2">Key Sections:</h4>
                        <div className="space-y-3 text-sm">
                            <div>
                                <span className="font-medium block mb-1">📋 Orders</span>
                                <span className="text-muted-foreground">Create purchase orders (POs) to buy products from suppliers. Specify quantities, prices, and delivery dates.</span>
                            </div>
                            <div>
                                <span className="font-medium block mb-1">📄 Bills</span>
                                <span className="text-muted-foreground">Record vendor bills received from suppliers. Match them with purchase orders to verify accuracy.</span>
                            </div>
                            <div>
                                <span className="font-medium block mb-1">💰 Payments</span>
                                <span className="text-muted-foreground">Track and record payments to suppliers. Know how much you owe and payment due dates.</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm mb-2">Typical Purchase Flow:</h4>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                            <li>Create a Purchase Order with the supplier</li>
                            <li>Goods are received → Update the order status</li>
                            <li>Supplier sends a Bill → Record it in the system</li>
                            <li>Make Payment → Record the payment and mark bill as paid</li>
                        </ol>
                    </div>
                </div>
            </>
        ),
    },
    {
        id: "inventory",
        title: "Inventory",
        description: "Track your products and warehouse stock",
        content: (
            <>
                <div className="space-y-4">
                    <p>
                        The Inventory module tracks all the products your business sells or uses, and their current
                        stock levels across warehouses.
                    </p>
                    <div>
                        <h4 className="font-semibold text-sm mb-2">Key Sections:</h4>
                        <div className="space-y-3 text-sm">
                            <div>
                                <span className="font-medium block mb-1">📦 Products</span>
                                <span className="text-muted-foreground">Add and manage your product catalog. Set prices, descriptions, SKU codes, and unit of measurement (pieces, kg, liters, etc).</span>
                            </div>
                            <div>
                                <span className="font-medium block mb-1">🏷️ Categories</span>
                                <span className="text-muted-foreground">Organize products into groups — e.g., "Electronics", "Clothing", "Food" — for easier management.</span>
                            </div>
                            <div>
                                <span className="font-medium block mb-1">🏭 Warehouses</span>
                                <span className="text-muted-foreground">Set up your storage locations. Track stock across multiple warehouses or storage areas.</span>
                            </div>
                            <div>
                                <span className="font-medium block mb-1">📊 Stock Moves</span>
                                <span className="text-muted-foreground">View the history of inventory movements — when products were added, sold, or transferred.</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm font-medium text-yellow-900">⚠️ Important:</p>
                        <p className="text-sm text-yellow-800 mt-1">
                            Accurate inventory is critical. When stock comes in (purchases) or goes out (sales),
                            update the system so you always know what's available.
                        </p>
                    </div>
                </div>
            </>
        ),
    },
    {
        id: "accounting",
        title: "Accounting",
        description: "Keep your finances organized",
        content: (
            <>
                <div className="space-y-4">
                    <p>
                        The Accounting module tracks all your financial transactions — money in, money out, and
                        balances — in a standardized format your accountant will recognize.
                    </p>
                    <div>
                        <h4 className="font-semibold text-sm mb-2">Key Sections:</h4>
                        <div className="space-y-3 text-sm">
                            <div>
                                <span className="font-medium block mb-1">📊 Chart of Accounts</span>
                                <span className="text-muted-foreground">Your "account tree" — organized list of all financial accounts (e.g., Cash, Bank, Sales, Expenses). Set this up with your accountant.</span>
                            </div>
                            <div>
                                <span className="font-medium block mb-1">📔 Journals</span>
                                <span className="text-muted-foreground">Record financial transactions. Each transaction affects two accounts (double-entry bookkeeping) to keep books balanced.</span>
                            </div>
                            <div>
                                <span className="font-medium block mb-1">📅 Fiscal Years</span>
                                <span className="text-muted-foreground">Define your accounting periods. Close out years to lock historical data and start fresh for each period.</span>
                            </div>
                            <div>
                                <span className="font-medium block mb-1">🧮 Taxes</span>
                                <span className="text-muted-foreground">Set up tax rates and track tax obligations for government reporting.</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm font-medium text-blue-900">💡 Note:</p>
                        <p className="text-sm text-blue-800 mt-1">
                            Most transactions here happen automatically when you create sales orders, purchase orders,
                            and invoices. Manual entries are for special transactions.
                        </p>
                    </div>
                </div>
            </>
        ),
    },
    {
        id: "settings",
        title: "Settings",
        description: "Configure your account and permissions",
        content: (
            <>
                <div className="space-y-4">
                    <p>
                        Settings let you configure your company details, manage team members, set permissions, and
                        control which features are available.
                    </p>
                    <div>
                        <h4 className="font-semibold text-sm mb-2">Key Areas:</h4>
                        <div className="space-y-3 text-sm">
                            <div>
                                <span className="font-medium block mb-1">🏢 Company</span>
                                <span className="text-muted-foreground">Update your company name, address, phone, email, and currency. This info appears on invoices and reports.</span>
                            </div>
                            <div>
                                <span className="font-medium block mb-1">👥 Users</span>
                                <span className="text-muted-foreground">Add team members and give them access to the system. Invite them via email to create their accounts.</span>
                            </div>
                            <div>
                                <span className="font-medium block mb-1">🔐 Roles & Permissions</span>
                                <span className="text-muted-foreground">Create custom roles (Admin, Salesperson, Accountant) and decide who can view/edit what. Restrict sensitive areas to authorized users only.</span>
                            </div>
                            <div>
                                <span className="font-medium block mb-1">⚙️ Modules</span>
                                <span className="text-muted-foreground">Enable or disable features. Turn off modules you don't use to simplify the interface for your team.</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm mb-2">Who Can Access Settings?</h4>
                        <p className="text-sm text-muted-foreground">
                            Only company admins can change settings. If you need to adjust something, contact your administrator.
                        </p>
                    </div>
                </div>
            </>
        ),
    },
    {
        id: "tips",
        title: "Tips & Best Practices",
        description: "Get the most out of your ERP system",
        content: (
            <>
                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold text-sm mb-2">1. Keep Data Clean</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                            <li>Accurate contacts — wrong customer info leads to delivery problems</li>
                            <li>Correct inventory — outdated stock levels cause overselling</li>
                            <li>Timely transactions — record sales and purchases when they happen</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm mb-2">2. Use Standard Workflows</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                            <li>Sales: Quote → Order → Invoice → Payment</li>
                            <li>Purchase: Order → Receipt → Bill → Payment</li>
                            <li>Inventory: Products ← Stock Updates ← Sales &amp; Purchases</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm mb-2">3. Review Reports Regularly</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                            <li>Check the Dashboard daily for pending actions</li>
                            <li>Monitor outstanding invoices to collect payments</li>
                            <li>Watch inventory levels to avoid stockouts</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm mb-2">4. Set Clear Permissions</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                            <li>Salespeople should only see sales-related data</li>
                            <li>Keep accounting records restricted to authorized staff</li>
                            <li>Use roles to prevent unauthorized changes</li>
                        </ul>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm font-medium text-green-900">✅ Pro Tip:</p>
                        <p className="text-sm text-green-800 mt-1">
                            The system is designed so data flows automatically. When you create a sales order, the
                            system tracks inventory, prepares invoices, and records accounting entries. You don't need
                            to enter the same data multiple times.
                        </p>
                    </div>
                </div>
            </>
        ),
    },
];

export default function DocsPage() {
    return (
        <div className="space-y-12">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight">User Guide</h1>
                <p className="text-xl text-muted-foreground">
                    Learn how to manage your business operations using the ERP system.
                </p>
            </div>

            {/* Sections */}
            <div className="space-y-8">
                {sections.map((section) => (
                    <Card key={section.id} id={section.id} className="scroll-mt-20">
                        <CardHeader>
                            <div className="space-y-2">
                                <CardTitle className="text-2xl">{section.title}</CardTitle>
                                <CardDescription className="text-base">{section.description}</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="prose prose-sm max-w-none text-muted-foreground">
                                {section.content}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Footer Help Section */}
            <Card className="bg-linear-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader>
                    <CardTitle className="text-lg">Still Have Questions?</CardTitle>
                    <CardDescription>
                        This guide covers the main features. For specific assistance, contact your system administrator
                        or your manager.
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
}
