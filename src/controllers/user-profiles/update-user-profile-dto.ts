import { IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  first_name: string;

  @ApiPropertyOptional()
  @IsOptional()
  last_name: string;
}
