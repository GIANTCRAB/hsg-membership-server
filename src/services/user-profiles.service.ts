import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';
import { from, Observable, switchMap } from 'rxjs';
import { UserEntity } from '../entities/user.entity';
import { UpdateUserProfileDto } from '../controllers/user-profiles/update-user-profile-dto';

@Injectable()
export class UserProfilesService {
  constructor(private readonly connection: Connection) {}

  public updateUserProfile(
    updateUserProfileDto: UpdateUserProfileDto,
    user: UserEntity,
  ): Observable<UserEntity> {
    return from(
      this.connection.manager.update(
        UserEntity,
        { id: user.id },
        {
          first_name: updateUserProfileDto.first_name,
          last_name: updateUserProfileDto.last_name,
        },
      ),
    ).pipe(
      switchMap(() =>
        from(this.connection.manager.findOne(UserEntity, user.id)),
      ),
    );
  }
}
