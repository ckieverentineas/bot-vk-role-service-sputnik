-- CreateTable
CREATE TABLE "PkMeterSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_account" INTEGER NOT NULL,
    "single_chars" BOOLEAN NOT NULL DEFAULT true,
    "single_chars_no_spaces" BOOLEAN NOT NULL DEFAULT true,
    "single_words" BOOLEAN NOT NULL DEFAULT true,
    "single_pk" BOOLEAN NOT NULL DEFAULT true,
    "single_mb" BOOLEAN NOT NULL DEFAULT true,
    "single_sentences" BOOLEAN NOT NULL DEFAULT true,
    "single_post_percent" BOOLEAN NOT NULL DEFAULT true,
    "single_comment_percent" BOOLEAN NOT NULL DEFAULT true,
    "single_discussion_percent" BOOLEAN NOT NULL DEFAULT true,
    "multi_chars" BOOLEAN NOT NULL DEFAULT true,
    "multi_chars_no_spaces" BOOLEAN NOT NULL DEFAULT true,
    "multi_words" BOOLEAN NOT NULL DEFAULT true,
    "multi_pk" BOOLEAN NOT NULL DEFAULT true,
    "multi_mb" BOOLEAN NOT NULL DEFAULT true,
    "multi_sentences" BOOLEAN NOT NULL DEFAULT true,
    "multi_message_count" BOOLEAN NOT NULL DEFAULT true,
    "multi_sentence_count" BOOLEAN NOT NULL DEFAULT true,
    "crdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PkMeterSettings_id_account_fkey" FOREIGN KEY ("id_account") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "PkMeterSettings_id_account_key" ON "PkMeterSettings"("id_account");
