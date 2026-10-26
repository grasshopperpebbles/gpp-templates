-- CreateTable
CREATE TABLE "refresh_token_families" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "rotations" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_token_families_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "refresh_token_families_user_id_idx" ON "refresh_token_families"("user_id");

-- AddForeignKey
ALTER TABLE "refresh_token_families" ADD CONSTRAINT "refresh_token_families_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: one family row for each family that already has refresh tokens
INSERT INTO "refresh_token_families" ("id", "user_id", "created_at")
SELECT "family_id", MIN("user_id"), MIN("created_at") FROM "refresh_tokens" GROUP BY "family_id";

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "refresh_token_families"("id") ON DELETE CASCADE ON UPDATE CASCADE;
