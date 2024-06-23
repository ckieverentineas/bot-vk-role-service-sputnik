-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Blank" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "text" TEXT NOT NULL,
    "id_account" INTEGER NOT NULL,
    "banned" BOOLEAN NOT NULL DEFAULT false,
    "crdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Blank_id_account_fkey" FOREIGN KEY ("id_account") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Blank" ("banned", "id", "id_account", "text") SELECT "banned", "id", "id_account", "text" FROM "Blank";
DROP TABLE "Blank";
ALTER TABLE "new_Blank" RENAME TO "Blank";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
