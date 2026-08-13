CREATE TABLE "queue_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"requester_guest_id" uuid NOT NULL,
	"requester_display_name" varchar(100) NOT NULL,
	"idempotency_key" uuid NOT NULL,
	"sequence" integer NOT NULL,
	"position_at_addition" integer NOT NULL,
	"video_id" varchar(11) NOT NULL,
	"video_title" varchar(500) NOT NULL,
	"video_channel" varchar(255) NOT NULL,
	"video_thumbnail_url" varchar(2048) NOT NULL,
	"video_duration_seconds" integer,
	"status" varchar(16) DEFAULT 'queued' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	CONSTRAINT "queue_items_sequence_check" CHECK ("queue_items"."sequence" > 0),
	CONSTRAINT "queue_items_position_at_addition_check" CHECK ("queue_items"."position_at_addition" > 0),
	CONSTRAINT "queue_items_duration_check" CHECK ("queue_items"."video_duration_seconds" is null or "queue_items"."video_duration_seconds" >= 0),
	CONSTRAINT "queue_items_status_check" CHECK ("queue_items"."status" in ('queued', 'current', 'removed', 'skipped', 'failed', 'completed'))
);
--> statement-breakpoint
ALTER TABLE "queue_items" ADD CONSTRAINT "queue_items_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queue_items" ADD CONSTRAINT "queue_items_requester_guest_id_guest_sessions_id_fk" FOREIGN KEY ("requester_guest_id") REFERENCES "public"."guest_sessions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "queue_items_room_sequence_unique" ON "queue_items" USING btree ("room_id","sequence");--> statement-breakpoint
CREATE UNIQUE INDEX "queue_items_guest_idempotency_unique" ON "queue_items" USING btree ("requester_guest_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "queue_items_active_room_sequence_idx" ON "queue_items" USING btree ("room_id","sequence") WHERE "queue_items"."status" in ('queued', 'current');--> statement-breakpoint
CREATE INDEX "queue_items_active_guest_idx" ON "queue_items" USING btree ("room_id","requester_guest_id") WHERE "queue_items"."status" in ('queued', 'current');