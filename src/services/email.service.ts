import { MailerService } from '@nestjs-modules/mailer';
import { UserEntity } from '../entities/user.entity';
import { from, Observable } from 'rxjs';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  public sendEmailWithPlainText(
    user: UserEntity,
    subject: string,
    content: string,
  ): Observable<SMTPTransport.SentMessageInfo> {
    return from(
      this.mailerService.sendMail({
        to: user.email,
        subject: subject,
        text: content,
      }),
    );
  }
}
