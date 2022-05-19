import {
  Body,
  Controller,
  Delete,
  Headers,
  HttpCode,
  Post,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import { LoginTokensService } from '../../services/login-tokens.service';
import { map, Observable, switchMap } from 'rxjs';
import { LoginUserDto } from './login-user-dto';
import { UsersService } from '../../services/users.service';
import { UserTokenDto } from './user-token-dto';
import { UserTokenGuard } from '../../guards/user-token-guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('api/user-auth')
export class LoginController {
  constructor(
    private loginTokensService: LoginTokensService,
    private usersService: UsersService,
  ) {}

  @Post('login')
  @HttpCode(201)
  postUserLogin(@Body() loginUserDto: LoginUserDto): Observable<object> {
    return this.usersService.getUserByEmailAndPassword(loginUserDto).pipe(
      switchMap((loginUser) => {
        if (loginUser === null) {
          throw new UnprocessableEntityException(['Incorrect login details.']);
        } else {
          return this.loginTokensService.createTokenForUser(loginUser).pipe(
            map((loginToken) => {
              const userTokenDto: UserTokenDto = {
                user: loginUser,
                login_token: loginToken,
              };
              return userTokenDto;
            }),
          );
        }
      }),
    );
  }

  @ApiBearerAuth()
  @Delete('logout')
  @HttpCode(204)
  @UseGuards(UserTokenGuard)
  postUserLogout(
    @Headers('authorization') authorizationToken: string,
  ): Observable<object> {
    return this.loginTokensService
      .getLoginTokenFromString(authorizationToken)
      .pipe(
        switchMap((loginToken) =>
          this.loginTokensService.invalidateLoginToken(loginToken),
        ),
      );
  }
}
