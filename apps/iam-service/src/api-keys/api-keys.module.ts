import { Module } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { AuthModule } from 'src/auth/auth.module';
import { ActivityLogModule } from 'src/activity-log/activity-log.module';
import { TenantsModule } from 'src/tenants/tenants.module';
import { ApiKeysController } from './api-keys.controller';

@Module({
  imports: [AuthModule, ActivityLogModule, TenantsModule],
  providers: [ApiKeysService],
  exports: [ApiKeysService],
  controllers: [ApiKeysController],
})
export class ApiKeysModule {}
