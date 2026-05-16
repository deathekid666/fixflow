-- Add TAT timestamps to WorkOrder
ALTER TABLE "WorkOrder" ADD COLUMN "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "WorkOrder" ADD COLUMN "doneAt" TIMESTAMP(3);
ALTER TABLE "WorkOrder" ADD COLUMN "deliveredAt" TIMESTAMP(3);

-- Add bounce fields
ALTER TABLE "WorkOrder" ADD COLUMN "bounceCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "WorkOrder" ADD COLUMN "isBounce" BOOLEAN NOT NULL DEFAULT false;

-- Add quotation fields
ALTER TABLE "WorkOrder" ADD COLUMN "quotationItems" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "WorkOrder" ADD COLUMN "quotationRemarks" TEXT;

-- QuotationLineItem
CREATE TABLE "QuotationLineItem" (
  "id"          TEXT NOT NULL,
  "label"       TEXT NOT NULL,
  "amount"      DOUBLE PRECISION NOT NULL,
  "workOrderId" TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QuotationLineItem_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "QuotationLineItem"
  ADD CONSTRAINT "QuotationLineItem_workOrderId_fkey"
  FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- BounceRepair
CREATE TABLE "BounceRepair" (
  "id"          TEXT NOT NULL,
  "reason"      TEXT NOT NULL,
  "scenario"    TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "workOrderId" TEXT NOT NULL,
  CONSTRAINT "BounceRepair_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "BounceRepair"
  ADD CONSTRAINT "BounceRepair_workOrderId_fkey"
  FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Notification
CREATE TABLE "Notification" (
  "id"          TEXT NOT NULL,
  "type"        TEXT NOT NULL,
  "message"     TEXT NOT NULL,
  "read"        BOOLEAN NOT NULL DEFAULT false,
  "workOrderId" TEXT,
  "userId"      TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "Notification"
  ADD CONSTRAINT "Notification_workOrderId_fkey"
  FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Notification"
  ADD CONSTRAINT "Notification_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
