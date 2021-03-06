import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { RegisterUserDto } from '../src/controllers/registration/register-user-dto';
import { getConnection } from 'typeorm';
import { UsersService } from '../src/services/users.service';
import { first, firstValueFrom, map, switchMap } from 'rxjs';
import { UserEmailVerificationsService } from '../src/services/user-email-verifications.service';
import { UserTokenDto } from '../src/controllers/login/user-token-dto';
import { UserEntity } from '../src/entities/user.entity';
import { LoginTokensService } from '../src/services/login-tokens.service';
import { ThrottleStorageService } from '../src/services/throttle-storage-service';
import { PasswordResetsService } from '../src/services/password-resets.service';
import moment from 'moment/moment';

export class TestE2eHelpers {
  moduleFixture: TestingModule;
  app: INestApplication = null;

  public async startServer(): Promise<INestApplication> {
    this.moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    this.app = this.moduleFixture.createNestApplication();
    this.app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await this.app.init();
    return this.app;
  }

  public async stopServer(): Promise<void> {
    await this.app.close();
  }

  public async resetDatabase(): Promise<void> {
    await getConnection().synchronize(true);
  }

  public resetMiddlewares() {
    const throttleStorageService = this.moduleFixture.get(
      ThrottleStorageService,
    );
    throttleStorageService.resetAllRecords();
  }

  public async getEmailVerificationToken(email: string) {
    const userEmailVerificationsService = this.moduleFixture.get(
      UserEmailVerificationsService,
    );
    return firstValueFrom(
      userEmailVerificationsService.getUserEmailVerificationByEmail(email),
    );
  }

  public async createPasswordResetEntity(user: UserEntity) {
    const passwordResetsService = this.moduleFixture.get(PasswordResetsService);
    const fiveMinutesAgo = moment().subtract(5, 'minutes').utc().toDate();
    return firstValueFrom(
      passwordResetsService.createPasswordResetEntity(user, fiveMinutesAgo),
    );
  }

  public async getPasswordResetEntity(id: string) {
    const passwordResetsService = this.moduleFixture.get(PasswordResetsService);
    return firstValueFrom(passwordResetsService.getPasswordResetById(id));
  }

  public async createValidUser(userData: RegisterUserDto) {
    const usersService: UsersService = this.moduleFixture.get(UsersService);
    return firstValueFrom(
      usersService.hashPassword(userData.password).pipe(
        first(),
        switchMap((hashedPassword) => {
          return usersService.createUser({
            email: userData.email,
            first_name: userData.first_name,
            last_name: userData.last_name,
            is_banned: false,
            is_verified: true,
            hashed_password: hashedPassword,
          });
        }),
      ),
    );
  }

  public async createValidMember(userData: RegisterUserDto) {
    const usersService: UsersService = this.moduleFixture.get(UsersService);
    return firstValueFrom(
      usersService.hashPassword(userData.password).pipe(
        first(),
        switchMap((hashedPassword) => {
          return usersService.createUser({
            email: userData.email,
            first_name: userData.first_name,
            last_name: userData.last_name,
            is_banned: false,
            is_verified: true,
            is_member: true,
            hashed_password: hashedPassword,
          });
        }),
      ),
    );
  }

  public async createValidAdmin(userData: RegisterUserDto) {
    const usersService: UsersService = this.moduleFixture.get(UsersService);
    return firstValueFrom(
      usersService.hashPassword(userData.password).pipe(
        first(),
        switchMap((hashedPassword) => {
          return usersService.createUser({
            email: userData.email,
            first_name: userData.first_name,
            last_name: userData.last_name,
            is_banned: false,
            is_verified: true,
            is_admin: true,
            hashed_password: hashedPassword,
          });
        }),
      ),
    );
  }

  public async createBannedUser(userData: RegisterUserDto) {
    const usersService: UsersService = this.moduleFixture.get(UsersService);
    return firstValueFrom(
      usersService.hashPassword(userData.password).pipe(
        first(),
        switchMap((hashedPassword) => {
          return usersService.createUser({
            email: userData.email,
            first_name: userData.first_name,
            last_name: userData.last_name,
            is_banned: true,
            is_verified: true,
            hashed_password: hashedPassword,
          });
        }),
      ),
    );
  }

  public async createValidLoginToken(
    loginUser: UserEntity,
  ): Promise<UserTokenDto> {
    const loginTokensService = this.moduleFixture.get(LoginTokensService);
    return firstValueFrom(
      loginTokensService.createTokenForUser(loginUser).pipe(
        map((loginToken) => {
          const userTokenDto: UserTokenDto = {
            user: loginUser,
            login_token: loginToken,
          };
          return userTokenDto;
        }),
      ),
    );
  }
}
