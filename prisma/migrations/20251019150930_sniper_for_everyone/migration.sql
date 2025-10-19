-- CreateTable
CREATE TABLE "SniperUsage" (
    "id_account" INTEGER NOT NULL,
    "usage_date" DATETIME NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY ("id_account", "usage_date"),
    CONSTRAINT "SniperUsage_id_account_fkey" FOREIGN KEY ("id_account") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
