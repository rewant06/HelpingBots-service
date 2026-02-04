import { Test } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';

import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { RedisService } from 'src/redis/redis.service';
import { ActivityLogService } from 'src/activity-log/activity-log.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { HttpContextService } from 'src/activity-log/http-context.service';
import { RbacService } from './rbac/rbac.service';
import { PasswordWorkerService } from 'src/password-worker/password-worker.service';
import { TenantsMembershipService } from 'src/tenants/tenants-membership.service';

describe('AuthService', () => {
  it('should be defined', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: {} },
        {
          provide: RedisService,
          useValue: {
            client: { multi: jest.fn(), del: jest.fn() },
            get: jest.fn(),
            set: jest.fn(),
            acquireLock: jest.fn(),
            releaseLock: jest.fn(),
          },
        },
        { provide: ActivityLogService, useValue: { createLog: jest.fn() } },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
            decode: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: { user: {}, refreshToken: {}, $transaction: jest.fn() },
        },
        { provide: HttpContextService, useValue: { setActor: jest.fn() } },
        {
          provide: RbacService,
          useValue: {
            getPermissionsForUser: jest.fn(),
            clearCacheForUser: jest.fn(),
          },
        },
        {
          provide: PasswordWorkerService,
          useValue: { hash: jest.fn(), verify: jest.fn() },
        },
        {
          provide: TenantsMembershipService,
          useValue: {
            getTenantIds: jest.fn(),
            getTenantRolesByTenant: jest.fn(),
            getDefaultActiveTenantId: jest.fn(),
          },
        },
        { provide: getQueueToken('email'), useValue: { add: jest.fn() } },
      ],
    }).compile();

    expect(moduleRef.get(AuthService)).toBeDefined();
  });
});
