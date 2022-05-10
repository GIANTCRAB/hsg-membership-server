import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { UserEmailVerificationsService } from '../../services/user-email-verifications.service';
import { VerifyEmailDto } from './verify-email-dto';

@Controller('api/user-email-verifications')
export class UserEmailVerificationsController {
  constructor(
    private readonly userEmailVerificationsService: UserEmailVerificationsService,
  ) {}

  @Post(':id')
  @HttpCode(200)
  postEmailVerification(
    @Param() params,
    @Body() verifyEmailDto: VerifyEmailDto,
  ): Observable<object> {
    return this.userEmailVerificationsService
      .verifyUserEmail(params.id, verifyEmailDto)
      .pipe(
        map((result) => {
          if (result !== undefined) {
            return result;
          } else {
            throw new HttpException(
              'Invalid verification code.',
              HttpStatus.UNPROCESSABLE_ENTITY,
            );
          }
        }),
      );
  }
}
