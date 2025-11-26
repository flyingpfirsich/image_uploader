CREATE TABLE `daily_notification_time` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`scheduled_time` integer NOT NULL,
	`generated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notification_preferences` (
	`user_id` text PRIMARY KEY NOT NULL,
	`daily_reminder` integer DEFAULT true NOT NULL,
	`friend_posts` integer DEFAULT true NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
