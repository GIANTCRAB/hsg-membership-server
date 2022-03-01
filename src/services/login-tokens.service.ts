import {Injectable} from "@nestjs/common";
import {Connection, MoreThan} from "typeorm";
import {UserEntity} from "../entities/user.entity";
import {LoginTokenEntity} from "../entities/login-token.entity";
import {first, from, map, Observable, switchMap} from "rxjs";
import argon2 from "argon2";
import moment from "moment";
import crypto from "crypto";

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
                is_valid: true,
                expires_at: MoreThan((new Date()).toISOString())
            }
        })).pipe(first(), map(result => {
            return result.length !== 0;
        }));
    }

    public getLoginTokenFromString(token: string): Observable<LoginTokenEntity> {
        return from(this.connection.manager.find(LoginTokenEntity, {
            where: {
                value: token,
                is_valid: true,
                expires_at: MoreThan((new Date()).toISOString())
            }
        })).pipe(first(), map(result => {
            return result[0];
        }));
    }

    public getUserFromToken(token: string): Observable<UserEntity> {
        return from(this.connection.manager.findOne(LoginTokenEntity, {
            where: {
                value: token,
                is_valid: true,
                expires_at: MoreThan((new Date()).toISOString())
            }
        })).pipe(map(result => {
            return result.user;
        }));
    }

    public invalidateLoginToken(loginToken: LoginTokenEntity) {
        return from(this.connection.manager.update(LoginTokenEntity, {id: loginToken.id}, {is_valid: false}));
    }

    public invalidateAllLoginTokensOfUser(user: UserEntity) {
        return from(this.connection.manager.update(LoginTokenEntity, {user: user}, {is_valid: false}));
    }
}
