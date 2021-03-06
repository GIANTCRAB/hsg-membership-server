import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { UserEntity } from '../entities/user.entity';
import { LoginTokenEntity } from '../entities/login-token.entity';
import { SpaceEventEntity } from '../entities/space-event.entity';
import { UserEmailVerificationEntity } from '../entities/user-email-verification.entity';
import { PhotoEntity } from '../entities/photo.entity';
import { InventoryItemEntity } from '../entities/inventory-item.entity';
import { InventoryCategoryEntity } from '../entities/inventory-category.entity';
import { PasswordResetEntity } from '../entities/password-reset.entity';
import { join } from 'node:path';

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
        PasswordResetEntity,
        PhotoEntity,
        SpaceEventEntity,
        InventoryCategoryEntity,
        InventoryItemEntity,
      ],
      migrations: [join(__dirname, '..', 'migrations/*{.ts,.js}')],
      cli: {
        migrationsDir: join(__dirname, '..', 'migrations'),
      },
      synchronize: true,
      dropSchema: true,
    };
  }
}
