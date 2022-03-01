import {IsDate, IsNotEmpty} from "class-validator";
import {UserEntity} from "../../entities/user.entity";

export class CreateSpaceEventDto {
    @IsNotEmpty()
    title: string;

    @IsNotEmpty()
    description: string;

    @IsDate()
    @IsNotEmpty()
    event_start_date: Date;

    @IsDate()
    @IsNotEmpty()
    event_end_date: Date;

    @IsNotEmpty()
    organizer: UserEntity;
}
