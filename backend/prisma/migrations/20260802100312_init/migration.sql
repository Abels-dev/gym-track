-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserProfile` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `preferredUnit` ENUM('KG', 'LBS') NOT NULL DEFAULT 'KG',
    `experienceLevel` ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED') NOT NULL DEFAULT 'BEGINNER',
    `targetDaysPerWeek` INTEGER NOT NULL DEFAULT 4,
    `availableEquipment` JSON NOT NULL,

    UNIQUE INDEX `UserProfile_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Exercise` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` ENUM('PUSH', 'PULL', 'LEGS', 'CORE') NOT NULL,
    `primaryMuscle` VARCHAR(191) NOT NULL,
    `secondaryMuscles` JSON NOT NULL,
    `equipment` ENUM('BARBELL', 'DUMBBELL', 'MACHINE', 'BODYWEIGHT', 'CABLE') NOT NULL,
    `description` VARCHAR(191) NULL,
    `instructions` VARCHAR(191) NULL,
    `videoUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Exercise_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Routine` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `isArchived` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Routine_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RoutineExercise` (
    `id` VARCHAR(191) NOT NULL,
    `routineId` VARCHAR(191) NOT NULL,
    `exerciseId` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL,
    `targetSets` INTEGER NOT NULL,
    `targetRepMin` INTEGER NULL,
    `targetRepMax` INTEGER NULL,
    `restSeconds` INTEGER NULL,
    `notes` VARCHAR(191) NULL,

    INDEX `RoutineExercise_routineId_idx`(`routineId`),
    INDEX `RoutineExercise_exerciseId_idx`(`exerciseId`),
    UNIQUE INDEX `RoutineExercise_routineId_order_key`(`routineId`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WorkoutLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `routineId` VARCHAR(191) NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endedAt` DATETIME(3) NULL,
    `durationSeconds` INTEGER NULL,
    `notes` VARCHAR(191) NULL,

    INDEX `WorkoutLog_userId_idx`(`userId`),
    INDEX `WorkoutLog_startedAt_idx`(`startedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WorkoutExercise` (
    `id` VARCHAR(191) NOT NULL,
    `workoutLogId` VARCHAR(191) NOT NULL,
    `exerciseId` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL,
    `plannedSets` INTEGER NULL,
    `plannedRepMin` INTEGER NULL,
    `plannedRepMax` INTEGER NULL,
    `notes` VARCHAR(191) NULL,

    INDEX `WorkoutExercise_workoutLogId_idx`(`workoutLogId`),
    INDEX `WorkoutExercise_exerciseId_idx`(`exerciseId`),
    UNIQUE INDEX `WorkoutExercise_workoutLogId_order_key`(`workoutLogId`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SetLog` (
    `id` VARCHAR(191) NOT NULL,
    `workoutExerciseId` VARCHAR(191) NOT NULL,
    `setNumber` INTEGER NOT NULL,
    `weight` DOUBLE NOT NULL,
    `reps` INTEGER NOT NULL,
    `rir` INTEGER NULL,
    `durationSeconds` INTEGER NULL,
    `isCompleted` BOOLEAN NOT NULL DEFAULT true,
    `notes` VARCHAR(191) NULL,

    INDEX `SetLog_workoutExerciseId_idx`(`workoutExerciseId`),
    UNIQUE INDEX `SetLog_workoutExerciseId_setNumber_key`(`workoutExerciseId`, `setNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserProfile` ADD CONSTRAINT `UserProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Routine` ADD CONSTRAINT `Routine_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoutineExercise` ADD CONSTRAINT `RoutineExercise_routineId_fkey` FOREIGN KEY (`routineId`) REFERENCES `Routine`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoutineExercise` ADD CONSTRAINT `RoutineExercise_exerciseId_fkey` FOREIGN KEY (`exerciseId`) REFERENCES `Exercise`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkoutLog` ADD CONSTRAINT `WorkoutLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkoutLog` ADD CONSTRAINT `WorkoutLog_routineId_fkey` FOREIGN KEY (`routineId`) REFERENCES `Routine`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkoutExercise` ADD CONSTRAINT `WorkoutExercise_workoutLogId_fkey` FOREIGN KEY (`workoutLogId`) REFERENCES `WorkoutLog`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkoutExercise` ADD CONSTRAINT `WorkoutExercise_exerciseId_fkey` FOREIGN KEY (`exerciseId`) REFERENCES `Exercise`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SetLog` ADD CONSTRAINT `SetLog_workoutExerciseId_fkey` FOREIGN KEY (`workoutExerciseId`) REFERENCES `WorkoutExercise`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
