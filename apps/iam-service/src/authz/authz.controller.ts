import { Controller, Get } from '@nestjs/common';
import { AuthzService } from './authz.service';

@Controller('authz')
export class AuthzController {
  constructor(private readonly authzService: AuthzService) {}

  @Get('version')
  getVersion() {
    return this.authzService.getContract();
  }
}
