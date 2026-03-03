CREATE TYPE "public"."rfq_status" AS ENUM('draft', 'sent', 'quoted', 'accepted', 'rejected', 'expired');--> statement-breakpoint
CREATE TABLE "rfq_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rfq_id" uuid NOT NULL,
	"product_id" uuid,
	"description" text NOT NULL,
	"quantity" numeric(15, 4) DEFAULT '1' NOT NULL,
	"unit_price" numeric(15, 2) DEFAULT '0',
	"discount" numeric(5, 2) DEFAULT '0',
	"tax_rate" numeric(5, 2) DEFAULT '0',
	"line_total" numeric(15, 2) DEFAULT '0' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rfqs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"number" varchar(50) NOT NULL,
	"vendor_id" uuid NOT NULL,
	"status" "rfq_status" DEFAULT 'draft' NOT NULL,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"valid_until" timestamp with time zone,
	"subtotal" numeric(15, 2) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"discount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"total" numeric(15, 2) DEFAULT '0' NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"notes" text,
	"terms" text,
	"purchase_order_id" uuid,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chart_of_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(200) NOT NULL,
	"type" "account_type" NOT NULL,
	"parent_id" uuid,
	"description" text,
	"currency" varchar(3) DEFAULT 'USD',
	"is_active" boolean DEFAULT true,
	"is_reconcilable" boolean DEFAULT false,
	"balance" numeric(15, 2) DEFAULT '0',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "rfq_lines" ADD CONSTRAINT "rfq_lines_rfq_id_rfqs_id_fk" FOREIGN KEY ("rfq_id") REFERENCES "public"."rfqs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfq_lines" ADD CONSTRAINT "rfq_lines_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfqs" ADD CONSTRAINT "rfqs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfqs" ADD CONSTRAINT "rfqs_vendor_id_contacts_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfqs" ADD CONSTRAINT "rfqs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "chart_of_accounts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rfq_lines_rfq_idx" ON "rfq_lines" USING btree ("rfq_id");--> statement-breakpoint
CREATE INDEX "rfqs_company_idx" ON "rfqs" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "rfqs_vendor_idx" ON "rfqs" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "rfqs_status_idx" ON "rfqs" USING btree ("company_id","status");--> statement-breakpoint
CREATE INDEX "coa_company_idx" ON "chart_of_accounts" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "coa_code_idx" ON "chart_of_accounts" USING btree ("company_id","code");--> statement-breakpoint
CREATE INDEX "coa_type_idx" ON "chart_of_accounts" USING btree ("type");