import { IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateInventoryCategoryDto {
  @ApiPropertyOptional()
  @IsOptional()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  description: string;
}
