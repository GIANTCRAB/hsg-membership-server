import { IsISO8601, IsOptional } from 'class-validator';
import { IsLongerThan } from '../../validators/is-longer-than';
import { IsOneHourAfter } from '../../validators/is-one-hour-after';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSpaceEventDto {
  @ApiPropertyOptional()
  @IsOptional()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  @IsOneHourAfter({
    message: 'Start date must be at least one hour after current time.',
  })
  event_start_date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  @IsLongerThan('event_start_date', {
    message: 'End date must be after start date.',
  })
  event_end_date: string;
}
