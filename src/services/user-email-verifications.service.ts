import { Injectable } from '@nestjs/common';
import { Connection, IsNull, MoreThan, Not } from 'typeorm';
import { VerifyEmailDto } from '../controllers/user-email-verifications/verify-email-dto';
import { from, map, Observable, of, switchMap } from 'rxjs';
import { UserEntity } from '../entities/user.entity';
import { UserEmailVerificationEntity } from '../entities/user-email-verification.entity';
import { EmailService } from './email.service';
import crypto from 'crypto';
import moment from 'moment';

@Injectable()
export class UserEmailVerificationsService {
  constructor(
    private readonly connection: Connection,
    private readonly emailService: EmailService,
  ) {}

  public getUserEmailVerificationByEmail(
    email: string,
  ): Observable<UserEmailVerificationEntity> {
    return from(
      this.connection.manager.findOne(UserEmailVerificationEntity, {
        where: { email: email },
        order: { created_at: 'DESC' },
      }),
    );
  }

  public getUserEmailVerificationByUserId(
    userId: string,
  ): Observable<UserEmailVerificationEntity> {
    return from(
      this.connection.manager.findOne(UserEmailVerificationEntity, {
        where: { user: { id: userId } },
        order: { created_at: 'DESC' },
      }),
    );
  }

  public createUserEmailVerification(user: UserEntity): Observable<boolean> {
    return from(
      this.connection.transaction(async (transactionalEntityManager) => {
        await transactionalEntityManager.update(
          UserEntity,
          { id: user.id },
          {
            is_verified: false,
          },
        );
        const verificationCode = Buffer.from(
          crypto.randomBytes(64).toString('hex'),
        ).toString('base64');
        return await transactionalEntityManager.save(
          transactionalEntityManager.create(UserEmailVerificationEntity, {
            code: verificationCode,
            user: user,
            email: user.email,
            expires_at: moment().utc().add(1, 'week').toDate(),
          }),
        );
      }),
    ).pipe(
      switchMap((userEmailVerificationEntity) =>
        this.sendEmailVerification(userEmailVerificationEntity).pipe(
          map((sentMessageInfo) => sentMessageInfo.accepted.length > 0),
        ),
      ),
    );
  }

  public sendEmailVerification(
    userEmailVerification: UserEmailVerificationEntity,
  ) {
    const emailContent = `Hey there ${userEmailVerification.user.first_name}, 
        \n\n
        Thank you for signing up with Hackerspace SG. This is your verification code: ${userEmailVerification.code} .
        \n\n
        Best Regards,\n
        Hackerspace SG
        `;

    return this.emailService.sendEmailWithPlainText(
      userEmailVerification.user,
      'Hackerspace SG Email Verification',
      emailContent,
    );
  }

  public verifyUserEmail(
    id: string,
    verifyEmailDto: VerifyEmailDto,
  ): Observable<UserEmailVerificationEntity | undefined> {
    return from(
      this.connection.manager.findOne(UserEmailVerificationEntity, {
        where: {
          id: id,
          code: verifyEmailDto.code,
          is_valid: true,
          is_verified: false,
          expires_at: MoreThan(new Date().toISOString()),
          user: Not(IsNull()),
        },
        relations: ['user'],
      }),
    ).pipe(
      switchMap((result) => {
        if (result !== undefined) {
          return from(
            this.connection.transaction(async (transactionalEntityManager) => {
              await transactionalEntityManager.update(
                UserEmailVerificationEntity,
                { id: result.id },
                {
                  is_verified: true,
                  is_valid: false,
                },
              );
              return await transactionalEntityManager.update(
                UserEntity,
                { id: result.user.id },
                {
                  is_verified: true,
                  email: result.email,
                },
              );
            }),
          ).pipe(
            switchMap((result) => {
              if (result.affected !== undefined && result.affected > 0) {
                return from(
                  this.connection.manager.findOne(UserEmailVerificationEntity, {
                    where: {
                      id: id,
                    },
                  }),
                );
              } else {
                return of(undefined);
              }
            }),
          );
        }
        return of(undefined);
      }),
    );
  }
}
