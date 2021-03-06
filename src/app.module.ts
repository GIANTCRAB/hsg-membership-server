import { MiddlewareConsumer, Module } from '@nestjs/common';
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
import { MulterModule } from '@nestjs/platform-express';
import { MulterConfigService } from './services/multer-config.service';
import { PhotoUploadsService } from './services/photo-uploads.service';
import { PhotosController } from './controllers/photos/photos.controller';
import { UserProfilesController } from './controllers/user-profiles/user-profiles.controller';
import { UserProfilesService } from './services/user-profiles.service';
import { ThrottleStorageService } from './services/throttle-storage-service';
import { ThrottleApiRequestMiddleware } from './middlewares/throttle-api-request.middleware';
import { AdminController } from './controllers/admin/admin.controller';
import { InventoryItemsService } from './services/inventory-items.service';
import { InventoryItemsController } from './controllers/inventory-items/inventory-items.controller';
import { InventoryCategoriesService } from './services/inventory-categories.service';
import { InventoryCategoriesController } from './controllers/inventory-categories/inventory-categories.controller';
import { CsrfController } from './controllers/csrf/csrf.controller';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';
import { PasswordResetsService } from './services/password-resets.service';
import { PasswordResetsController } from './controllers/password-resets/password-resets.controller';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(
        __dirname,
        '..',
        '..',
        'hsg-membership-client',
        'dist',
        'hsg-membership-client',
      ),
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
    }),
    MailerModule.forRootAsync({
      useClass: MailerConfigService,
    }),
    MulterModule.registerAsync({
      useClass: MulterConfigService,
    }),
  ],
  controllers: [
    RegistrationController,
    LoginController,
    PasswordResetsController,
    CsrfController,
    SpaceEventsController,
    UserEmailVerificationsController,
    PhotosController,
    UserProfilesController,
    AdminController,
    InventoryCategoriesController,
    InventoryItemsController,
  ],
  providers: [
    UsersService,
    LoginTokensService,
    PasswordResetsService,
    SpaceEventsService,
    EmailService,
    UserEmailVerificationsService,
    AdminService,
    PhotoUploadsService,
    UserProfilesService,
    ThrottleStorageService,
    InventoryCategoriesService,
    InventoryItemsService,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ThrottleApiRequestMiddleware)
      .forRoutes(
        LoginController,
        RegistrationController,
        PasswordResetsController,
      );
  }
}
