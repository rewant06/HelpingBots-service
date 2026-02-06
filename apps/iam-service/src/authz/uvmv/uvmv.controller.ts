import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';
import { UvmvService } from './uvmv.service';

@Controller('authz/uvmv')
export class UvmvController {
  constructor(private readonly uvmv: UvmvService) {}

  @UseGuards(JwtAuthGuard)
  @Post('verify')
  async verify(@Req() req: any) {
    return this.uvmv.verify(req.authClaims);
  }
}
