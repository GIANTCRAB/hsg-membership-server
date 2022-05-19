import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { from, Observable } from 'rxjs';
import { PasswordResetEntity } from '../entities/password-reset.entity';
import crypto from 'crypto';
import moment from 'moment';
import { EmailService } from './email.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PasswordResetsService {
  constructor(
    private readonly connection: Connection,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  public resetUserPassword(user: UserEntity): Observable<PasswordResetEntity> {
    const verificationCode = Buffer.from(
      crypto.randomBytes(64).toString('hex'),
    ).toString('base64');

    const passwordResetEntity: PasswordResetEntity = new PasswordResetEntity({
      email: user.email,
      user: user,
      code: verificationCode,
      expires_at: moment().utc().add(10, 'minutes').toDate(),
    });

    return from(this.connection.manager.save(passwordResetEntity));
  }

  public sendPasswordResetEmail(passwordResetEntity: PasswordResetEntity) {
    const passwordResetUrl =
      this.configService.get<string>('APP_URL') +
      '/password-resets/' +
      passwordResetEntity.id;
    const emailContent = `Hey there ${passwordResetEntity.user.first_name}, 
        \n\n
        You have requested for a password reset for your Hackerspace SG account. This is your reset code: ${passwordResetEntity.code}
        \n\n
        Please ignore this email if you have not requested for a password reset.
        \n\n
        Reset url: ${passwordResetUrl}
        \n\n
        Best Regards,\n
        Hackerspace SG
        `;

    return this.emailService.sendEmailWithPlainText(
      passwordResetEntity.user,
      'Hackerspace SG Password Reset',
      emailContent,
    );
  }
}
