import {
  IsBoolean,
  IsInt,
  IsISO8601,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchInventoryItemFieldsDto {
  @ApiPropertyOptional()
  @IsOptional()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  item_count: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_in_space: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_working: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  not_working_description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  not_working_start_date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  owned_by_user_id: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  donated_by_user_id: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  maintained_by_user_id: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  category_id: string;
}
