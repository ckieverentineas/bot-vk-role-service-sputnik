/*
  Warnings:

  - You are about to alter the column `idvk` on the `Account` table. The data in that column could be lost. The data in that column will be cast from `Int` to `BigInt`.
  - You are about to alter the column `idvk` on the `BlackList` table. The data in that column could be lost. The data in that column will be cast from `Int` to `BigInt`.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Account" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idvk" BIGINT NOT NULL,
    "id_role" INTEGER NOT NULL DEFAULT 1,
    "censored" BOOLEAN NOT NULL DEFAULT true,
    "banned" BOOLEAN NOT NULL DEFAULT false,
    "donate" BOOLEAN NOT NULL DEFAULT false,
    "crdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "online" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "age_verified" BOOLEAN NOT NULL DEFAULT false,
    "romance_preference" TEXT NOT NULL DEFAULT '[]',
    "tag_like" TEXT DEFAULT '[]',
    "tag_unlike" TEXT DEFAULT '[]',
    "tag_display_mode" TEXT NOT NULL DEFAULT 'smart',
    "tag_position" TEXT NOT NULL DEFAULT 'bottom'
);
INSERT INTO "new_Account" ("age_verified", "banned", "censored", "crdate", "donate", "id", "id_role", "idvk", "online", "romance_preference", "tag_display_mode", "tag_like", "tag_position", "tag_unlike") SELECT "age_verified", "banned", "censored", "crdate", "donate", "id", "id_role", "idvk", "online", "romance_preference", "tag_display_mode", "tag_like", "tag_position", "tag_unlike" FROM "Account";
DROP TABLE "Account";
ALTER TABLE "new_Account" RENAME TO "Account";
CREATE TABLE "new_BlackList" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idvk" BIGINT NOT NULL,
    "id_account" INTEGER NOT NULL,
    CONSTRAINT "BlackList_id_account_fkey" FOREIGN KEY ("id_account") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_BlackList" ("id", "id_account", "idvk") SELECT "id", "id_account", "idvk" FROM "BlackList";
DROP TABLE "BlackList";
ALTER TABLE "new_BlackList" RENAME TO "BlackList";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
