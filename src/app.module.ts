import {Module} from '@nestjs/common';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {ConfigModule, ConfigService} from "@nestjs/config";
import {TypeOrmModule} from "@nestjs/typeorm";
import {RegistrationController} from "./controllers/registration/registration.controller";
import {UsersService} from "./services/users-service";
import {TypeOrmConfigService} from "./services/type-orm-config.service";

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
        RegistrationController
    ],
    providers: [
        AppService,
        UsersService,
    ],
})
export class AppModule {
}
