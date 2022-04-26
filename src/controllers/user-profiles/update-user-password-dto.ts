import { IsDefined, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserPasswordDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsDefined()
  old_password: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDefined()
  new_password: string;
}
