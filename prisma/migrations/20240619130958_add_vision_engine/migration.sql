-- CreateTable
CREATE TABLE "Vision" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_account" INTEGER NOT NULL,
    "id_blank" INTEGER NOT NULL,
    CONSTRAINT "Vision_id_account_fkey" FOREIGN KEY ("id_account") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Vision_id_blank_fkey" FOREIGN KEY ("id_blank") REFERENCES "Blank" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
