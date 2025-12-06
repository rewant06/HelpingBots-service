import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { ModerationService } from '../moderation/moderation.service';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { RedisService } from 'src/redis/redis.service';
import { Prisma, ReactionType } from '@prisma/posting-client';
import { UpdatePostDto } from './dto/update-post.dto';
import { AvatarService } from 'src/common/services/avatar.service';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(
    private prisma: PrismaService,
    private moderationService: ModerationService,
    private redisService: RedisService,
    private avatarService: AvatarService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private async resolveIdentity(
    tenantId: string,
    shadowUserId: string,
    isAnonymous: boolean,
    requestedName?: string,
    retries = 3,
  ): Promise<string> {
    if (!isAnonymous) return requestedName?.trim() || 'Verified User';

    try {
      const existing = await this.prisma.anonymousProfile.findUnique({
        where: { tenantId_shadowUserId: { tenantId, shadowUserId } },
      });
      if (existing) return existing.pseudonym;

      if (!requestedName || requestedName.trim().length === 0) {
        throw new BadRequestException('Pseudonym required for first post.');
      }

      const finalName = requestedName.trim();
      this.moderationService.validatePseudonym(finalName);
      const avatarUrl = await this.avatarService.generateAndUpload(finalName);
      const newProfile = await this.prisma.anonymousProfile.create({
        data: {
          tenantId,
          shadowUserId,
          pseudonym: finalName,
          avatarUrl,
        },
      });
      return newProfile.pseudonym;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        if (retries > 0) {
          return this.resolveIdentity(
            tenantId,
            shadowUserId,
            isAnonymous,
            requestedName,
            retries - 1,
          );
        }
        throw new ConflictException('Identity conflict, Please try again.');
      }
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Identity Resolution Failed: ${error.message}`);
      throw new InternalServerErrorException('Failed to establish identity');
    }
  }

  async create(dto: CreatePostDto, tenantId: string, shadowUserId: string) {
    if (shadowUserId === 'public-visitor') {
      throw new UnauthorizedException('Login required to post.');
    }
    this.moderationService.enforcePolicy(dto.content);

    if (dto.spaceId) {
      const space = await this.prisma.space.findUnique({
        where: { id: dto.spaceId },
        select: { tenantId: true },
      });
      if (!space || space.tenantId !== tenantId)
        throw new NotFoundException('Space not found');
    }
    const displayName = await this.resolveIdentity(
      tenantId,
      shadowUserId,
      dto.isAnonymous ?? true,
      dto.authorDisplayName,
    );

    const isGlobal = dto.isGlobal || false;
    try {
      const post = await this.prisma.post.create({
        data: {
          tenantId,
          shadowUserId,
          content: dto.content,
          isAnonymous: dto.isAnonymous ?? true,
          authorDisplayName: displayName,
          spaceId: dto.spaceId,
          isGlobal: isGlobal,
          isPoll: !!(dto.pollOptions && dto.pollOptions.length > 0),
          pollOptions: dto.pollOptions
            ? {
                create: dto.pollOptions.map((text) => ({ text })),
              }
            : undefined,
        },
        select: {
          id: true,
          content: true,
          authorDisplayName: true,
          createdAt: true,
          viewCount: true,
          agreeCount: true,
          disagreeCount: true,
          reactionCount: true,
          commentCount: true,
          isGlobal: true,
          isPoll: true,
          pollOptions: true,
        },
      });
      await this.cacheManager.del(`feed:${tenantId}:recent`);
      if (isGlobal) await this.cacheManager.del(`feed:global:recent`);

      return post;
    } catch (error) {
      this.logger.error(`Create failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to create post');
    }
  }

  private async findAllGeneric(
    where: any,
    dto: PaginationQueryDto,
    cacheKeyBase: string,
    currentUserId?: string,
  ) {
    const limit = Math.min(dto.limit || 20, 50);
    const isLandingPage = !dto.cursor;

    // 1. Container for RAW data ( No User Info)
    let rawResult: { data: any[]; meta: any } | null = null;

    // 2. TRY CACHE (Raw Data Only)
    if (isLandingPage) {
      const cached = await this.cacheManager.get(cacheKeyBase);
      if (cached) {
        rawResult = cached as { data: any[]; meta: any };
      }
    }

    // 3. IF NO CACHE, QUERY DB
    if (!rawResult) {
      let cursorObj: { createdAt: Date; id: string } | undefined;

      // Parse Cursor
      if (dto.cursor) {
        try {
          const decoded = Buffer.from(dto.cursor, 'base64').toString('utf-8');
          const parsed = JSON.parse(decoded);
          cursorObj = { createdAt: new Date(parsed.createdAt), id: parsed.id };
        } catch (e) {
          throw new BadRequestException('Invalid cursor format');
        }
      }

      // Execute Query (Inside the block now!)
      const posts = await this.prisma.post.findMany({
        where,
        take: limit + 1,
        cursor: cursorObj ? { createdAt_id: cursorObj } : undefined,
        skip: cursorObj ? 1 : 0,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: { pollOptions: true },
      });

      // Calculate Next Cursor
      let nextCursor: string | null = null;
      if (posts.length > limit) {
        const nextItem = posts.pop();
        if (nextItem) {
          const nextCursorObj = {
            createdAt: nextItem.createdAt,
            id: nextItem.id,
          };
          nextCursor = Buffer.from(JSON.stringify(nextCursorObj)).toString(
            'base64',
          );
        }
      }

      // Assign to rawResult
      rawResult = {
        data: posts,
        meta: { nextCursor, hasMore: !!nextCursor },
      };

      // Cache the RAW data
      if (isLandingPage) {
        await this.cacheManager.set(cacheKeyBase, rawResult, 30000);
      }
    }
    const safeData = rawResult!.data.map((p) => {
      const isAuthor =
        currentUserId && p.shadowUserId
          ? p.shadowUserId === currentUserId
          : false;

      const { shadowUserId, ...rest } = p;

      return {
        ...rest,
        isAuthor,
      };
    });

    return { ...rawResult, data: safeData };
  }

  async findAllTenant(
    tenantId: string,
    dto: PaginationQueryDto,
    userId?: string,
  ) {
    return this.findAllGeneric(
      { tenantId, deletedAt: null },
      dto,
      `feed:${tenantId}:recent`,
      userId,
    );
  }

  async findAllGlobal(dto: PaginationQueryDto, userId?: string) {
    return this.findAllGeneric(
      { isGlobal: true, deletedAt: null },
      dto,
      `feed:global:recent`,
      userId,
    );
  }

  async votePoll(tenantId: string, shadowUserId: string, pollOptionId: string) {
    if (shadowUserId === 'public-visitor') {
      throw new UnauthorizedException('You must be logged in to vote.');
    }
    const option = await this.prisma.pollOption.findUnique({
      where: { id: pollOptionId },
      select: { postId: true },
    });

    if (!option) throw new NotFoundException('Option not found');

    const postId = option.postId;
    const votersKey = `{poll:${postId}}:voters`;
    const countsKey = `{poll:${postId}}:counts`;

    try {
      const hasVoted = await this.redisService.client.sismember(
        votersKey,
        shadowUserId,
      );
      if (hasVoted) throw new ConflictException('Already voted');

      const multi = this.redisService.client.multi();
      multi.sadd(votersKey, shadowUserId);
      multi.hincrby(countsKey, pollOptionId, 1);
      multi.expire(votersKey, 2592000);
      multi.expire(countsKey, 2592000);
      await multi.exec();
      void this.syncVoteToDb(pollOptionId, shadowUserId, tenantId);
      return { success: true };
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      this.logger.error(`Vote failed: ${error.message}`);
      throw new InternalServerErrorException('Vote failed');
    }
  }

  async update(
    tenantId: string,
    shadowUserId: string,
    postId: string,
    dto: UpdatePostDto,
  ) {
    this.logger.log(
      `User [${shadowUserId}] attempting to edit post [${postId}]`,
    );
    if (dto.content) {
      this.moderationService.enforcePolicy(dto.content);
    }

    try {
      const result = await this.prisma.post.updateMany({
        where: {
          id: postId,
          tenantId: tenantId,
          shadowUserId: shadowUserId,
          deletedAt: null,
        },
        data: {
          content: dto.content,
          isEdited: true,
          updatedAt: new Date(),
        },
      });

      if (result.count === 0) {
        throw new NotFoundException(
          'Post not found or you do not have permission to edit it.',
        );
      }
      const cacheKey = `feed:${tenantId}:recent`;
      await this.cacheManager.del(cacheKey);

      await this.cacheManager.del(`feed:global:recent`);
      return { success: true, message: 'Post updated successfully' };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(`Edit failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to update post');
    }
  }

  async archive(
    tenantId: string,
    shadowUserId: string,
    postId: string,
    isPrivileged: boolean = false, // The "Admin Override" Switch
  ) {
    this.logger.log(
      `Archive request for post [${postId}] by [${shadowUserId}] (Admin: ${isPrivileged})`,
    );

    try {
      const whereClause: Prisma.PostWhereInput = {
        id: postId,
        tenantId: tenantId,
        deletedAt: null,
      };

      if (!isPrivileged) {
        // If not admin, enforce strict ownership
        whereClause.shadowUserId = shadowUserId;
      }

      const result = await this.prisma.post.updateMany({
        where: whereClause,
        data: {
          deletedAt: new Date(), // Soft Delete Marker
        },
      });

      if (result.count === 0) {
        throw new NotFoundException('Post not found or permission denied');
      }

      // The feed must update to remove the deleted post immediately.
      const cacheKey = `feed:${tenantId}:recent`;
      await this.cacheManager.del(cacheKey);

      return { success: true, message: 'Post archived' };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Archive failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to archive post');
    }
  }

  async getMyProfile(tenantId: string, shadowUserId: string) {
    const profile = await this.prisma.anonymousProfile.findUnique({
      where: { tenantId_shadowUserId: { tenantId, shadowUserId } },
      select: { pseudonym: true, avatarUrl: true },
    });
    return profile;
  }

  async react(
    tenantId: string,
    shadowUserId: string,
    postId: string,
    type: 'AGREE' | 'DISAGREE',
  ) {
    if (shadowUserId === 'public-visitor') {
      throw new UnauthorizedException('You must be logged in to react.');
    }
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { tenantId: true, isGlobal: true },
    });

    if (!post) throw new NotFoundException('Post not found');
    const userReactionKey = `{post:${postId}}:user_reactions`;
    const countsKey = `{post:${postId}}:counts`;

    try {
      // 2. Check if already reacted (O(1))
      const currentReaction = await this.redisService.client.hget(
        userReactionKey,
        shadowUserId,
      );
      const multi = this.redisService.client.multi();

      // Scenario A: Toggle Off (Removing same reaction)
      if (currentReaction === type) {
        multi.hdel(userReactionKey, shadowUserId);
        multi.hincrby(countsKey, type, -1);
      }
      // Scenario B: Switching (Agree -> Disagree)
      else if (currentReaction) {
        multi.hset(userReactionKey, shadowUserId, type);
        multi.hincrby(countsKey, currentReaction, -1); // Decrement old
        multi.hincrby(countsKey, type, 1); // Increment new
      }
      // Scenario C: New Reaction
      else {
        multi.hset(userReactionKey, shadowUserId, type);
        multi.hincrby(countsKey, type, 1);
      }

      // Refresh TTL
      multi.expire(userReactionKey, 2592000);
      multi.expire(countsKey, 2592000);

      await multi.exec();

      void this.syncReactionToDb(
        postId,
        shadowUserId,
        type,
        tenantId,
        currentReaction as ReactionType,
      );

      return { status: currentReaction === type ? 'removed' : 'added' };
    } catch (error) {
      this.logger.error(`Reaction failed: ${error.message}`);
      throw new InternalServerErrorException('Reaction failed');
    }
  }

  // --- COMMENTS ---
  async createComment(
    tenantId: string,
    shadowUserId: string,
    postId: string,
    content: string,
    isAnonymous = true,
  ) {
    if (shadowUserId === 'public-visitor')
      throw new UnauthorizedException('Login required.');
    this.moderationService.enforcePolicy(content);

    const displayName = await this.resolveIdentity(
      tenantId,
      shadowUserId,
      isAnonymous,
    ); // Comments inherit anonymous state for now

    try {
      const comment = await this.prisma.comment.create({
        data: {
          content,
          tenantId,
          shadowUserId,
          postId,
          authorDisplayName: displayName,
        },
      });
      // Increment comment count (Atomic)
      await this.prisma.post.update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } },
      });
      return comment;
    } catch (error) {
      this.logger.error(`Comment failed: ${error.message}`);
      throw new InternalServerErrorException('Failed to comment');
    }
  }

  async getComments(postId: string, dto: PaginationQueryDto) {
    // Simple pagination for comments
    const limit = Math.min(dto.limit || 50, 100);
    const skip = ((dto.page || 1) - 1) * limit;

    return this.prisma.comment.findMany({
      where: { postId },
      take: limit,
      skip,
      orderBy: { createdAt: 'asc' }, // Oldest first usually makes sense for conversation
    });
  }

  async findOne(tenantId: string, postId: string, isPublicVisitor = false) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        pollOptions: true,
        _count: { select: { comments: true, reactions: true } },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }
    if (!post.isGlobal && post.tenantId !== tenantId) {
      throw new NotFoundException('Post not found');
    }

    void this.incrementView(postId);

    return post;
  }

  async getUserInteractions(
    tenantId: string,
    shadowUserId: string,
    postIds: string[],
  ) {
    if (!postIds.length || shadowUserId === 'public-visitor') {
      return {};
    }

    const pipeline = this.redisService.client.pipeline();
    postIds.forEach((id) => {
      pipeline.hget(`{post:${id}:user_reaction}`, shadowUserId);
      pipeline.sismember(`poll:${id}:voters`, shadowUserId);
    });
    const results = await pipeline.exec();
    const map: Record<string, { reaction: string | null; hasVoted: boolean }> =
      {};
    if (results) {
      postIds.forEach((id, index) => {
        const reactionRes = results[index * 2];
        const voteRes = results[index * 2 + 1];

        const reaction = reactionRes?.[1] as string | null;
        const hasVoted = (voteRes?.[1] as number) === 1;

        map[id] = { reaction, hasVoted };
      });
    }
    return map;
  }

  async incrementView(postId: string) {
    try {
      const pipeline = this.redisService.client.pipeline();
      pipeline.incr(`post:${postId}:view_buffer`);
      pipeline.sadd(`posts:pending_view_sync`, postId);
      await pipeline.exec();
    } catch (err) {
      this.logger.error(`Failed to buffer view for ${postId}`, err);
    }
  }

  private async syncVoteToDb(
    pollOptionId: string,
    shadowUserId: string,
    tenantId: string,
  ) {
    try {
      await this.prisma.$transaction([
        this.prisma.pollVote.create({
          data: { pollOptionId, shadowUserId, tenantId },
        }),
        this.prisma.pollOption.update({
          where: { id: pollOptionId },
          data: { voteCount: { increment: 1 } },
        }),
      ]);
    } catch (e) {
      // Ignore dupes if redis/db desync, eventually consistent
      if (e.code !== 'P2002') this.logger.error(`Sync Vote Failed`, e);
    }
  }

  private async syncReactionToDb(
    postId: string,
    shadowUserId: string,
    newType: string,
    tenantId: string,
    oldType?: ReactionType,
  ) {
    // Complex Sync Logic: We rely on eventual consistency or a specific 'Reaction' table update
    // For simplicity in this snippet, we upsert.
    try {
      if (oldType && oldType === newType) {
        // Delete
        await this.prisma.reaction.deleteMany({
          where: { postId, shadowUserId },
        });
        await this.prisma.post.update({
          where: { id: postId },
          data: {
            [newType === 'AGREE' ? 'agreeCount' : 'disagreeCount']: {
              decrement: 1,
            },
          },
        });
      } else {
        // Upsert
        await this.prisma.$transaction([
          // Note: Prisma doesn't support update where composite ID easily, using delete+create or upsert logic
          // Deleting old if exists
          this.prisma.reaction.deleteMany({ where: { postId, shadowUserId } }),
          this.prisma.reaction.create({
            data: {
              postId,
              shadowUserId,
              type:
                newType === 'AGREE'
                  ? ReactionType.AGREE
                  : ReactionType.DISAGREE,
              tenantId,
            },
          }),
          // Update Counters
          this.prisma.post.update({
            where: { id: postId },
            data: {
              [newType === 'AGREE' ? 'agreeCount' : 'disagreeCount']: {
                increment: 1,
              },
              ...(oldType
                ? {
                    [oldType === 'AGREE' ? 'agreeCount' : 'disagreeCount']: {
                      decrement: 1,
                    },
                  }
                : {}),
            },
          }),
        ]);
      }
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code !== 'P2002')
          this.logger.error(`Sync Reaction Failed: ${e.message}`);
      } else {
        this.logger.error(`Sync Reaction Failed: ${e}`);
      }
    }
  }
}

