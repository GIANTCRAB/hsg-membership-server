import {IsDefined, IsNotEmpty, IsUUID} from "class-validator";

export class VerifyEmailDto {
    @IsDefined()
    @IsNotEmpty()
    @IsUUID()
    id: string;

    @IsDefined()
    @IsNotEmpty()
    code: string;
}
