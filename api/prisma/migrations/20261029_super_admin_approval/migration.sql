ALTER TABLE `Auth`
    MODIFY `role` ENUM('admin', 'patient', 'doctor', 'super_admin') NOT NULL;

ALTER TABLE `Doctor`
    ADD COLUMN `approvalStatus` ENUM('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED') NOT NULL DEFAULT 'PENDING',
    ADD COLUMN `rejectionReason` VARCHAR(1000) NULL,
    ADD COLUMN `approvedAt` DATETIME(3) NULL,
    ADD COLUMN `approvedById` VARCHAR(191) NULL,
    ADD INDEX `Doctor_approvalStatus_idx` (`approvalStatus`);

ALTER TABLE `Patient`
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE `ActivityLog` (
    `id` VARCHAR(191) NOT NULL,
    `actorId` VARCHAR(191) NULL,
    `actorEmail` VARCHAR(254) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `ActivityLog_entityType_entityId_idx` (`entityType`, `entityId`),
    INDEX `ActivityLog_createdAt_idx` (`createdAt`),
    INDEX `ActivityLog_actorId_idx` (`actorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
