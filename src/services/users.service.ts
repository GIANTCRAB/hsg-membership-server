import { Injectable } from '@nestjs/common';
import { RegisterUserDto } from '../controllers/registration/register-user-dto';
import { UserEntity } from '../entities/user.entity';
import { Connection } from 'typeorm';
import { first, from, Observable, of, switchMap } from 'rxjs';
import argon2 from 'argon2';
import { LoginUserDto } from '../controllers/login/login-user-dto';

@Injectable()
export class UsersService {
  constructor(private readonly connection: Connection) {}

  public registerUser(
    registerUserDto: RegisterUserDto,
  ): Observable<UserEntity> {
    // kibibyte as memory cost
    return this.hashPassword(registerUserDto.password).pipe(
      switchMap((hashedPassword) => {
        return this.createUser({
          email: registerUserDto.email,
          first_name: registerUserDto.first_name,
          last_name: registerUserDto.last_name,
          hashed_password: hashedPassword,
        });
      }),
    );
  }

  public createUser(userData: Partial<UserEntity>): Observable<UserEntity> {
    return from(this.connection.manager.save(new UserEntity(userData)));
  }

  public hashPassword(givenPassword: string): Observable<string> {
    return from(
      argon2.hash(givenPassword, {
        type: argon2.argon2id,
        memoryCost: 15360,
        parallelism: 1,
        timeCost: 2,
      }),
    );
  }

  public getUserById(userId: string): Observable<UserEntity | undefined> {
    return from(
      this.connection.manager.findOne(UserEntity, {
        where: {
          id: userId,
        },
      }),
    );
  }

  public getFullDisplayUserById(
    userId: string,
  ): Observable<UserEntity | undefined> {
    return from(
      this.connection.manager.findOne(UserEntity, {
        where: {
          id: userId,
        },
        select: [
          'id',
          'first_name',
          'last_name',
          'email',
          'is_admin',
          'is_verified',
          'is_member',
          'is_banned',
          'created_at',
          'updated_at',
        ],
      }),
    );
  }

  public getUserByEmail(email: string): Observable<UserEntity | undefined> {
    return from(
      this.connection.manager.findOne(UserEntity, {
        where: {
          email: email,
        },
        select: ['id', 'email'],
      }),
    );
  }

  public setUserToBanned(user: UserEntity) {
    return from(
      this.connection.manager.update(
        UserEntity,
        { id: user.id },
        { is_banned: true },
      ),
    );
  }

  public setUserMemberState(user: UserEntity, toMember: boolean) {
    return from(
      this.connection.manager.update(
        UserEntity,
        { id: user.id },
        { is_member: toMember },
      ),
    );
  }

  public loginUser(loginUserDto: LoginUserDto): Observable<UserEntity | null> {
    return from(
      this.connection.manager.findOne(UserEntity, {
        where: {
          email: loginUserDto.email,
          is_banned: false,
          is_verified: true,
        },
        select: ['id', 'email', 'hashed_password'],
      }),
    ).pipe(
      first(),
      switchMap((user) => {
        if (user !== undefined) {
          return from(
            argon2.verify(user.hashed_password, loginUserDto.password),
          ).pipe(
            first(),
            switchMap((isValid) => {
              if (isValid) {
                return this.getUserById(user.id);
              }
              return of(null);
            }),
          );
        }
        return of(null);
      }),
    );
  }
}
