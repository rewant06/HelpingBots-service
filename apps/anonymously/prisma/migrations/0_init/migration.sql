-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."AnonymousProfile" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "shadowUserId" TEXT NOT NULL,
    "pseudonym" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnonymousProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Comment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "shadowUserId" TEXT NOT NULL,
    "authorDisplayName" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PollOption" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "postId" TEXT NOT NULL,

    CONSTRAINT "PollOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PollVote" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "shadowUserId" TEXT NOT NULL,
    "pollOptionId" TEXT NOT NULL,

    CONSTRAINT "PollVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Post" (
    "id" TEXT NOT NULL,
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "tenantId" TEXT NOT NULL,
    "shadowUserId" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT true,
    "authorDisplayName" TEXT,
    "spaceId" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "reactionCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "isPoll" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Reaction" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "shadowUserId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,

    CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Space" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Space_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AnonymousProfile_tenantId_pseudonym_key" ON "public"."AnonymousProfile"("tenantId" ASC, "pseudonym" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "AnonymousProfile_tenantId_shadowUserId_key" ON "public"."AnonymousProfile"("tenantId" ASC, "shadowUserId" ASC);

-- CreateIndex
CREATE INDEX "Comment_postId_idx" ON "public"."Comment"("postId" ASC);

-- CreateIndex
CREATE INDEX "Comment_tenantId_idx" ON "public"."Comment"("tenantId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "PollVote_pollOptionId_shadowUserId_key" ON "public"."PollVote"("pollOptionId" ASC, "shadowUserId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Post_createdAt_id_key" ON "public"."Post"("createdAt" ASC, "id" ASC);

-- CreateIndex
CREATE INDEX "Post_isGlobal_createdAt_idx" ON "public"."Post"("isGlobal" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "Post_tenantId_createdAt_idx" ON "public"."Post"("tenantId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "Post_tenantId_shadowUserId_idx" ON "public"."Post"("tenantId" ASC, "shadowUserId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_postId_shadowUserId_type_key" ON "public"."Reaction"("postId" ASC, "shadowUserId" ASC, "type" ASC);

-- CreateIndex
CREATE INDEX "Reaction_tenantId_idx" ON "public"."Reaction"("tenantId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Space_tenantId_slug_key" ON "public"."Space"("tenantId" ASC, "slug" ASC);

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PollOption" ADD CONSTRAINT "PollOption_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PollVote" ADD CONSTRAINT "PollVote_pollOptionId_fkey" FOREIGN KEY ("pollOptionId") REFERENCES "public"."PollOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Post" ADD CONSTRAINT "Post_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "public"."Space"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reaction" ADD CONSTRAINT "Reaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

