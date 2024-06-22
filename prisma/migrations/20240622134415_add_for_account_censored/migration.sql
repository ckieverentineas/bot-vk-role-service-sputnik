-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Blank" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "text" TEXT NOT NULL,
    "id_account" INTEGER NOT NULL,
    "banned" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Blank_id_account_fkey" FOREIGN KEY ("id_account") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Blank" ("id", "id_account", "text") SELECT "id", "id_account", "text" FROM "Blank";
DROP TABLE "Blank";
ALTER TABLE "new_Blank" RENAME TO "Blank";
CREATE TABLE "new_Account" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idvk" INTEGER NOT NULL,
    "id_role" INTEGER NOT NULL DEFAULT 1,
    "censored" BOOLEAN NOT NULL DEFAULT true,
    "crdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Account" ("crdate", "id", "id_role", "idvk") SELECT "crdate", "id", "id_role", "idvk" FROM "Account";
DROP TABLE "Account";
ALTER TABLE "new_Account" RENAME TO "Account";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
