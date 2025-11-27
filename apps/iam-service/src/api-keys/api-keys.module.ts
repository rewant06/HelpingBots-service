import { Module } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { AuthModule } from 'src/auth/auth.module';
import { ActivityLogModule } from 'src/activity-log/activity-log.module';

@Module({
  imports: [AuthModule, ActivityLogModule],
  providers: [ApiKeysService],
  exports: [ApiKeysService],
})
export class ApiKeysModule {}
