import { IsNotEmpty } from 'class-validator';

export class UpdateUserProfileDto {
  @IsNotEmpty()
  first_name: string;

  @IsNotEmpty()
  last_name: string;
}
