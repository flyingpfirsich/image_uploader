CREATE TABLE `music_shares` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`post_id` text,
	`spotify_track_id` text,
	`track_name` text NOT NULL,
	`artist_name` text NOT NULL,
	`album_name` text,
	`album_art_url` text,
	`preview_url` text,
	`external_url` text,
	`mood_kaomoji` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade
);

