import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Observable, switchMap } from 'rxjs';
import { UserTokenGuard } from '../../guards/user-token-guard';
import { LoginTokensService } from '../../services/login-tokens.service';
import { UserProfilesService } from '../../services/user-profiles.service';
import { UpdateUserProfileDto } from './update-user-profile-dto';

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
}
