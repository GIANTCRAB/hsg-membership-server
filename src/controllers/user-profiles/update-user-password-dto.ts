import { IsDefined, IsNotEmpty } from 'class-validator';

export class UpdateUserPasswordDto {
  @IsNotEmpty()
  @IsDefined()
  old_password: string;

  @IsNotEmpty()
  @IsDefined()
  new_password: string;
}
