import { Module, forwardRef } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { ApiKeysModule } from 'src/api-keys/api-keys.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [forwardRef(() => ApiKeysModule), AuthModule],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}
