import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuthzController } from './authz.controller';
import { AuthzService } from './authz.service';
import { UvmvController } from './uvmv/uvmv.controller';
import { UvmvService } from './uvmv/uvmv.service';
import { TenantsModule } from 'src/tenants/tenants.module';

@Module({
  imports: [AuthModule, TenantsModule],
  controllers: [AuthzController, UvmvController],
  providers: [AuthzService, UvmvService],
})
export class AuthzModule {}
