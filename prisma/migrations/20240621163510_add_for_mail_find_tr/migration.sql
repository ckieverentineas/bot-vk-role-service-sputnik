-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Mail" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "blank_to" INTEGER NOT NULL,
    "blank_from" INTEGER NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "status" BOOLEAN NOT NULL DEFAULT false,
    "find" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_Mail" ("blank_from", "blank_to", "id", "read", "status") SELECT "blank_from", "blank_to", "id", "read", "status" FROM "Mail";
DROP TABLE "Mail";
ALTER TABLE "new_Mail" RENAME TO "Mail";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
