import {Body, Controller, Post} from "@nestjs/common";
import {RegisterUserDto} from "./register-user-dto";
import {Observable} from "rxjs";
import {UsersService} from "../../services/users-service";

@Controller('user-registration')
export class RegistrationController {
    constructor(private readonly usersService: UsersService) {
    }

    @Post()
    postUserRegistration(@Body() registerUserDto: RegisterUserDto): Observable<object> {
        return this.usersService.registerUser(registerUserDto);
    }
}
