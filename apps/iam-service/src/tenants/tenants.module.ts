import { Module, forwardRef } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { ApiKeysModule } from 'src/api-keys/api-keys.module';
import { AuthModule } from 'src/auth/auth.module';
import { TenantsMembershipService } from './tenants-membership.service';

@Module({
  imports: [forwardRef(() => ApiKeysModule), AuthModule],
  controllers: [TenantsController],
  providers: [TenantsService, TenantsMembershipService],
  exports: [TenantsService, TenantsMembershipService],
})
export class TenantsModule {}
