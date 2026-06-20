-- AlterTable
ALTER TABLE "Blank" ADD COLUMN "tag" TEXT DEFAULT '[]';

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Account" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idvk" INTEGER NOT NULL,
    "id_role" INTEGER NOT NULL DEFAULT 1,
    "censored" BOOLEAN NOT NULL DEFAULT true,
    "banned" BOOLEAN NOT NULL DEFAULT false,
    "donate" BOOLEAN NOT NULL DEFAULT false,
    "crdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "online" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "age_verified" BOOLEAN NOT NULL DEFAULT false,
    "romance_preference" TEXT NOT NULL DEFAULT '[]',
    "tag_like" TEXT DEFAULT '[]',
    "tag_unlike" TEXT DEFAULT '[]'
);
INSERT INTO "new_Account" ("banned", "censored", "crdate", "donate", "id", "id_role", "idvk", "online") SELECT "banned", "censored", "crdate", "donate", "id", "id_role", "idvk", "online" FROM "Account";
DROP TABLE "Account";
ALTER TABLE "new_Account" RENAME TO "Account";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
