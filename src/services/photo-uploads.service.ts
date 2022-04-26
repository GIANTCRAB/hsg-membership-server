import { Injectable } from '@nestjs/common';
import { Connection, EntityManager } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { PhotoEntity } from '../entities/photo.entity';
import { from, Observable } from 'rxjs';

@Injectable()
export class PhotoUploadsService {
  constructor(private readonly connection: Connection) {}

  public uploadPhoto(
    photo: Express.Multer.File,
    title: string,
    user: UserEntity,
  ): Observable<PhotoEntity> {
    const photoEntity: PhotoEntity = new PhotoEntity({
      title: title,
      filename: photo.filename,
      mime_type: photo.mimetype,
      uploaded_by: user,
    });

    return from(this.connection.manager.save(photoEntity));
  }

  public uploadPhotoUsingTransaction(
    transactionalEntityManager: EntityManager,
    photo: Express.Multer.File,
    title: string,
    user: UserEntity,
  ): Promise<PhotoEntity> {
    const photoEntity: PhotoEntity = new PhotoEntity({
      title: title,
      filename: photo.filename,
      mime_type: photo.mimetype,
      uploaded_by: user,
    });

    return transactionalEntityManager.save(photoEntity);
  }

  public getSpecificPhotoById(photoId): Observable<PhotoEntity> {
    return from(this.connection.manager.findOne(PhotoEntity, photoId));
  }
}
