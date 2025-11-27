import {
  Injectable,
  Logger,
  Inject,
  forwardRef,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { HttpContextService } from './http-context.service';
import { ActivityLogActionType, ActivityLogStatus } from '@prisma/iam-client';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Prisma } from '@prisma/iam-client';

@Injectable()
export class ActivityLogService {
  private readonly logger = new Logger(ActivityLogService.name);

  constructor(
    @Inject(forwardRef(() => PrismaService))
    private prisma: PrismaService,
    private httpContext: HttpContextService,
  ) {}

  async getLogs(dto: PaginationDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;
    const actorId = dto.actorId;
    const skip = (page - 1) * limit;

    this.logger.log(
      `Fetching activity logs: Page ${page}, Limit ${limit}, Filter: ${actorId || 'ALL'}`,
    );

    const where: Prisma.ActivityLogWhereInput = {};
    if (actorId) {
      where.actorId = actorId;
    }

    try {
      const [logs, total] = await this.prisma.$transaction([
        this.prisma.activityLog.findMany({
          where,
          skip: skip,
          take: limit,
          orderBy: {
            createdAt: 'desc',
          },
        }),
        this.prisma.activityLog.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: logs,
        meta: {
          total,
          page,
          limit,
          totalPages,
          lastPage: totalPages === page,
        },
      };
    } catch (err) {
      this.logger.error('Failed to get activity logs', err.stack);
      throw new InternalServerErrorException('Could not retrieve logs.');
    }
  }

  async createLog(
    actionType: ActivityLogActionType,
    status: ActivityLogStatus,
    entityType: string,
    entityId: string | null | undefined,
    changes?: any,
    failureReason?: string,
    tx?: Prisma.TransactionClient,
  ) {
    try {
      const actor = this.httpContext.getActor();
      const req = this.httpContext.getRequest();

      let contextData: any = {};
      if (req) {
        contextData = {
          ip: req.ip || req.socket?.remoteAddress,
          userAgent: req.headers?.['user-agent'],
        };
      }
      const db = tx || this.prisma;
      await db.activityLog.create({
        data: {
          actorId: actor?.id === 'system' ? null : actor?.id,
          // Create a "snapshot" of the actor for long-term storage
          actorSnapshot: actor
            ? { email: actor.email, roles: actor.roles }
            : { email: 'system', roles: [{ name: 'SYSTEM' }] },
          actionType,
          status,
          entityType,
          entityId: entityId || null,
          changes: changes || undefined,
          failureReason: failureReason || undefined,
          context: contextData,
        },
      });
    } catch (err) {
      this.logger.error('Failed to write to ActivityLog', err.stack);
      if (tx) {
        throw new InternalServerErrorException(
          'Audit Log Failed - Transaction Rolled Back',
        );
      }
    }
  }
}
