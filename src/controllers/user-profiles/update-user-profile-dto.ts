import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateUserProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  first_name: string;

  @ApiPropertyOptional()
  @IsOptional()
  last_name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_public: boolean;
}
