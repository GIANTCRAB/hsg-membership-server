export class PasswordResetResponseDto {
  id: string;
  email: string;
  expires_at: Date;
  created_at: Date;
}
