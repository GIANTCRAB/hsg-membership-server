import { IsDefined, IsEmail, IsNotEmpty } from 'class-validator';

export class RegisterUserDto {
  @IsNotEmpty()
  @IsDefined()
  @IsEmail()
  email: string;

  @IsDefined()
  @IsNotEmpty()
  first_name: string;

  @IsDefined()
  @IsNotEmpty()
  last_name: string;

  @IsDefined()
  @IsNotEmpty()
  password: string;
}
