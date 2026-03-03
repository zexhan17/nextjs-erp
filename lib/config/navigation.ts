import type { ModuleCode } from "@/lib/types";

export interface NavItem {
    title: string;
    href: string;
    icon: string;
    module?: ModuleCode; // if set, only show when module is enabled
    children?: NavItem[];
}

export interface NavGroup {
    label: string;
    items: NavItem[];
}

/**
 * Full navigation structure.
 * Items with a `module` property are only shown when that module is enabled for the active company.
 * Items without `module` are always shown.
 */
export const navigationConfig: NavGroup[] = [
    {
        label: "Main",
        items: [
            {
                title: "Dashboard",
                href: "/dashboard",
                icon: "LayoutDashboard",
            },
        ],
    },
    {
        label: "Operations",
        items: [
            {
                title: "Contacts",
                href: "/contacts",
                icon: "Users",
                module: "contacts",
            },
            {
                title: "CRM",
                href: "/crm",
                icon: "Target",
                module: "crm",
                children: [
                    { title: "Leads", href: "/crm/leads", icon: "UserPlus" },
                    { title: "Opportunities", href: "/crm/opportunities", icon: "TrendingUp" },
                    { title: "Pipeline", href: "/crm/pipeline", icon: "KanbanSquare" },
                ],
            },
            {
                title: "Sales",
                href: "/sales",
                icon: "ShoppingCart",
                module: "sales",
                children: [
                    { title: "Quotations", href: "/sales/orders?type=quotation", icon: "FileText" },
                    { title: "Orders", href: "/sales/orders", icon: "ClipboardList" },
                    { title: "Price Lists", href: "/sales/price-lists", icon: "Tag" },
                ],
            },
            {
                title: "Purchase",
                href: "/purchase",
                icon: "PackageCheck",
                module: "purchase",
                children: [
                    { title: "RFQs", href: "/purchase/rfqs", icon: "FileQuestion" },
                    { title: "Orders", href: "/purchase/orders", icon: "ClipboardList" },
                ],
            },
            {
                title: "Inventory",
                href: "/inventory",
                icon: "Package",
                module: "inventory",
                children: [
                    { title: "Products", href: "/inventory/products", icon: "Box" },
                    { title: "Stock Levels", href: "/inventory/stock", icon: "BarChart3" },
                    { title: "Warehouses", href: "/inventory/warehouses", icon: "Warehouse" },
                    { title: "Categories", href: "/inventory/categories", icon: "FolderTree" },
                ],
            },
            {
                title: "Warehouse",
                href: "/warehouse",
                icon: "Warehouse",
                module: "warehouse",
                children: [
                    { title: "Picking", href: "/warehouse/picking", icon: "PackageSearch" },
                    { title: "Packing", href: "/warehouse/packing", icon: "PackagePlus" },
                ],
            },
            {
                title: "Manufacturing",
                href: "/manufacturing",
                icon: "Factory",
                module: "manufacturing",
                children: [
                    { title: "BOMs", href: "/manufacturing/boms", icon: "FileSpreadsheet" },
                    { title: "Production Orders", href: "/manufacturing/orders", icon: "ClipboardList" },
                    { title: "Work Centers", href: "/manufacturing/work-centers", icon: "Cpu" },
                    { title: "Planning", href: "/manufacturing/planning", icon: "Calendar" },
                ],
            },
            {
                title: "Quality",
                href: "/quality",
                icon: "CheckCircle",
                module: "quality",
                children: [
                    { title: "Inspections", href: "/quality/inspections", icon: "Search" },
                    { title: "NCRs", href: "/quality/ncr", icon: "AlertTriangle" },
                ],
            },
            {
                title: "Maintenance",
                href: "/maintenance",
                icon: "Wrench",
                module: "maintenance",
                children: [
                    { title: "Equipment", href: "/maintenance/equipment", icon: "Cog" },
                    { title: "Requests", href: "/maintenance/requests", icon: "ClipboardList" },
                ],
            },
            {
                title: "Fleet",
                href: "/fleet",
                icon: "Car",
                module: "fleet",
                children: [
                    { title: "Vehicles", href: "/fleet/vehicles", icon: "Truck" },
                    { title: "Fuel Logs", href: "/fleet/fuel-logs", icon: "Fuel" },
                ],
            },
        ],
    },
    {
        label: "Finance",
        items: [
            {
                title: "Accounting",
                href: "/accounting",
                icon: "Calculator",
                module: "accounting",
                children: [
                    { title: "Dashboard", href: "/accounting/dashboard", icon: "LayoutDashboard" },
                    { title: "Invoices", href: "/accounting/invoices", icon: "Receipt" },
                    { title: "Bills", href: "/accounting/bills", icon: "FileText" },
                    { title: "Payments", href: "/accounting/payments", icon: "CreditCard" },
                    { title: "Journal Entries", href: "/accounting/journal-entries", icon: "BookOpen" },
                    { title: "Bank Reconciliation", href: "/accounting/bank-reconciliation", icon: "Landmark" },
                    { title: "Chart of Accounts", href: "/accounting/chart-of-accounts", icon: "Network" },
                    { title: "Reports", href: "/accounting/reports", icon: "BarChart3" },
                ],
            },
            {
                title: "Point of Sale",
                href: "/pos",
                icon: "Monitor",
                module: "pos",
                children: [
                    { title: "Open POS", href: "/pos/terminal", icon: "MonitorPlay" },
                    { title: "Sessions", href: "/pos/sessions", icon: "Clock" },
                    { title: "Orders", href: "/pos/orders", icon: "Receipt" },
                ],
            },
            {
                title: "Assets",
                href: "/assets",
                icon: "Building",
                module: "assets",
                children: [
                    { title: "Assets", href: "/assets/list", icon: "Building2" },
                    { title: "Depreciation", href: "/assets/depreciation", icon: "TrendingDown" },
                ],
            },
            {
                title: "Subscriptions",
                href: "/subscriptions",
                icon: "RefreshCw",
                module: "subscriptions",
            },
        ],
    },
    {
        label: "People",
        items: [
            {
                title: "HR",
                href: "/hr",
                icon: "UserCog",
                module: "hr",
                children: [
                    { title: "Employees", href: "/hr/employees", icon: "Users" },
                    { title: "Attendance", href: "/hr/attendance", icon: "Clock" },
                    { title: "Leaves", href: "/hr/leaves", icon: "CalendarOff" },
                    { title: "Payroll", href: "/hr/payroll", icon: "Banknote" },
                    { title: "Expenses", href: "/hr/expenses", icon: "Receipt" },
                    { title: "Recruitment", href: "/hr/recruitment", icon: "UserPlus" },
                ],
            },
            {
                title: "Projects",
                href: "/projects",
                icon: "FolderKanban",
                module: "projects",
                children: [
                    { title: "Projects", href: "/projects/list", icon: "Folder" },
                    { title: "Tasks", href: "/projects/tasks", icon: "CheckSquare" },
                    { title: "Timesheets", href: "/projects/timesheets", icon: "Timer" },
                ],
            },
        ],
    },
    {
        label: "Support",
        items: [
            {
                title: "Helpdesk",
                href: "/helpdesk",
                icon: "LifeBuoy",
                module: "helpdesk",
                children: [
                    { title: "Tickets", href: "/helpdesk/tickets", icon: "Ticket" },
                    { title: "Knowledge Base", href: "/helpdesk/knowledge-base", icon: "BookOpen" },
                ],
            },
            {
                title: "Documents",
                href: "/documents",
                icon: "FileText",
                module: "documents",
            },
            {
                title: "Reports",
                href: "/reports",
                icon: "BarChart3",
                module: "reports",
            },
        ],
    },
    {
        label: "Administration",
        items: [
            {
                title: "Settings",
                href: "/settings",
                icon: "Settings",
                module: "settings",
                children: [
                    { title: "Company", href: "/settings/company", icon: "Building" },
                    { title: "Users", href: "/settings/users", icon: "Users" },
                    { title: "Roles", href: "/settings/roles", icon: "Shield" },
                    { title: "Modules", href: "/settings/modules", icon: "Puzzle" },
                ],
            },
        ],
    },
];
