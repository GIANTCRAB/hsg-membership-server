import {
  IsBoolean,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInventoryItemDto {
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  description: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  item_count: number;

  @IsNotEmpty()
  @Type(() => Boolean)
  @IsBoolean()
  is_in_space: boolean;

  @IsNotEmpty()
  @Type(() => Boolean)
  @IsBoolean()
  is_working: boolean;

  @IsOptional()
  not_working_description: string;

  @IsOptional()
  @IsISO8601()
  not_working_start_date: string;

  @IsOptional()
  @IsUUID()
  owned_by_user_id: string;

  @IsOptional()
  @IsUUID()
  donated_by_user_id: string;

  @IsOptional()
  @IsUUID()
  maintained_by_user_id: string;

  @IsOptional()
  @IsUUID()
  category_id: string;
}
