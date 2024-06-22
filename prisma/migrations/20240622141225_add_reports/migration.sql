-- CreateTable
CREATE TABLE "Report" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "text" TEXT NOT NULL,
    "id_blank" INTEGER NOT NULL,
    "id_account" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'wait',
    CONSTRAINT "Report_id_blank_fkey" FOREIGN KEY ("id_blank") REFERENCES "Blank" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Report_id_account_fkey" FOREIGN KEY ("id_account") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
