-- CreateTable
CREATE TABLE "project_shares" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "shared_with_email" TEXT NOT NULL,
    "permission" TEXT NOT NULL DEFAULT 'view',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_shares_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_shares_project_id_idx" ON "project_shares"("project_id");

-- CreateIndex
CREATE INDEX "project_shares_shared_with_email_idx" ON "project_shares"("shared_with_email");

-- CreateIndex
CREATE UNIQUE INDEX "project_shares_project_id_shared_with_email_key" ON "project_shares"("project_id", "shared_with_email");

-- AddForeignKey
ALTER TABLE "project_shares" ADD CONSTRAINT "project_shares_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

