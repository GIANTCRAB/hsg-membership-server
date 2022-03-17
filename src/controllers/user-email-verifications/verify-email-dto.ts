import { IsDefined, IsNotEmpty } from 'class-validator';

export class VerifyEmailDto {
  @IsDefined()
  @IsNotEmpty()
  code: string;
}
