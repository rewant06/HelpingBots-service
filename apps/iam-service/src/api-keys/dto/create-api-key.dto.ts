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
  //Regex to ensure scopes follow pattern "resource:action"
  @Matches(/^[a-z]+:[a-z]+$/, {
    each: true,
    message: 'Scopes must be format resource:action (e.g. posts:write)',
  })
  scopes: string[]; // ["posts:write", "analytics:read"]
}
