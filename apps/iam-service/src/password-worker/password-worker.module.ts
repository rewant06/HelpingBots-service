import { Module, Global } from '@nestjs/common';
import { PasswordWorkerService } from './password-worker.service';

@Global()
@Module({
  exports: [PasswordWorkerService],
  providers: [PasswordWorkerService],
})
export class PasswordWorkerModule {}
