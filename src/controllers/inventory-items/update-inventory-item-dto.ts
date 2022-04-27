import {
  IsBoolean,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateInventoryItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
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
  @ValidateIf((object, value) => value !== null)
  owned_by_user_id: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  @ValidateIf((object, value) => value !== null)
  donated_by_user_id: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  @ValidateIf((object, value) => value !== null)
  maintained_by_user_id: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  @ValidateIf((object, value) => value !== null)
  category_id: string | null;
}
