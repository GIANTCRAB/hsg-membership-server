import {IsDefined, IsISO8601, IsNotEmpty} from "class-validator";
import {IsLongerThan} from "../../validators/is-longer-than";
import {IsOneHourAfter} from "../../validators/is-one-hour-after";

export class CreateSpaceEventDto {
    @IsDefined()
    @IsNotEmpty()
    title: string;

    @IsDefined()
    @IsNotEmpty()
    description: string;

    @IsISO8601()
    @IsDefined()
    @IsNotEmpty()
    @IsOneHourAfter({message: 'Start date must be at least one hour after current time.'})
    event_start_date: string;

    @IsISO8601()
    @IsDefined()
    @IsNotEmpty()
    @IsLongerThan('event_start_date', {message: 'End date must be after start date.'})
    event_end_date: string;
}
