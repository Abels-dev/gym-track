-- AlterTable
ALTER TABLE `User` ADD COLUMN `resetPasswordExpires` DATETIME(3) NULL,
    ADD COLUMN `resetPasswordOtp` VARCHAR(191) NULL;
