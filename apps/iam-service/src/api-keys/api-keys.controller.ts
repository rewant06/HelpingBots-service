import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { VerifyApiKeyDto } from './dto/verify-api-key.dto';

@Controller('internal/api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verify(@Body() dto: VerifyApiKeyDto) {
    return this.apiKeysService.validateKey(dto.apiKey);
  }
}
