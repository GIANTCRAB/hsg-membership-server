import { Controller, Get, Headers, UseGuards } from '@nestjs/common';
import { Observable } from 'rxjs';
import { UserTokenGuard } from '../../guards/user-token-guard';
import { LoginTokensService } from '../../services/login-tokens.service';

@Controller('user-profiles')
export class UserProfilesController {
  constructor(private readonly loginTokensService: LoginTokensService) {}

  @Get('self')
  @UseGuards(UserTokenGuard)
  getOwnProfileDetails(
    @Headers('authorization') authorizationToken: string,
  ): Observable<object> {
    return this.loginTokensService.getUserFromToken(authorizationToken);
  }
}
