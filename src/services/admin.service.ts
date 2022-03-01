import {Injectable} from "@nestjs/common";
import {UsersService} from "./users.service";
import {LoginTokensService} from "./login-tokens.service";
import {UserEntity} from "../entities/user.entity";
import {Observable, switchMap} from "rxjs";

@Injectable()
export class AdminService {
    constructor(private usersService: UsersService, private loginTokensService: LoginTokensService) {
    }

    public banUser(user: UserEntity): Observable<UserEntity> {
        return this.loginTokensService.invalidateAllLoginTokensOfUser(user).pipe(switchMap(_ => this.usersService.setUserToBanned(user).pipe(switchMap(_ => this.usersService.getUserById(user.id)))));
    }
}
