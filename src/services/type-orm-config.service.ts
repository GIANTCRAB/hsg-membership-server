import {Injectable} from "@nestjs/common";
import {TypeOrmModuleOptions, TypeOrmOptionsFactory} from "@nestjs/typeorm";
import {ConfigService} from "@nestjs/config";
import {MysqlConnectionOptions} from "typeorm/driver/mysql/MysqlConnectionOptions";

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
    constructor(private configService: ConfigService) {
    }

    getTypeOrmConfig(): MysqlConnectionOptions {
        return {
            type: 'mysql',
            host: this.configService.get('DATABASE_HOST'),
            port: this.configService.get<number>('DATABASE_PORT'),
            username: this.configService.get('DATABASE_USERNAME'),
            password: this.configService.get('DATABASE_PASSWORD'),
            database: this.configService.get('DATABASE_NAME'),
            entities: [__dirname + '/**/entities/*.entity.ts'],
            synchronize: true,
        }
    }

    createTypeOrmOptions(): TypeOrmModuleOptions {
        return this.getTypeOrmConfig();
    }
}
