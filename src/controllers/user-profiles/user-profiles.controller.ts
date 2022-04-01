import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { map, Observable, switchMap } from 'rxjs';
import { UserTokenGuard } from '../../guards/user-token-guard';
import { LoginTokensService } from '../../services/login-tokens.service';
import { UserProfilesService } from '../../services/user-profiles.service';
import { UpdateUserProfileDto } from './update-user-profile-dto';
import { UpdateUserPasswordDto } from './update-user-password-dto';

@Controller('user-profiles')
export class UserProfilesController {
  constructor(
    private readonly loginTokensService: LoginTokensService,
    private readonly userProfilesService: UserProfilesService,
  ) {}

  @Get('self')
  @UseGuards(UserTokenGuard)
  getOwnProfileDetails(
    @Headers('authorization') authorizationToken: string,
  ): Observable<object> {
    return this.loginTokensService.getUserFromToken(authorizationToken);
  }

  @Post('update-details')
  @HttpCode(200)
  @UseGuards(UserTokenGuard)
  postOwnProfileDetails(
    @Headers('authorization') authorizationToken: string,
    @Body() updateUserProfileDto: UpdateUserProfileDto,
  ): Observable<object> {
    return this.loginTokensService.getUserFromToken(authorizationToken).pipe(
      switchMap((user) => {
        return this.userProfilesService.updateUserProfile(
          updateUserProfileDto,
          user,
        );
      }),
    );
  }

  @Post('update-password')
  @HttpCode(200)
  @UseGuards(UserTokenGuard)
  postNewPasswordDetails(
    @Headers('authorization') authorizationToken: string,
    @Body() updateUserPasswordDto: UpdateUserPasswordDto,
  ): Observable<object> {
    return this.loginTokensService.getUserFromToken(authorizationToken).pipe(
      switchMap((user) => {
        return this.userProfilesService
          .updateUserPassword(updateUserPasswordDto, user)
          .pipe(
            map((result) => {
              if (result !== undefined) {
                return result;
              } else {
                throw new HttpException(
                  'Incorrect old password.',
                  HttpStatus.UNPROCESSABLE_ENTITY,
                );
              }
            }),
          );
      }),
    );
  }
}
