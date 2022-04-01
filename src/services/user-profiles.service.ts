import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';
import { first, from, Observable, of, switchMap } from 'rxjs';
import { UserEntity } from '../entities/user.entity';
import { UpdateUserProfileDto } from '../controllers/user-profiles/update-user-profile-dto';
import { UpdateUserPasswordDto } from '../controllers/user-profiles/update-user-password-dto';
import argon2 from 'argon2';
import { UsersService } from './users.service';

@Injectable()
export class UserProfilesService {
  constructor(
    private readonly connection: Connection,
    private readonly usersService: UsersService,
  ) {}

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

  public updateUserPassword(
    updateUserPasswordDto: UpdateUserPasswordDto,
    user: UserEntity,
  ): Observable<UserEntity> {
    return from(
      this.connection.manager.findOne(UserEntity, {
        where: {
          id: user.id,
        },
        select: ['id', 'hashed_password'],
      }),
    ).pipe(
      switchMap((user) => {
        return from(
          argon2.verify(
            user.hashed_password,
            updateUserPasswordDto.old_password,
          ),
        ).pipe(
          first(),
          switchMap((isValid) => {
            if (isValid) {
              return this.usersService
                .hashPassword(updateUserPasswordDto.new_password)
                .pipe(
                  switchMap((hashedPassword) => {
                    return from(
                      this.connection.manager.update(
                        UserEntity,
                        { id: user.id },
                        {
                          hashed_password: hashedPassword,
                        },
                      ),
                    ).pipe(
                      switchMap(() =>
                        from(
                          this.connection.manager.findOne(UserEntity, user.id),
                        ),
                      ),
                    );
                  }),
                );
            } else {
              return of(undefined);
            }
          }),
        );
      }),
    );
  }
}
