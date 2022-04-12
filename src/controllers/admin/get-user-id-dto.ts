import { IsNotEmpty, IsUUID } from 'class-validator';

export class GetUserIdDto {
  @IsUUID()
  @IsNotEmpty()
  user_id: string;
}
