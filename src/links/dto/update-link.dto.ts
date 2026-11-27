import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { CreateLinkDto } from './create-link.dto.js';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateLinkDto extends PartialType(
  OmitType(CreateLinkDto, ['customAlias'] as const),
) {
  @ApiPropertyOptional({
    example: false,
    description: 'Set to false to disable redirects without deleting the link',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
