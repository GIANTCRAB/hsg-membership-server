import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrationController } from './controllers/registration/registration.controller';
import { UsersService } from './services/users.service';
import { TypeOrmConfigService } from './services/type-orm-config.service';
import { LoginController } from './controllers/login/login.controller';
import { LoginTokensService } from './services/login-tokens.service';
import { SpaceEventsService } from './services/space-events.service';
import { SpaceEventsController } from './controllers/space-events/space-events.controller';
import { MailerModule } from '@nestjs-modules/mailer';
import { MailerConfigService } from './services/mailer-config.service';
import { UserEmailVerificationsService } from './services/user-email-verifications.service';
import { EmailService } from './services/email.service';
import { UserEmailVerificationsController } from './controllers/user-email-verifications/user-email-verifications.controller';
import { AdminService } from './services/admin.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
    }),
    MailerModule.forRootAsync({
      useClass: MailerConfigService,
    }),
  ],
  controllers: [
    RegistrationController,
    LoginController,
    SpaceEventsController,
    UserEmailVerificationsController,
  ],
  providers: [
    UsersService,
    LoginTokensService,
    SpaceEventsService,
    EmailService,
    UserEmailVerificationsService,
    AdminService,
  ],
})
export class AppModule {}
