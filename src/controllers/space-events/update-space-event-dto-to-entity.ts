import { SpaceEventEntity } from '../../entities/space-event.entity';
import { UpdateSpaceEventDto } from './update-space-event-dto';
import moment from 'moment';

export class UpdateSpaceEventDtoToEntity {
  public static toEntity(
    updateSpaceEventDto: UpdateSpaceEventDto,
  ): Partial<SpaceEventEntity> {
    const newSpaceEventDetails: Partial<SpaceEventEntity> = {};
    for (const updateSpaceEventDtoKey in updateSpaceEventDto) {
      if (updateSpaceEventDto[updateSpaceEventDtoKey] !== undefined) {
        if (
          updateSpaceEventDtoKey === 'event_start_date' ||
          updateSpaceEventDtoKey === 'event_end_date'
        ) {
          newSpaceEventDetails[updateSpaceEventDtoKey] = moment(
            updateSpaceEventDto[updateSpaceEventDtoKey],
          )
            .utc()
            .toDate();
        } else {
          newSpaceEventDetails[updateSpaceEventDtoKey] =
            updateSpaceEventDto[updateSpaceEventDtoKey];
        }
      }
    }

    return newSpaceEventDetails;
  }
}
