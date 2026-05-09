-- AlterTable
ALTER TABLE "EmergencyContact" ADD COLUMN     "telegramChatId" TEXT,
ALTER COLUMN "phone" DROP NOT NULL;
