import {Body, Controller, Delete, Headers, HttpCode, HttpException, HttpStatus, Post, UseGuards} from "@nestjs/common";
import {LoginTokensService} from "../../services/login-tokens.service";
import {map, Observable, switchMap} from "rxjs";
import {LoginUserDto} from "./login-user-dto";
import {UsersService} from "../../services/users.service";
import {UserTokenDto} from "./user-token-dto";
import {UserTokenGuard} from "../../guards/user-token-guard";

@Controller('user-auth')
export class LoginController {
    constructor(private loginTokensService: LoginTokensService, private usersService: UsersService) {

    }

    @Post('login')
    @HttpCode(201)
    postUserLogin(@Body() loginUserDto: LoginUserDto): Observable<object> {
        return this.usersService.loginUser(loginUserDto).pipe(switchMap(loginUser => {
            if (loginUser === null) {
                throw new HttpException('Incorrect login details.', HttpStatus.UNPROCESSABLE_ENTITY);
            } else {
                return this.loginTokensService.createTokenForUser(loginUser)
                    .pipe(map(loginToken => {
                        const userTokenDto: UserTokenDto = {
                            user: loginUser,
                            login_token: loginToken
                        };
                        return userTokenDto;
                    }));
            }
        }));
    }

    @Delete('logout')
    @HttpCode(204)
    @UseGuards(UserTokenGuard)
    postUserLogout(@Headers("authorization") authorizationToken: string): Observable<object> {
        return this.loginTokensService.getLoginTokenFromString(authorizationToken)
            .pipe(switchMap(loginToken => this.loginTokensService.invalidateLoginToken(loginToken)));
    }
}
