import {IsEmail, IsNotEmpty} from "class-validator";

export class RegisterUserDto {
    @IsEmail()
    email: string;

    @IsNotEmpty()
    firstName: string;

    @IsNotEmpty()
    lastName: string;

    @IsNotEmpty()
    password: string;
}
