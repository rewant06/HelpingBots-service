import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class CreateApiKeyDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string; // e.g. "Production Server"

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @Matches(/^[a-z0-9_-]+(?::[a-z0-9_-]+){1,2}$/, {
    each: true,
    message:
      'Scopes must be resource:action or resource:subresource:action (e.g. posts:write, labs:attachments:write)',
  })
  scopes: string[]; // ["posts:write", "analytics:read"]
}
