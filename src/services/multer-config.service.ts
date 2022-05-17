import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import {
  MulterModuleOptions,
  MulterOptionsFactory,
} from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MulterConfigService implements MulterOptionsFactory {
  constructor(private configService: ConfigService) {}

  createMulterOptions(): Promise<MulterModuleOptions> | MulterModuleOptions {
    return {
      fileFilter: (request, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
          return callback(
            new UnprocessableEntityException(['Not a valid file type.']),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: this.configService.get<number>('MAX_UPLOAD_PHOTO_SIZE'),
      },
      storage: diskStorage({
        destination: './photo-uploads',
        filename: (request, file, callback) => {
          const fileExtension = file.originalname
            .split('.')
            .pop()
            .toLowerCase();
          callback(
            null,
            `${randomStringGenerator()}-${randomStringGenerator()}.${fileExtension}`,
          );
        },
      }),
    };
  }
}
