import {Module} from '@nestjs/common';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {ConfigModule, ConfigService} from "@nestjs/config";
import {TypeOrmModule} from "@nestjs/typeorm";
import {RegistrationController} from "./controllers/registration/registration.controller";
import {UsersService} from "./services/users.service";
import {TypeOrmConfigService} from "./services/type-orm-config.service";
import {LoginController} from "./controllers/login/login.controller";
import {LoginTokensService} from "./services/login-tokens.service";
import {SpaceEventsService} from "./services/space-events.service";
import {SpaceEventsController} from "./controllers/space-events/space-events.controller";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        TypeOrmModule.forRootAsync({
            useClass: TypeOrmConfigService,
        }),
    ],
    controllers: [
        AppController,
        RegistrationController,
        LoginController,
        SpaceEventsController,
    ],
    providers: [
        AppService,
        UsersService,
        LoginTokensService,
        SpaceEventsService,
    ],
})
export class AppModule {
}
