import { Injectable } from '@nestjs/common';
import { UsersService } from './users.service';
import { LoginTokensService } from './login-tokens.service';
import { UserEntity } from '../entities/user.entity';
import { Observable, switchMap } from 'rxjs';
import { SpaceEventsService } from './space-events.service';

@Injectable()
export class AdminService {
  constructor(
    private usersService: UsersService,
    private loginTokensService: LoginTokensService,
    private spaceEventsService: SpaceEventsService,
  ) {}

  public banUser(user: UserEntity): Observable<UserEntity> {
    return this.loginTokensService
      .invalidateAllLoginTokensOfUser(user)
      .pipe(
        switchMap((_) =>
          this.spaceEventsService
            .invalidateAllSpaceEventsOfUser(user)
            .pipe(
              switchMap((_) =>
                this.usersService
                  .setUserToBanned(user)
                  .pipe(
                    switchMap((_) => this.usersService.getUserById(user.id)),
                  ),
              ),
            ),
        ),
      );
  }

  public addMembershipToUser(user: UserEntity): Observable<UserEntity> {
    return this.usersService
      .setUserMemberState(user, true)
      .pipe(switchMap((_) => this.usersService.getUserById(user.id)));
  }

  public removeMembershipFromUser(user: UserEntity): Observable<UserEntity> {
    return this.usersService
      .setUserMemberState(user, false)
      .pipe(switchMap((_) => this.usersService.getUserById(user.id)));
  }
}
