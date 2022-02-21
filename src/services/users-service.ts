import {Injectable} from "@nestjs/common";
import {RegisterUserDto} from "../controllers/registration/register-user-dto";
import {UserEntity} from "../entities/user.entity";
import {Connection} from "typeorm";
import {first, from, Observable, switchMap} from "rxjs";
import * as argon2 from "argon2";

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
                        firstName: registerUserDto.firstName,
                        lastName: registerUserDto.lastName,
                        hashedPassword: hashedPassword,
                    });
                    return from(this.connection.manager.save(user));
                })
            )
    }
}
