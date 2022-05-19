import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { map, Observable, switchMap, timer } from 'rxjs';
import { PasswordResetsService } from '../../services/password-resets.service';
import { PasswordResetRequestDto } from './password-reset-request-dto';
import { UsersService } from '../../services/users.service';

@Controller('api/password-resets')
export class PasswordResetsController {
  constructor(
    private readonly passwordResetsService: PasswordResetsService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  requestPasswordReset(
    @Body() passwordResetRequestDto: PasswordResetRequestDto,
  ): Observable<undefined> {
    return this.usersService.getUserByEmail(passwordResetRequestDto.email).pipe(
      switchMap((result) => {
        if (result === undefined) {
          const minRandomTime = 2000;
          const randomTime = Math.max(
            Math.floor(Math.random() * 5),
            minRandomTime,
          );
          return timer(randomTime);
        } else {
          return this.passwordResetsService.resetUserPassword(result);
        }
      }),
      map(() => undefined),
    );
  }
}
