import {Injectable} from "@nestjs/common";
import {Connection, MoreThan, Not} from "typeorm";
import {VerifyEmailDto} from "../controllers/user-email-verifications/verify-email-dto";
import {firstValueFrom, from, map, Observable, of, switchMap} from "rxjs";
import {UserEntity} from "../entities/user.entity";
import {UserEmailVerificationEntity} from "../entities/user-email-verification.entity";
import {EmailService} from "./email.service";

@Injectable()
export class UserEmailVerificationsService {
    constructor(private readonly connection: Connection, private readonly emailService: EmailService) {
    }

    public createUserEmailVerification(user: UserEntity): Observable<boolean> {
        return from(this.connection.transaction(async transactionalEntityManager => {
            await transactionalEntityManager.update(UserEntity, {id: user.id}, {
                is_verified: false,
            });
            const userEmailVerification = await transactionalEntityManager.create(UserEmailVerificationEntity, {
                user: user,
                email: user.email
            });
            return await firstValueFrom(this.sendEmailVerification(userEmailVerification));
        })).pipe(map(sentMessageInfo => sentMessageInfo.accepted.length > 0));
    }

    public sendEmailVerification(userEmailVerification: UserEmailVerificationEntity) {
        const emailContent = `Hey there ${userEmailVerification.user.first_name}, 
        \n\n
        Thank you for signing up with Hackerspace SG. This is your verification code: ${userEmailVerification.code} .
        \n\n
        Best Regards,\n
        Hackerspace SG
        `;

        return this.emailService.sendEmailWithPlainText(userEmailVerification.user, 'Hackerspace SG Email Verification', emailContent);
    }

    public verifyUserEmail(verifyEmailDto: VerifyEmailDto): Observable<boolean> {
        return from(this.connection.manager.findOne(UserEmailVerificationEntity, {
            where: {
                id: verifyEmailDto.id,
                code: verifyEmailDto.code,
                is_valid: true,
                is_verified: false,
                expires_at: MoreThan((new Date()).toISOString()),
                user: Not(null)
            },
            relations: ['user'],
        })).pipe(switchMap(result => {
                if (result !== undefined) {
                    return from(this.connection.transaction(async transactionalEntityManager => {
                        await transactionalEntityManager.update(UserEmailVerificationEntity, {id: result.id}, {
                            is_verified: true,
                            is_valid: false
                        });
                        return await transactionalEntityManager.update(UserEntity, {id: result.user.id}, {
                            is_verified: true,
                            email: result.email
                        });
                    })).pipe(map(result => result.affected !== undefined && result.affected > 0));
                }
                return of(false);
            }
        ));
    }
}
