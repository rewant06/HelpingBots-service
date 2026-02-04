import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/iam-client';
import { CreateLocalUserDto } from './dto/createUser.dto';
import { RbacService } from 'src/auth/rbac/rbac.service';
import { UpdateSelfDto } from './dto/update-self.dto';
import { AdminUpdateUserDto } from './dto/admin-update.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { UserPayload } from 'src/auth/types/user-payload.type';
import { PaginatedResponse } from 'src/common/types/response.type';
import { RedisService } from 'src/redis/redis.service';
import { PasswordWorkerService } from 'src/password-worker/password-worker.service';
import * as argon2 from 'argon2';

export const USER_SELECT_FIELDS = {
  id: true,
  name: true,
  email: true,
  isEmailVerified: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  roles: {
    select: {
      name: true,
    },
  },
  ownedTenants: {
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
    },
  },
} satisfies Prisma.UserSelect;
const PROFILE_CACHE_TTL = 3600;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private static readonly ARGON2_OPTIONS: argon2.Options & { raw?: false } = {
    type: argon2.argon2id,

    // Amount of memory used by the algorithm in KiB.
    // 2**16 = 65,536 KiB = 64 MiB per hash
    // Production turning: 64-256 MiB is common
    memoryCost: 2 ** 16,

    // Number of iterations.
    // Production turning: 3-5 is common.
    timeCost: 3,

    // Number of parallel threads.
    // Production turning: 1-4 is common.
    parallelism: 1,
  };
  constructor(
    private prisma: PrismaService,
    //(using forwardRef to avoid circular dependency)
    @Inject(forwardRef(() => RbacService)) private rbacService: RbacService,
    private redisService: RedisService,
    private passwordWorker: PasswordWorkerService,
  ) {}

  // Hashing password with argon2 ---------------------------

  async hashPassword(password: string) {
    return this.passwordWorker.hash(password);
  }

  private getProfileCacheKey(userId: string) {
    return `user:profile:${userId}`;
  }

  private async clearUserCache(userId: string) {
    await Promise.all([
      this.redisService.del(this.getProfileCacheKey(userId)),
      this.rbacService.clearCacheForUser(userId),
    ]);
  }

  async verifyAndMaybeRehash(userId: string, password: string, hash: string) {
    const ok = await this.passwordWorker.verify(hash, password);
    if (ok && argon2.needsRehash(hash, UsersService.ARGON2_OPTIONS)) {
      try {
        const newHash = await this.passwordWorker.hash(password);
        await this.prisma.user.update({
          where: { id: userId },
          data: { hashedPassword: newHash },
        });
      } catch (e) {
        this.logger.warn(
          `Rehash failed for user ${userId}: ${e instanceof Error ? e.message : e}`,
        );
      }
    }
    return ok;
  }

  // --------------------------------------------------------------------------

  async createLocalUser(dto: CreateLocalUserDto) {
    const finalEmail = dto.email.trim().toLowerCase();
    const finalName = dto.name?.trim();
    const hashPassword = await this.hashPassword(dto.password);

    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const userRole = await tx.role.findUnique({
            where: { name: 'USER' },
          });
          if (!userRole) {
            throw new InternalServerErrorException(
              'Default USER role not found',
            );
          }

          // const hashPassword = await this.hashPassword(dto.password);
          return tx.user.create({
            data: {
              name: finalName,
              email: finalEmail,
              hashedPassword: hashPassword,
              roles: {
                connect: { id: userRole.id },
              },
            },

            select: USER_SELECT_FIELDS,
          });
        },
        { timeout: 5000 },
      );
    } catch (err) {
      // Prisma unique violation on concurrent creates -> P2002
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException('Email already registered');
      }
      throw err;
    }
  }

  async getAllUsers(
    dto: PaginationDto,
  ): Promise<PaginatedResponse<Partial<UserPayload>>> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    try {
      const [users, total] = await this.prisma.$transaction([
        this.prisma.user.findMany({
          skip: skip,
          take: limit,
          select: USER_SELECT_FIELDS,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.user.count(),
      ]);
      const totalPages = Math.ceil(total / limit);
      return {
        data: users,
        meta: {
          total,
          page,
          limit,
          totalPages,
          lastPage: totalPages === page,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get paginated users', error.stack);
      throw new InternalServerErrorException('Could not retrieve users');
    }
  }

  async findUserByEmailWithPassword(email: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: email },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        hashedPassword: true,
        isEmailVerified: true,

        roles: {
          select: {
            name: true,
          },
        },
      },
    });
    return existingUser;
  }

  async updateSelf(userId: string, dto: UpdateSelfDto) {
    this.logger.log(`Attempting to update profile for user: ${userId}`);
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          name: dto.name?.trim(),
        },
        select: USER_SELECT_FIELDS,
      });
      await this.clearUserCache(userId);
      this.logger.log(
        `Successfully updated profile and cleared cache for user: ${userId}`,
      );
      return user;
    } catch (err) {
      this.handlePrismaError(err, userId);
      throw new InternalServerErrorException('Profile update failed.');
    }
  }

  async updateUserById(
    userId: string,
    actor: UserPayload,
    dto: AdminUpdateUserDto,
  ) {
    this.logger.log(`Admin is attempting to update user: ${userId}`);

    try {
      const updatedUser = await this.prisma.$transaction(async (tx) => {
        let roleIds: { id: string }[] | undefined = undefined;

        if (dto.roles) {
          const roles = await tx.role.findMany({
            where: { name: { in: dto.roles } },
            select: { id: true },
          });
          // Validate the all requrested roles actually exist
          if (roles.length !== dto.roles.length) {
            this.logger.warn(
              `Admin update failed: Some roles not found for user ${userId}`,
            );
            throw new NotFoundException('One or more roles not found.');
          }
          roleIds = roles.map((r) => ({ id: r.id }));
        }

        // Now, update the user
        const user = await tx.user.update({
          where: { id: userId },
          data: {
            name: dto.name?.trim(),
            roles: roleIds ? { set: roleIds } : undefined,
          },
          select: USER_SELECT_FIELDS,
        });
        return user;
      });
      await this.clearUserCache(userId);
      this.logger.log(
        `Admin successfully updated user: ${userId}. Cache cleared.`,
      );
      return updatedUser;
    } catch (error) {
      this.handlePrismaError(error, userId);
      throw error;
    }
  }

  async deleteUserById(userId: string, actor: UserPayload): Promise<void> {
    this.logger.log(`Admin is attempting to delete user: ${userId}`);

    try {
      await this.prisma.user.delete({
        where: { id: userId },
      });

      await this.clearUserCache(userId);
      this.logger.log(
        `Admin successfully deleted user: ${userId}. Cache cleared`,
      );
    } catch (error) {
      this.handlePrismaError(error, userId);
      throw new InternalServerErrorException('User deletion failed.');
    }
  }

  async getUserById(userId: string) {
    const cacheKey = this.getProfileCacheKey(userId);
    try {
      const cached = await this.redisService.getJson(cacheKey);
      if (cached) return cached;
    } catch (err) {
      this.logger.log(`Redis error for : ${userId}`, err);
    }

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: USER_SELECT_FIELDS,
      });

      if (!user) {
        this.logger.warn(`User not found: ${userId}`);
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      await this.redisService.setJson(cacheKey, user, PROFILE_CACHE_TTL);
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to fetch user ${userId}`, error);
      throw new InternalServerErrorException('Could not fetch user details');
    }
  }

  async verifyUserManually(userId: string, actorId: string) {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: { isEmailVerified: true },
        select: { id: true, email: true, isEmailVerified: true },
      });

      await this.clearUserCache(userId);

      this.logger.log(`Admin ${actorId} manually verified user ${userId}`);
      return user;
    } catch (error) {
      this.logger.error('Verification update failed', error);
      throw new InternalServerErrorException('Failed to manually verify user');
    }
  }

  private handlePrismaError(err: unknown, userId: string) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2025'
    ) {
      this.logger.warn(`User not found: ${userId}`);
      throw new NotFoundException('User not found');
    }
    this.logger.error(`Operation failed for: ${userId}`, err);
  }
}
