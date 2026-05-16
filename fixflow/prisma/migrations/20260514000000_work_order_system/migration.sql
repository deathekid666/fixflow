-- Drop old tables
DROP TABLE IF EXISTS "Attachment" CASCADE;
DROP TABLE IF EXISTS "Comment" CASCADE;
DROP TABLE IF EXISTS "Ticket" CASCADE;

-- Remove old relations from Shop
ALTER TABLE "Shop" DROP COLUMN IF EXISTS "tickets";

-- WorkOrder
CREATE TABLE "WorkOrder" (
  "id"               TEXT NOT NULL,
  "orderNumber"      TEXT NOT NULL,
  "deviceBrand"      TEXT NOT NULL,
  "deviceModel"      TEXT NOT NULL,
  "serialNumber"     TEXT,
  "imei"             TEXT,
  "warrantyStart"    TIMESTAMP(3),
  "warrantyEnd"      TIMESTAMP(3),
  "isUnderWarranty"  BOOLEAN NOT NULL DEFAULT false,
  "customerName"     TEXT NOT NULL,
  "customerPhone"    TEXT NOT NULL,
  "customerEmail"    TEXT,
  "faultDescription" TEXT NOT NULL,
  "appearance"       TEXT,
  "remarks"          TEXT,
  "serviceType"      TEXT NOT NULL DEFAULT 'IN_STORE',
  "repairType"       TEXT,
  "faultLevel"       TEXT NOT NULL DEFAULT 'LOW',
  "status"           TEXT NOT NULL DEFAULT 'RECEIVED',
  "subtotal"         DOUBLE PRECISION NOT NULL DEFAULT 0,
  "discount"         DOUBLE PRECISION NOT NULL DEFAULT 0,
  "total"            DOUBLE PRECISION NOT NULL DEFAULT 0,
  "collected"        DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "shopId"           TEXT NOT NULL,
  "userId"           TEXT NOT NULL,
  "assignedTo"       TEXT,
  CONSTRAINT "WorkOrder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkOrder_orderNumber_key" ON "WorkOrder"("orderNumber");

ALTER TABLE "WorkOrder"
  ADD CONSTRAINT "WorkOrder_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "WorkOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "WorkOrder_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- SparePart
CREATE TABLE "SparePart" (
  "id"          TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "partNumber"  TEXT,
  "description" TEXT,
  "unitPrice"   DOUBLE PRECISION NOT NULL DEFAULT 0,
  "stock"       INTEGER NOT NULL DEFAULT 0,
  "shopId"      TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SparePart_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "SparePart"
  ADD CONSTRAINT "SparePart_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- WorkOrderPart
CREATE TABLE "WorkOrderPart" (
  "id"          TEXT NOT NULL,
  "quantity"    INTEGER NOT NULL DEFAULT 1,
  "unitPrice"   DOUBLE PRECISION NOT NULL,
  "total"       DOUBLE PRECISION NOT NULL,
  "workOrderId" TEXT NOT NULL,
  "sparePartId" TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkOrderPart_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "WorkOrderPart"
  ADD CONSTRAINT "WorkOrderPart_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "WorkOrderPart_sparePartId_fkey" FOREIGN KEY ("sparePartId") REFERENCES "SparePart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- OperationLog
CREATE TABLE "OperationLog" (
  "id"          TEXT NOT NULL,
  "action"      TEXT NOT NULL,
  "description" TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "workOrderId" TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  CONSTRAINT "OperationLog_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "OperationLog"
  ADD CONSTRAINT "OperationLog_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "OperationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- WorkOrderAttachment
CREATE TABLE "WorkOrderAttachment" (
  "id"          TEXT NOT NULL,
  "filename"    TEXT NOT NULL,
  "path"        TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "workOrderId" TEXT NOT NULL,
  CONSTRAINT "WorkOrderAttachment_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "WorkOrderAttachment"
  ADD CONSTRAINT "WorkOrderAttachment_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
