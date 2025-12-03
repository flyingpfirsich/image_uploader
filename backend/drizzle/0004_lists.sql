CREATE TABLE `lists` (
  `id` text PRIMARY KEY NOT NULL,
  `creator_id` text NOT NULL,
  `title` text NOT NULL,
  `description` text,
  `allow_anyone_add` integer DEFAULT true NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `list_items` (
  `id` text PRIMARY KEY NOT NULL,
  `list_id` text NOT NULL,
  `added_by_id` text NOT NULL,
  `title` text NOT NULL,
  `note` text,
  `external_url` text,
  `completed` integer DEFAULT false NOT NULL,
  `order` integer DEFAULT 0 NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`list_id`) REFERENCES `lists`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`added_by_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `lists_creator_idx` ON `lists` (`creator_id`);
--> statement-breakpoint
CREATE INDEX `list_items_list_idx` ON `list_items` (`list_id`);
