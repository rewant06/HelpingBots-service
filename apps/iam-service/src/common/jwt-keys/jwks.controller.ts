import { Controller, Get, Header } from '@nestjs/common';
import { JwtKeysService } from './jwt-keys.service';

function resolveIssuer(): string {
  // Production must set this (example: https://api.helpingbots.in)
  const explicit = process.env.PUBLIC_ISSUER?.trim();
  if (explicit) return explicit.replace(/\/+$/, '');

  // Dev fallback
  const port = process.env.PORT?.trim() || '8000';
  return `http://localhost:${port}`;
}

@Controller('.well-known')
export class JwksController {
  constructor(private readonly jwtKeys: JwtKeysService) {}

  @Get('jwks.json')
  @Header('Content-Type', 'application/json')
  @Header(
    'Cache-Control',
    'public, max-age=300, stale-while-revalidate=300, stale-if-error=86400',
  )
  async jwks(): Promise<{ keys: Array<Record<string, unknown>> }> {
    const keys = await this.jwtKeys.getPublishablePublicJwks();
    return { keys };
  }

  @Get('openid-configuration')
  @Header('Content-Type', 'application/json')
  @Header(
    'Cache-Control',
    'public, max-age=300, stale-while-revalidate=300, stale-if-error=86400',
  )
  async openidConfiguration(): Promise<{
    issuer: string;
    jwks_uri: string;
    response_types_supported: string[];
    subject_types_supported: string[];
    id_token_signing_alg_values_supported: string[];
  }> {
    const issuer = resolveIssuer();

    return {
      issuer,
      jwks_uri: `${issuer}/.well-known/jwks.json`,
      // Minimal “useful” set widely expected by OIDC clients:
      response_types_supported: ['code'],
      subject_types_supported: ['public'],
      id_token_signing_alg_values_supported: ['RS256'],
    };
  }
}
