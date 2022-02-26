import {Injectable} from "@nestjs/common";
import {RegisterUserDto} from "../controllers/registration/register-user-dto";
import {UserEntity} from "../entities/user.entity";
import {Connection} from "typeorm";
import {first, from, Observable, of, switchMap} from "rxjs";
import * as argon2 from "argon2";
import {LoginUserDto} from "../controllers/login/login-user-dto";

@Injectable()
export class UsersService {
    constructor(private readonly connection: Connection) {
    }

    public registerUser(registerUserDto: RegisterUserDto): Observable<UserEntity> {
        // kibibyte as memory cost
        return from(argon2.hash(registerUserDto.password, {
            type: argon2.argon2id,
            memoryCost: 15360,
            parallelism: 1,
            timeCost: 2
        }))
            .pipe(
                first(),
                switchMap(hashedPassword => {
                    const user: UserEntity = new UserEntity({
                        email: registerUserDto.email,
                        first_name: registerUserDto.first_name,
                        last_name: registerUserDto.last_name,
                        hashed_password: hashedPassword,
                    });
                    return from(this.connection.manager.save(user));
                })
            )
    }

    public loginUser(loginUserDto: LoginUserDto): Observable<UserEntity | null> {
        return from(this.connection.manager.find(UserEntity, {
            where: {
                email: loginUserDto.email
            }
        })).pipe(
            first(),
            switchMap(users => {
                if (users.length > 0) {
                    return from(argon2.verify(users[0].hashed_password, loginUserDto.password))
                        .pipe(
                            first(),
                            switchMap(isValid => isValid ? of(users[0]) : of(null))
                        );
                }
                return of(null);
            })
        );
    }
}
