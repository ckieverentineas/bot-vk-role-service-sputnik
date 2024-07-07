-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Account" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idvk" INTEGER NOT NULL,
    "id_role" INTEGER NOT NULL DEFAULT 1,
    "censored" BOOLEAN NOT NULL DEFAULT true,
    "banned" BOOLEAN NOT NULL DEFAULT false,
    "crdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "online" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Account" ("censored", "crdate", "id", "id_role", "idvk") SELECT "censored", "crdate", "id", "id_role", "idvk" FROM "Account";
DROP TABLE "Account";
ALTER TABLE "new_Account" RENAME TO "Account";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
