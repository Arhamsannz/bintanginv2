CREATE TABLE "cards" (
	"id" serial PRIMARY KEY,
	"code" text NOT NULL UNIQUE,
	"status" text DEFAULT 'INACTIVE' NOT NULL,
	"shop_name" text,
	"review_url" text,
	"whatsapp" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"activated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "scans" (
	"id" serial PRIMARY KEY,
	"card_id" integer NOT NULL,
	"scanned_at" timestamp DEFAULT now() NOT NULL,
	"user_agent" text
);
--> statement-breakpoint
ALTER TABLE "scans" ADD CONSTRAINT "scans_card_id_cards_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id");