import { IsDefined, IsISO8601, IsNotEmpty } from 'class-validator';
import { IsLongerThan } from '../../validators/is-longer-than';
import { IsOneHourAfter } from '../../validators/is-one-hour-after';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSpaceEventDto {
  @ApiProperty()
  @IsDefined()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsDefined()
  @IsNotEmpty()
  description: string;

  @ApiProperty()
  @IsISO8601()
  @IsDefined()
  @IsNotEmpty()
  @IsOneHourAfter({
    message: 'Start date must be at least one hour after current time.',
  })
  event_start_date: string;

  @ApiProperty()
  @IsISO8601()
  @IsDefined()
  @IsNotEmpty()
  @IsLongerThan('event_start_date', {
    message: 'End date must be after start date.',
  })
  event_end_date: string;
}
