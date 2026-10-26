-- CreateTable
CREATE TABLE `refresh_token_families` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `revoked_at` DATETIME(3) NULL,
    `rotations` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `refresh_token_families_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `refresh_token_families` ADD CONSTRAINT `refresh_token_families_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: one family row for each family that already has refresh tokens
INSERT INTO `refresh_token_families` (`id`, `user_id`, `created_at`)
SELECT `family_id`, MIN(`user_id`), MIN(`created_at`) FROM `refresh_tokens` GROUP BY `family_id`;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_family_id_fkey` FOREIGN KEY (`family_id`) REFERENCES `refresh_token_families`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
