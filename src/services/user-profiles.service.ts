import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';
import { first, from, map, Observable, of, switchMap } from 'rxjs';
import { UserEntity } from '../entities/user.entity';
import { UpdateUserProfileDto } from '../controllers/user-profiles/update-user-profile-dto';
import { UpdateUserPasswordDto } from '../controllers/user-profiles/update-user-password-dto';
import argon2 from 'argon2';
import { UsersService } from './users.service';
import { LoginTokensService } from './login-tokens.service';
import { ListDataDto } from '../shared-dto/list-data.dto';
import { DataMapperHelper } from '../shared-helpers/data-mapper.helper';

@Injectable()
export class UserProfilesService {
  constructor(
    private readonly connection: Connection,
    private readonly usersService: UsersService,
    private readonly loginTokensService: LoginTokensService,
  ) {}

  public getPublicUserProfilesAndCount(
    page: number = 1,
  ): Observable<ListDataDto<UserEntity>> {
    const databaseIndex = page - 1;
    const toTake = DataMapperHelper.defaultToTake;
    const toSkip = toTake * databaseIndex;
    return from(
      this.connection.manager.findAndCount(UserEntity, {
        skip: toSkip,
        take: toTake,
        where: {
          is_public: true,
        },
      }),
    ).pipe(
      map((result) =>
        DataMapperHelper.mapArrayToListDataDto<UserEntity>(page, result),
      ),
    );
  }

  public getUserProfileById(userId: string): Observable<UserEntity> {
    return this.usersService.getPublicUserById(userId);
  }

  public getFullUserProfile(user: UserEntity): Observable<UserEntity> {
    return this.usersService.getFullDisplayUserById(user.id);
  }

  public updateUserProfile(
    updateUserProfileDto: UpdateUserProfileDto,
    user: UserEntity,
  ): Observable<UserEntity> {
    const newUserContent: Partial<UserEntity> = {};
    for (let updateUserProfileDtoKey in updateUserProfileDto) {
      if (
        updateUserProfileDto[updateUserProfileDtoKey] &&
        updateUserProfileDto[updateUserProfileDtoKey] !== undefined
      ) {
        newUserContent[updateUserProfileDtoKey] =
          updateUserProfileDto[updateUserProfileDtoKey];
      }
    }
    return from(
      this.connection.manager.update(
        UserEntity,
        { id: user.id },
        newUserContent,
      ),
    ).pipe(switchMap(() => this.getFullUserProfile(user)));
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
                      this.connection.transaction(
                        async (transactionalEntityManager) => {
                          await transactionalEntityManager.update(
                            UserEntity,
                            { id: user.id },
                            {
                              hashed_password: hashedPassword,
                            },
                          );
                          await this.loginTokensService.invalidateAllLoginTokensOfUserUsingTransaction(
                            transactionalEntityManager,
                            user,
                          );
                        },
                      ),
                    ).pipe(switchMap(() => this.getFullUserProfile(user)));
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
