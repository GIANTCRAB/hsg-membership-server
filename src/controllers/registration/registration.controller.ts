import {
  Body,
  Controller,
  HttpCode,
  Post,
  UnprocessableEntityException,
} from '@nestjs/common';
import { RegisterUserDto } from './register-user-dto';
import { Observable, switchMap } from 'rxjs';
import { UsersService } from '../../services/users.service';
import { UserEmailVerificationsService } from '../../services/user-email-verifications.service';

@Controller('api/user-registration')
export class RegistrationController {
  constructor(
    private readonly usersService: UsersService,
    private readonly userEmailVerificationsService: UserEmailVerificationsService,
  ) {}

  @Post()
  @HttpCode(201)
  postUserRegistration(
    @Body() registerUserDto: RegisterUserDto,
  ): Observable<object> {
    return this.usersService.getUserByEmail(registerUserDto.email).pipe(
      switchMap((result) => {
        if (result !== undefined) {
          throw new UnprocessableEntityException([
            'Account with this email address already exists.',
          ]);
        } else {
          return this.usersService.registerUser(registerUserDto).pipe(
            switchMap((user) => {
              return this.userEmailVerificationsService
                .createUserEmailVerification(user)
                .pipe(
                  switchMap((emailSuccess) => {
                    if (emailSuccess) {
                      return this.usersService.getFullDisplayUserById(user.id);
                    } else {
                      throw new UnprocessableEntityException([
                        'Account created successfully but email server is down. Please request for email verification again.',
                      ]);
                    }
                  }),
                );
            }),
          );
        }
      }),
    );
  }
}
