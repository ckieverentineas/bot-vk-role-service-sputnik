-- CreateTable
CREATE TABLE "Mail" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "account_to" INTEGER NOT NULL,
    "account_from" INTEGER NOT NULL,
    "blank_to" INTEGER NOT NULL,
    "blank_from" INTEGER NOT NULL,
    "read" BOOLEAN NOT NULL,
    "status" BOOLEAN NOT NULL
);
