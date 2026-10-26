-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email_verified_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "auth_flow_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_flow_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "auth_flow_tokens_user_id_purpose_idx" ON "auth_flow_tokens"("user_id", "purpose");

-- AddForeignKey
ALTER TABLE "auth_flow_tokens" ADD CONSTRAINT "auth_flow_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
