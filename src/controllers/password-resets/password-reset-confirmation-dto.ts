import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsEmail, IsNotEmpty } from 'class-validator';

export class PasswordResetConfirmationDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsDefined()
  @IsNotEmpty()
  code: string;

  @ApiProperty()
  @IsNotEmpty()
  new_password: string;
}
