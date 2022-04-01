import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { UserEntity } from '../entities/user.entity';
import { LoginTokenEntity } from '../entities/login-token.entity';
import { SpaceEventEntity } from '../entities/space-event.entity';
import { UserEmailVerificationEntity } from '../entities/user-email-verification.entity';
import { PhotoEntity } from '../entities/photo.entity';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'mysql',
      host: this.configService.get<string>('DATABASE_HOST'),
      port: this.configService.get<number>('DATABASE_PORT'),
      username: this.configService.get<string>('DATABASE_USERNAME'),
      password: this.configService.get<string>('DATABASE_PASSWORD'),
      database: this.configService.get<string>('DATABASE_NAME'),
      entities: [
        UserEntity,
        UserEmailVerificationEntity,
        LoginTokenEntity,
        SpaceEventEntity,
        PhotoEntity,
      ],
      synchronize: true,
      dropSchema: true,
    };
  }
}
