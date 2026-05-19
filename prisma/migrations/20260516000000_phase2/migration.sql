-- InternalNote
CREATE TABLE "InternalNote" (
  "id"          TEXT NOT NULL,
  "message"     TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "workOrderId" TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  CONSTRAINT "InternalNote_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "InternalNote"
  ADD CONSTRAINT "InternalNote_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "InternalNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- StockAdjustment
CREATE TABLE "StockAdjustment" (
  "id"          TEXT NOT NULL,
  "quantity"    INTEGER NOT NULL,
  "type"        TEXT NOT NULL,
  "reason"      TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sparePartId" TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  CONSTRAINT "StockAdjustment_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "StockAdjustment"
  ADD CONSTRAINT "StockAdjustment_sparePartId_fkey" FOREIGN KEY ("sparePartId") REFERENCES "SparePart"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "StockAdjustment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
