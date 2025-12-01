import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { ModerationService } from '../moderation/moderation.service';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { RedisService } from 'src/redis/redis.service';
import { Prisma } from '@prisma/posting-client';
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
          reactionCount: true,
          commentCount: true,
          isGlobal: true,
          isPoll: true,
          pollOptions: true,
        },
      });
      const cacheKey = `feed:${tenantId}:recent`;
      await this.cacheManager.del(cacheKey);

      if (isGlobal) {
        const globalCacheKey = `feed:global:recent`;
        await this.cacheManager.del(globalCacheKey);
      }
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
  ) {
    const limit = Math.min(dto.limit || 20, 50);
    const isLandingPage = !dto.cursor;

    if (isLandingPage) {
      const cached = await this.cacheManager.get(cacheKeyBase);
      if (cached) return cached;
    }

    let cursorObj: { createdAt: Date; id: string } | undefined;
    if (dto.cursor) {
      try {
        const decoded = Buffer.from(dto.cursor, 'base64').toString('utf-8');
        const parsed = JSON.parse(decoded);
        cursorObj = { createdAt: new Date(parsed.createdAt), id: parsed.id };
      } catch (e) {
        throw new BadRequestException('Invalid cursor format');
      }
    }

    const posts = await this.prisma.post.findMany({
      where,
      take: limit + 1,
      cursor: cursorObj ? { createdAt_id: cursorObj } : undefined,
      skip: cursorObj ? 1 : 0,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: {
        pollOptions: true,
        _count: { select: { comments: true, reactions: true } },
      },
    });

    let nextCursor: string | null = null;
    if (posts.length > limit) {
      const nextItem = posts.pop();
      const nextCursorObj = {
        createdAt: nextItem!.createdAt,
        id: nextItem!.id,
      };
      nextCursor = Buffer.from(JSON.stringify(nextCursorObj)).toString(
        'base64',
      );
    }

    const result = { data: posts, meta: { nextCursor, hasMore: !!nextCursor } };

    if (isLandingPage) {
      await this.cacheManager.set(cacheKeyBase, result, 30 * 1000);
    }

    return result;
  }

  async findAllTenant(tenantId: string, dto: PaginationQueryDto) {
    return this.findAllGeneric(
      { tenantId, deletedAt: null },
      dto,
      `feed:${tenantId}:recent`,
    );
  }

  async findAllGlobal(dto: PaginationQueryDto) {
    return this.findAllGeneric(
      { isGlobal: true, deletedAt: null },
      dto,
      `feed:global:recent`,
    );
  }

  async votePoll(tenantId: string, shadowUserId: string, pollOptionId: string) {
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
}
