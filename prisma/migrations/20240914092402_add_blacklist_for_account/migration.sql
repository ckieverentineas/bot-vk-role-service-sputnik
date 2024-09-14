-- CreateTable
CREATE TABLE "BlackList" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idvk" INTEGER NOT NULL,
    "id_account" INTEGER NOT NULL,
    CONSTRAINT "BlackList_id_account_fkey" FOREIGN KEY ("id_account") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
