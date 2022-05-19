import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { map, Observable, switchMap, timer } from 'rxjs';
import { PasswordResetsService } from '../../services/password-resets.service';
import { PasswordResetRequestDto } from './password-reset-request-dto';
import { UsersService } from '../../services/users.service';
import { PasswordResetConfirmationDto } from './password-reset-confirmation-dto';

@Controller('api/password-resets')
export class PasswordResetsController {
  constructor(
    private readonly passwordResetsService: PasswordResetsService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  requestPasswordReset(
    @Body() passwordResetRequestDto: PasswordResetRequestDto,
  ): Observable<object> {
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
          return this.passwordResetsService.requestUserPasswordReset(result);
        }
      }),
      map((createdResult) =>
        this.passwordResetsService.createPasswordResetResponseDto(
          createdResult ? createdResult : undefined,
          passwordResetRequestDto,
        ),
      ),
    );
  }

  @Post(':id')
  @HttpCode(HttpStatus.OK)
  confirmPasswordReset(
    @Param() params,
    @Body() passwordResetConfirmationDto: PasswordResetConfirmationDto,
  ): Observable<object> {
    return this.passwordResetsService
      .getPasswordResetByIdAndDto(params.id, passwordResetConfirmationDto)
      .pipe(
        switchMap((result) => {
          if (result !== undefined) {
            return this.passwordResetsService.confirmPasswordReset(
              result,
              passwordResetConfirmationDto,
            );
          }

          throw new NotFoundException([
            'Password reset with such an id or email or code could not be found.',
          ]);
        }),
      );
  }
}
