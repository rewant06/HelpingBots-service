import {
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { TenantType } from '@prisma/iam-client';

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string; // Healthunity solutions private limited

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must be kebab-case (e.g. tech-corp)',
  })
  slug: string; // dr.reach

  @IsEnum(TenantType)
  @IsOptional()
  type?: TenantType; // Defaults to ORGANIZATION if omitted
}
