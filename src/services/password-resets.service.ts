import { Injectable } from '@nestjs/common';
import { Connection, MoreThan } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { from, map, Observable, switchMap } from 'rxjs';
import { PasswordResetEntity } from '../entities/password-reset.entity';
import crypto from 'crypto';
import moment from 'moment';
import { EmailService } from './email.service';
import { ConfigService } from '@nestjs/config';
import { PasswordResetConfirmationDto } from '../controllers/password-resets/password-reset-confirmation-dto';
import { UsersService } from './users.service';
import { PasswordResetRequestDto } from '../controllers/password-resets/password-reset-request-dto';
import { PasswordResetResponseDto } from '../controllers/password-resets/password-reset-response-dto';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';

@Injectable()
export class PasswordResetsService {
  private readonly resetCodeExpiryInMinutes = 10;

  constructor(
    private readonly connection: Connection,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  public requestUserPasswordReset(
    user: UserEntity,
  ): Observable<PasswordResetEntity> {
    const passwordResetCode = Buffer.from(
      crypto.randomBytes(64).toString('hex'),
    ).toString('base64');

    const passwordResetEntity: PasswordResetEntity = new PasswordResetEntity({
      email: user.email,
      user: user,
      code: passwordResetCode,
      expires_at: moment()
        .utc()
        .add(this.resetCodeExpiryInMinutes, 'minutes')
        .toDate(),
    });

    return from(this.connection.manager.save(passwordResetEntity)).pipe(
      switchMap((passwordResetEntity) => {
        return this.sendPasswordResetEmail(passwordResetEntity).pipe(
          map(() => passwordResetEntity),
        );
      }),
    );
  }

  public createPasswordResetResponseDto(
    passwordResetEntity: PasswordResetEntity = undefined,
    passwordResetRequestDto: PasswordResetRequestDto,
  ): PasswordResetResponseDto {
    if (passwordResetEntity) {
      return {
        id: passwordResetEntity.id,
        email: passwordResetEntity.email,
        expires_at: passwordResetEntity.expires_at,
        created_at: passwordResetEntity.created_at,
      };
    }

    return {
      id: randomStringGenerator(),
      email: passwordResetRequestDto.email,
      expires_at: moment()
        .utc()
        .add(this.resetCodeExpiryInMinutes, 'minutes')
        .toDate(),
      created_at: moment().utc().toDate(),
    };
  }

  public getPasswordResetByIdAndDto(
    id: string,
    passwordResetConfirmationDto: PasswordResetConfirmationDto,
  ): Observable<PasswordResetEntity | undefined> {
    return from(
      this.connection.manager.findOne(PasswordResetEntity, {
        where: {
          id,
          email: passwordResetConfirmationDto.email,
          code: passwordResetConfirmationDto.code,
          is_valid: true,
          user: {
            email: passwordResetConfirmationDto.email,
          },
          expires_at: MoreThan(new Date().toISOString()),
        },
        relations: ['user'],
      }),
    );
  }

  public getPasswordResetById(
    id: string,
  ): Observable<PasswordResetEntity | undefined> {
    return from(
      this.connection.manager.findOne(PasswordResetEntity, {
        where: {
          id,
        },
        relations: ['user'],
      }),
    );
  }

  public confirmPasswordReset(
    passwordResetEntity: PasswordResetEntity,
    passwordResetConfirmationDto: PasswordResetConfirmationDto,
  ): Observable<PasswordResetEntity> {
    return from(
      this.connection.transaction(async (transactionalEntityManager) => {
        await this.usersService.setUserPasswordUsingTransaction(
          transactionalEntityManager,
          passwordResetEntity.user,
          passwordResetConfirmationDto.new_password,
        );
        return transactionalEntityManager.update(
          PasswordResetEntity,
          { id: passwordResetEntity.id },
          { is_valid: false },
        );
      }),
    ).pipe(switchMap(() => this.getPasswordResetById(passwordResetEntity.id)));
  }

  public sendPasswordResetEmail(passwordResetEntity: PasswordResetEntity) {
    const passwordResetUrl =
      this.configService.get<string>('APP_URL') +
      '/login/' +
      passwordResetEntity.id;
    const emailContent = `Hey there ${passwordResetEntity.user.first_name}, 
        \n\n
        You have requested for a password reset for your Hackerspace SG account. Your reset code will expire in ${this.resetCodeExpiryInMinutes} minutes. Reset code: ${passwordResetEntity.code}
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
