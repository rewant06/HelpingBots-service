import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Matches,
  MinLength,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({
    example: 'The coffee machine is broken.',
    description: 'The content of the post',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;

  @ApiPropertyOptional({
    example: true,
    default: true,
    description: 'If true, hides the real user identity.',
  })
  @IsBoolean()
  @IsOptional() // Default: true (Logic in Service)
  isAnonymous?: boolean;

  // VETERAN FIX: Added @IsOptional()
  @ApiPropertyOptional({
    example: false,
    default: false,
    description: 'If true, post appears on global feed.',
  })
  @IsBoolean()
  @IsOptional() // Default: false (Logic in Service)
  isGlobal?: boolean;

  @ApiPropertyOptional({
    example: 'Quiet Panda',
    description: 'Custom pseudonym for this tenant.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @MinLength(3)
  @Matches(/^[a-zA-Z0-9 ]+$/, {
    message: 'Pseudonym can only contain letters and numbers.',
  })
  authorDisplayName?: string;

  @ApiPropertyOptional({
    example: 'uuid-123',
    description: 'The specific space/channel ID.',
  })
  @IsOptional()
  @IsString()
  spaceId?: string;

  @ApiPropertyOptional({
    example: ['Yes', 'No'],
    description: 'Options for a poll',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(2, { message: 'Poll must have at least 2 options' })
  @ArrayMaxSize(10, { message: 'Poll cannot have more than 10 options' })
  pollOptions?: string[];
}
