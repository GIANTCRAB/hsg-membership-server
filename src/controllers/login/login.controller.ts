import {Body, Controller, HttpCode, HttpException, HttpStatus, Post} from "@nestjs/common";
import {LoginTokensService} from "../../services/login-tokens.service";
import {Observable, of, switchMap} from "rxjs";
import {LoginUserDto} from "./login-user-dto";
import {UsersService} from "../../services/users.service";
import {UserTokenDto} from "./user-token-dto";

@Controller('user-login')
export class LoginController {
    constructor(private loginTokensService: LoginTokensService, private usersService: UsersService) {

    }

    @Post()
    @HttpCode(201)
    postUserLogin(@Body() loginUserDto: LoginUserDto): Observable<object> {
        return this.usersService.loginUser(loginUserDto).pipe(switchMap(loginUser => {
            if (loginUser === null) {
                throw new HttpException('Incorrect login details.', HttpStatus.UNPROCESSABLE_ENTITY);
            } else {
                return this.loginTokensService.createTokenForUser(loginUser)
                    .pipe(switchMap(loginToken => {
                        const userTokenDto: UserTokenDto = {
                            user: loginUser,
                            login_token: loginToken
                        };
                        return of(userTokenDto);
                    }));
            }
        }));
    }
}
