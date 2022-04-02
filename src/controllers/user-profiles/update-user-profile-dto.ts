import { IsOptional } from 'class-validator';

export class UpdateUserProfileDto {
  @IsOptional()
  first_name: string;

  @IsOptional()
  last_name: string;
}
