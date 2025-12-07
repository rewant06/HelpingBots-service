-- CreateEnum
CREATE TYPE "ReactionType" AS ENUM ('AGREE', 'DISAGREE');

-- CreateTable
CREATE TABLE "AnonymousProfile" (
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
CREATE TABLE "Space" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Space_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
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
    "agreeCount" INTEGER NOT NULL DEFAULT 0,
    "disagreeCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "isPoll" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PollOption" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "postId" TEXT NOT NULL,

    CONSTRAINT "PollOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PollVote" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "shadowUserId" TEXT NOT NULL,
    "pollOptionId" TEXT NOT NULL,

    CONSTRAINT "PollVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
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
CREATE TABLE "Reaction" (
    "id" TEXT NOT NULL,
    "type" "ReactionType" NOT NULL,
    "tenantId" TEXT NOT NULL,
    "shadowUserId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,

    CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AnonymousProfile_tenantId_shadowUserId_key" ON "AnonymousProfile"("tenantId", "shadowUserId");

-- CreateIndex
CREATE UNIQUE INDEX "AnonymousProfile_tenantId_pseudonym_key" ON "AnonymousProfile"("tenantId", "pseudonym");

-- CreateIndex
CREATE UNIQUE INDEX "Space_tenantId_slug_key" ON "Space"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "Post_tenantId_createdAt_idx" ON "Post"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Post_isGlobal_createdAt_idx" ON "Post"("isGlobal", "createdAt");

-- CreateIndex
CREATE INDEX "Post_tenantId_shadowUserId_idx" ON "Post"("tenantId", "shadowUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Post_createdAt_id_key" ON "Post"("createdAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "PollVote_pollOptionId_shadowUserId_key" ON "PollVote"("pollOptionId", "shadowUserId");

-- CreateIndex
CREATE INDEX "Comment_postId_idx" ON "Comment"("postId");

-- CreateIndex
CREATE INDEX "Comment_tenantId_idx" ON "Comment"("tenantId");

-- CreateIndex
CREATE INDEX "Reaction_tenantId_idx" ON "Reaction"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_postId_shadowUserId_key" ON "Reaction"("postId", "shadowUserId");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollOption" ADD CONSTRAINT "PollOption_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollVote" ADD CONSTRAINT "PollVote_pollOptionId_fkey" FOREIGN KEY ("pollOptionId") REFERENCES "PollOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
