import { IsDefined, IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterUserDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsDefined()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsDefined()
  @IsNotEmpty()
  first_name: string;

  @ApiProperty()
  @IsDefined()
  @IsNotEmpty()
  last_name: string;

  @ApiProperty()
  @IsDefined()
  @IsNotEmpty()
  password: string;
}
