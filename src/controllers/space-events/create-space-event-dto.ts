import {IsDate, IsNotEmpty, MinDate} from "class-validator";
import {UserEntity} from "../../entities/user.entity";
import {IsLongerThan} from "../../validators/is-longer-than";

export class CreateSpaceEventDto {
    @IsNotEmpty()
    title: string;

    @IsNotEmpty()
    description: string;

    @IsDate()
    @IsNotEmpty()
    @MinDate(new Date())
    event_start_date: Date;

    @IsDate()
    @IsNotEmpty()
    @IsLongerThan('event_start_date', {message: 'End date must be after start date.'})
    event_end_date: Date;

    @IsNotEmpty()
    organizer: UserEntity;
}
