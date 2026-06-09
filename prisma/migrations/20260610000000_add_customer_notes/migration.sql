-- Add CustomerNote table for internal team notes per customer (keyed by phone)

CREATE TABLE IF NOT EXISTS "CustomerNote" (
    "id"        TEXT NOT NULL,
    "phone"     TEXT NOT NULL,
    "shopId"    TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "message"   TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomerNote_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CustomerNote_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CustomerNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "CustomerNote_phone_shopId_idx" ON "CustomerNote"("phone", "shopId");
