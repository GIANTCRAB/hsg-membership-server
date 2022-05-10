import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { map, Observable, switchMap } from 'rxjs';
import { UserTokenGuard } from '../../guards/user-token-guard';
import { LoginTokensService } from '../../services/login-tokens.service';
import { UserProfilesService } from '../../services/user-profiles.service';
import { UpdateUserProfileDto } from './update-user-profile-dto';
import { UpdateUserPasswordDto } from './update-user-password-dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { GetPageDto } from '../../shared-dto/get-page.dto';

@Controller('api/user-profiles')
export class UserProfilesController {
  constructor(
    private readonly loginTokensService: LoginTokensService,
    private readonly userProfilesService: UserProfilesService,
  ) {}

  @Get()
  @HttpCode(200)
  getUserProfiles(@Body() getPageDto: GetPageDto): Observable<object> {
    return this.userProfilesService.getUserProfilesAndCount(getPageDto.page);
  }

  @ApiBearerAuth()
  @Get('self')
  @UseGuards(UserTokenGuard)
  getOwnProfileDetails(
    @Headers('authorization') authorizationToken: string,
  ): Observable<object> {
    return this.loginTokensService
      .getUserFromToken(authorizationToken)
      .pipe(
        switchMap((user) => this.userProfilesService.getFullUserProfile(user)),
      );
  }

  @ApiBearerAuth()
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

  @ApiBearerAuth()
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

  @ApiBearerAuth()
  @Get(':id/view')
  @UseGuards(UserTokenGuard)
  getUserProfileDetails(@Param() params): Observable<object> {
    return this.userProfilesService.getUserProfileById(params.id).pipe(
      map((user) => {
        if (user) {
          return user;
        }
        throw new HttpException(
          'User with such an ID could not be found.',
          HttpStatus.NOT_FOUND,
        );
      }),
    );
  }
}
