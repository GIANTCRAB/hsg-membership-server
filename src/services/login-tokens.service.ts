import {Injectable} from "@nestjs/common";
import {Connection} from "typeorm";
import {UserEntity} from "../entities/user.entity";
import {LoginTokenEntity} from "../entities/login-token.entity";
import {first, from, Observable, of, switchMap} from "rxjs";
import * as argon2 from "argon2";
import * as moment from "moment";
import * as crypto from "crypto";

@Injectable()
export class LoginTokensService {
    constructor(private readonly connection: Connection) {
    }

    public createTokenForUser(user: UserEntity): Observable<LoginTokenEntity> {
        const randomId = crypto.randomBytes(32).toString('hex');
        return from(argon2.hash(randomId, {
            type: argon2.argon2id,
            memoryCost: 15360,
            parallelism: 1,
            timeCost: 2
        })).pipe(
            first(),
            switchMap(hashedId => {
                const loginToken: LoginTokenEntity = new LoginTokenEntity({
                    value: Buffer.from(hashedId).toString('base64'),
                    expires_at: moment().utc().add(3, 'months').toDate(),
                    user: user
                });
                return from(this.connection.manager.save(loginToken));
            }));
    }

    public verifyTokenIsValid(token: string): Observable<boolean> {
        return from(this.connection.manager.find(LoginTokenEntity, {
            where: {
                value: token,
                is_valid: true
            }
        })).pipe(first(), switchMap(result => {
            return of(result.length > 0);
        }));
    }
}
