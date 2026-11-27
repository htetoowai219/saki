import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
} from 'class-validator';

export class CreateLinkDto {
  @ApiProperty({
    example: 'https://docs.nestjs.com/application/validation',
    description: 'The long destination URL (must include http:// or https://)',
  })
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
  })
  originalUrl!: string;

  @ApiPropertyOptional({
    example: 'nest-validation',
    description: 'Optional custom short code (3-32 URL-safe characters)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]{3,32}$/, {
    message:
      'customAlias must be 3-32 characters using only letters, numbers, hyphens, or underscores',
  })
  customAlias?: string;

  @ApiPropertyOptional({
    example: '2027-01-01T00:00:00.000Z',
    description: 'Optional ISO-8601 expiration timestamp',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
