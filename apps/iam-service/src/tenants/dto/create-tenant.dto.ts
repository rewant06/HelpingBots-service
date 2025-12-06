import {
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
  IsEnum,
  IsOptional,
  IsBoolean,
  Equals,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TenantType } from '@prisma/iam-client';

export class CreateTenantDto {
  @ApiProperty({
    example: 'TechCorp Inc.',
    description: 'The display name of the organization',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string; // Healthunity solutions private limited

  @ApiPropertyOptional({
    example: 'tech-corp',
    description: 'Unique URL-friendly identifier. Auto-generated if omitted.',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must be kebab-case (e.g. tech-corp)',
  })
  slug: string; // dr.reach

  @ApiPropertyOptional({ enum: TenantType, default: TenantType.ORGANIZATION })
  @IsEnum(TenantType)
  @IsOptional()
  type?: TenantType; // Defaults to ORGANIZATION if omitted

  @ApiProperty({ example: 'CTO', description: 'Job Title of the creator' })
  @IsString()
  @IsNotEmpty()
  jobTitle: string;

  @ApiProperty({ example: true, description: 'Legal declaration of authority' })
  @IsBoolean()
  @Equals(true, {
    message: 'You must confirm you are authorized to create this organization.',
  })
  isAuthorized: boolean;
}
