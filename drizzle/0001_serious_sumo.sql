CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_code" varchar(8) NOT NULL,
	"join_token_hash" varchar(64) NOT NULL,
	"host_credential_hash" varchar(255) NOT NULL,
	"status" varchar(16) DEFAULT 'active' NOT NULL,
	"current_queue_item_id" uuid,
	"playback_state" varchar(16) DEFAULT 'idle' NOT NULL,
	"last_known_playback_position_seconds" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_active_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"absolute_expires_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"expired_at" timestamp with time zone,
	CONSTRAINT "rooms_status_check" CHECK ("rooms"."status" in ('active', 'ended', 'expired')),
	CONSTRAINT "rooms_playback_state_check" CHECK ("rooms"."playback_state" in ('idle', 'playing', 'paused')),
	CONSTRAINT "rooms_playback_position_check" CHECK ("rooms"."last_known_playback_position_seconds" >= 0),
	CONSTRAINT "rooms_expiration_order_check" CHECK ("rooms"."expires_at" <= "rooms"."absolute_expires_at")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "rooms_room_code_unique" ON "rooms" USING btree ("room_code");--> statement-breakpoint
CREATE UNIQUE INDEX "rooms_join_token_hash_unique" ON "rooms" USING btree ("join_token_hash");