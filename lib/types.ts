// ============================================================================
// SHARED TYPES
// ============================================================================

/** All available module codes */
export const MODULE_CODES = [
    "contacts",
    "crm",
    "sales",
    "purchase",
    "inventory",
    "warehouse",
    "manufacturing",
    "quality",
    "accounting",
    "pos",
    "hr",
    "projects",
    "helpdesk",
    "assets",
    "maintenance",
    "fleet",
    "documents",
    "reports",
    "subscriptions",
    "settings",
] as const;

export type ModuleCode = (typeof MODULE_CODES)[number];

/** Module definition for the registry */
export interface ModuleDefinition {
    code: ModuleCode;
    name: string;
    description: string;
    icon: string;
    category: "core" | "operations" | "finance" | "people" | "support";
    dependsOn: ModuleCode[];
    isCore: boolean; // true = always enabled, cannot be disabled
    sortOrder: number;
}

/** Full module registry — source of truth for what modules exist */
export const MODULE_REGISTRY: ModuleDefinition[] = [
    {
        code: "settings",
        name: "Settings",
        description: "System settings, company setup, user management",
        icon: "Settings",
        category: "core",
        dependsOn: [],
        isCore: true,
        sortOrder: 0,
    },
    {
        code: "contacts",
        name: "Contacts",
        description: "People & organizations — customers, vendors, employees",
        icon: "Users",
        category: "core",
        dependsOn: [],
        isCore: true,
        sortOrder: 1,
    },
    {
        code: "crm",
        name: "CRM",
        description: "Leads, opportunities, sales pipeline, activities",
        icon: "Target",
        category: "operations",
        dependsOn: ["contacts"],
        isCore: false,
        sortOrder: 10,
    },
    {
        code: "sales",
        name: "Sales",
        description: "Quotations, sales orders, price lists, invoicing",
        icon: "ShoppingCart",
        category: "operations",
        dependsOn: ["contacts", "inventory"],
        isCore: false,
        sortOrder: 11,
    },
    {
        code: "purchase",
        name: "Purchase",
        description: "Purchase requests, RFQs, purchase orders, vendor bills",
        icon: "PackageCheck",
        category: "operations",
        dependsOn: ["contacts", "inventory"],
        isCore: false,
        sortOrder: 12,
    },
    {
        code: "inventory",
        name: "Inventory",
        description: "Products, stock levels, warehouses, stock movements",
        icon: "Package",
        category: "operations",
        dependsOn: [],
        isCore: false,
        sortOrder: 13,
    },
    {
        code: "warehouse",
        name: "Warehouse",
        description: "Advanced warehouse operations — picking, packing, shipping",
        icon: "Warehouse",
        category: "operations",
        dependsOn: ["inventory"],
        isCore: false,
        sortOrder: 14,
    },
    {
        code: "manufacturing",
        name: "Manufacturing",
        description: "Bill of materials, production orders, MRP, shop floor",
        icon: "Factory",
        category: "operations",
        dependsOn: ["inventory"],
        isCore: false,
        sortOrder: 15,
    },
    {
        code: "quality",
        name: "Quality Control",
        description: "Inspections, quality checks, non-conformance reports",
        icon: "CheckCircle",
        category: "operations",
        dependsOn: ["inventory"],
        isCore: false,
        sortOrder: 16,
    },
    {
        code: "accounting",
        name: "Accounting",
        description: "Chart of accounts, journal entries, invoices, payments, reports",
        icon: "Calculator",
        category: "finance",
        dependsOn: ["contacts"],
        isCore: false,
        sortOrder: 20,
    },
    {
        code: "pos",
        name: "Point of Sale",
        description: "Retail & restaurant POS, payments, receipts, sessions",
        icon: "Monitor",
        category: "finance",
        dependsOn: ["inventory"],
        isCore: false,
        sortOrder: 21,
    },
    {
        code: "hr",
        name: "Human Resources",
        description: "Employees, attendance, leave, payroll, recruitment",
        icon: "UserCog",
        category: "people",
        dependsOn: ["contacts"],
        isCore: false,
        sortOrder: 30,
    },
    {
        code: "projects",
        name: "Projects",
        description: "Projects, tasks, Gantt charts, timesheets, milestones",
        icon: "FolderKanban",
        category: "people",
        dependsOn: [],
        isCore: false,
        sortOrder: 31,
    },
    {
        code: "helpdesk",
        name: "Helpdesk",
        description: "Support tickets, SLA tracking, knowledge base",
        icon: "LifeBuoy",
        category: "support",
        dependsOn: ["contacts"],
        isCore: false,
        sortOrder: 40,
    },
    {
        code: "assets",
        name: "Assets",
        description: "Fixed asset tracking, depreciation, maintenance scheduling",
        icon: "Building",
        category: "finance",
        dependsOn: ["accounting"],
        isCore: false,
        sortOrder: 22,
    },
    {
        code: "maintenance",
        name: "Maintenance",
        description: "Equipment management, preventive & corrective maintenance",
        icon: "Wrench",
        category: "operations",
        dependsOn: [],
        isCore: false,
        sortOrder: 17,
    },
    {
        code: "fleet",
        name: "Fleet",
        description: "Vehicle management, fuel logs, maintenance, assignments",
        icon: "Car",
        category: "operations",
        dependsOn: [],
        isCore: false,
        sortOrder: 18,
    },
    {
        code: "documents",
        name: "Documents",
        description: "Document management, versioning, sharing",
        icon: "FileText",
        category: "support",
        dependsOn: [],
        isCore: false,
        sortOrder: 41,
    },
    {
        code: "reports",
        name: "Reports",
        description: "Report builder, scheduled reports, analytics",
        icon: "BarChart3",
        category: "support",
        dependsOn: [],
        isCore: false,
        sortOrder: 42,
    },
    {
        code: "subscriptions",
        name: "Subscriptions",
        description: "Recurring invoicing, subscription plans, MRR tracking",
        icon: "RefreshCw",
        category: "finance",
        dependsOn: ["accounting", "contacts"],
        isCore: false,
        sortOrder: 23,
    },
];

// ============================================================================
// API TYPES
// ============================================================================

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    meta?: PaginationMeta;
    error?: ApiError;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface ApiError {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
}

export interface PaginationParams {
    page?: number;
    limit?: number;
    sort?: string;
    search?: string;
    filters?: Record<string, string | string[]>;
}

// ============================================================================
// AUTH TYPES
// ============================================================================

export interface SessionUser {
    id: string;
    email: string;
    name: string;
    avatar?: string | null;
    isSuperAdmin: boolean;
    activeCompanyId: string | null;
    activeCompanyName?: string | null;
    companies: Array<{
        id: string;
        name: string;
        slug: string;
        isOwner: boolean;
        isDefault: boolean;
    }>;
}

// ============================================================================
// ERROR CLASSES
// ============================================================================

export class AppError extends Error {
    constructor(
        public code: string,
        message: string,
        public statusCode: number = 400
    ) {
        super(message);
        this.name = "AppError";
    }
}

export class NotFoundError extends AppError {
    constructor(resource: string, id: string) {
        super("NOT_FOUND", `${resource} with ID ${id} not found`, 404);
    }
}

export class ForbiddenError extends AppError {
    constructor(message = "You do not have permission to perform this action") {
        super("FORBIDDEN", message, 403);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = "Authentication required") {
        super("UNAUTHORIZED", message, 401);
    }
}

export class ValidationError extends AppError {
    constructor(public details: Array<{ field: string; message: string }>) {
        super("VALIDATION_ERROR", "Validation failed", 422);
    }
}

export class ConflictError extends AppError {
    constructor(message: string) {
        super("CONFLICT", message, 409);
    }
}
