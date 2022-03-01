import {Body, Controller, HttpCode, HttpException, HttpStatus, Post} from "@nestjs/common";
import {RegisterUserDto} from "./register-user-dto";
import {Observable, switchMap} from "rxjs";
import {UsersService} from "../../services/users.service";

@Controller('user-registration')
export class RegistrationController {
    constructor(private readonly usersService: UsersService) {
    }

    @Post()
    @HttpCode(201)
    postUserRegistration(@Body() registerUserDto: RegisterUserDto): Observable<object> {
        return this.usersService.getUserByEmail(registerUserDto.email).pipe(switchMap(result => {
            if (result !== undefined) {
                throw new HttpException('Account with this email address already exists.', HttpStatus.UNPROCESSABLE_ENTITY);
            } else {
                return this.usersService.registerUser(registerUserDto);
            }
        }));
    }
}
