import { Injectable } from '@nestjs/common';
import { Between, Connection, LessThan, MoreThan, Not } from 'typeorm';
import { from, map, Observable, switchMap } from 'rxjs';
import { SpaceEventEntity } from '../entities/space-event.entity';
import { CreateSpaceEventDto } from '../controllers/space-events/create-space-event-dto';
import { UserEntity } from '../entities/user.entity';
import moment from 'moment';
import { UpdateSpaceEventDto } from '../controllers/space-events/update-space-event-dto';
import { UpdateSpaceEventDtoToEntity } from '../controllers/space-events/update-space-event-dto-to-entity';
import { PhotoUploadsService } from './photo-uploads.service';
import { ListDataDto } from '../shared-dto/list-data.dto';
import { DataMapperHelper } from '../shared-helpers/data-mapper.helper';

@Injectable()
export class SpaceEventsService {
  constructor(
    private readonly connection: Connection,
    private readonly photoUploadsService: PhotoUploadsService,
  ) {}

  // Limit of 5
  public getLatestValidEvents(): Observable<SpaceEventEntity[]> {
    return from(
      this.connection.manager.find(SpaceEventEntity, {
        where: {
          is_valid: true,
          is_approved: true,
          event_start_date: MoreThan(new Date().toISOString()),
        },
        take: 5,
        order: {
          event_start_date: 'ASC',
        },
      }),
    );
  }

  public getValidUpcomingEventsAndCount(
    page: number = 1,
  ): Observable<ListDataDto<SpaceEventEntity>> {
    const databaseIndex = page - 1;
    const toTake = DataMapperHelper.defaultToTake;
    const toSkip = toTake * databaseIndex;
    return from(
      this.connection.manager.findAndCount(SpaceEventEntity, {
        where: {
          is_valid: true,
          is_approved: true,
          event_start_date: MoreThan(new Date().toISOString()),
        },
        skip: toSkip,
        take: toTake,
        order: {
          event_start_date: 'ASC',
        },
      }),
    ).pipe(
      map((result) =>
        DataMapperHelper.mapArrayToListDataDto<SpaceEventEntity>(page, result),
      ),
    );
  }

  public getValidEventsAndCount(
    page: number = 1,
  ): Observable<ListDataDto<SpaceEventEntity>> {
    const databaseIndex = page - 1;
    const toTake = DataMapperHelper.defaultToTake;
    const toSkip = toTake * databaseIndex;
    return from(
      this.connection.manager.findAndCount(SpaceEventEntity, {
        where: {
          is_valid: true,
        },
        skip: toSkip,
        take: toTake,
        order: {
          event_start_date: 'ASC',
        },
      }),
    ).pipe(
      map((result) =>
        DataMapperHelper.mapArrayToListDataDto<SpaceEventEntity>(page, result),
      ),
    );
  }

  public getNeedApprovalEvents(
    page: number = 1,
  ): Observable<ListDataDto<SpaceEventEntity>> {
    const databaseIndex = page - 1;
    const toTake = DataMapperHelper.defaultToTake;
    const toSkip = toTake * databaseIndex;
    return from(
      this.connection.manager.findAndCount(SpaceEventEntity, {
        where: {
          is_valid: true,
          is_approved: false,
          event_start_date: MoreThan(new Date().toISOString()),
        },
        skip: toSkip,
        take: toTake,
        order: {
          event_start_date: 'ASC',
        },
      }),
    ).pipe(
      map((result) =>
        DataMapperHelper.mapArrayToListDataDto<SpaceEventEntity>(page, result),
      ),
    );
  }

  public getSpecificSpaceEventById(
    spaceEventId: string,
  ): Observable<SpaceEventEntity> {
    return from(
      this.connection.manager.findOne(SpaceEventEntity, spaceEventId, {
        relations: ['organizer', 'photo', 'host'],
      }),
    );
  }

  public createSpaceEvent(
    createSpaceEventDto: CreateSpaceEventDto,
    organizer: UserEntity,
  ): Observable<SpaceEventEntity> {
    const spaceEventEntity = new SpaceEventEntity({
      event_start_date: moment(createSpaceEventDto.event_start_date)
        .utc()
        .toDate(),
      event_end_date: moment(createSpaceEventDto.event_end_date).utc().toDate(),
      title: createSpaceEventDto.title,
      description: createSpaceEventDto.description,
      organizer: organizer,
    });

    // If the organizer is a member, the event is automatically approved and the host will be the organizer
    if (organizer.is_member) {
      spaceEventEntity.is_approved = true;
      spaceEventEntity.host = organizer;
    }

    return from(this.connection.manager.save(spaceEventEntity));
  }

  public createSpaceEventWithPhoto(
    createSpaceEventDto: CreateSpaceEventDto,
    organizer: UserEntity,
    photo: Express.Multer.File,
  ): Observable<SpaceEventEntity> {
    return from(
      this.connection.transaction(async (transactionalEntityManager) => {
        const savedPhotoEntity =
          await this.photoUploadsService.uploadPhotoUsingTransaction(
            transactionalEntityManager,
            photo,
            createSpaceEventDto.title,
            organizer,
          );

        const spaceEventEntity = new SpaceEventEntity({
          event_start_date: moment(createSpaceEventDto.event_start_date)
            .utc()
            .toDate(),
          event_end_date: moment(createSpaceEventDto.event_end_date)
            .utc()
            .toDate(),
          title: createSpaceEventDto.title,
          description: createSpaceEventDto.description,
          organizer: organizer,
          photo: savedPhotoEntity,
        });

        // If the organizer is a member, the event is automatically approved and the host will be the organizer
        if (organizer.is_member) {
          spaceEventEntity.is_approved = true;
          spaceEventEntity.host = organizer;
        }

        return await transactionalEntityManager.save(spaceEventEntity);
      }),
    );
  }

  public updateSpaceEvent(
    updateSpaceEventDto: UpdateSpaceEventDto,
    spaceEvent: SpaceEventEntity,
  ): Observable<SpaceEventEntity> {
    return from(
      this.connection.manager.update(
        SpaceEventEntity,
        { id: spaceEvent.id },
        UpdateSpaceEventDtoToEntity.toEntity(updateSpaceEventDto),
      ),
    ).pipe(switchMap(() => this.getSpecificSpaceEventById(spaceEvent.id)));
  }

  public checkForEventConflict(
    start_date: string,
    end_date: string,
  ): Observable<boolean> {
    const event_start_date = moment(start_date).utc().toDate();
    const event_end_date = moment(end_date).utc().toDate();
    return from(
      this.connection.manager.count(SpaceEventEntity, {
        where: [
          {
            event_start_date: Between(event_start_date, event_end_date),
            is_valid: true,
            is_approved: true,
          },
          {
            event_end_date: Between(event_start_date, event_end_date),
            is_valid: true,
            is_approved: true,
          },
          {
            event_start_date: MoreThan(event_start_date),
            event_end_date: LessThan(event_start_date),
            is_valid: true,
            is_approved: true,
          },
          {
            event_start_date: LessThan(event_end_date),
            event_end_date: MoreThan(event_end_date),
            is_valid: true,
            is_approved: true,
          },
        ],
      }),
    ).pipe(map((results) => results !== 0));
  }

  public checkForEventConflictAndExcludeCertainEvent(
    start_date: string,
    end_date: string,
    space_event: SpaceEventEntity,
  ): Observable<boolean> {
    const event_start_date = start_date
      ? moment(start_date).utc().toDate()
      : space_event.event_start_date;
    const event_end_date = end_date
      ? moment(end_date).utc().toDate()
      : space_event.event_end_date;
    return from(
      this.connection.manager.count(SpaceEventEntity, {
        where: [
          {
            event_start_date: Between(event_start_date, event_end_date),
            id: Not(space_event.id),
            is_valid: true,
            is_approved: true,
          },
          {
            event_end_date: Between(event_start_date, event_end_date),
            id: Not(space_event.id),
            is_valid: true,
            is_approved: true,
          },
          {
            event_start_date: MoreThan(event_start_date),
            event_end_date: LessThan(event_start_date),
            id: Not(space_event.id),
            is_valid: true,
            is_approved: true,
          },
          {
            event_start_date: LessThan(event_end_date),
            event_end_date: MoreThan(event_end_date),
            id: Not(space_event.id),
            is_valid: true,
            is_approved: true,
          },
        ],
      }),
    ).pipe(map((results) => results !== 0));
  }

  public invalidateAllSpaceEventsOfUser(user: UserEntity) {
    return from(
      this.connection.manager.update(
        SpaceEventEntity,
        { organizer: user },
        { is_valid: false },
      ),
    );
  }

  public hostSpaceEvent(
    spaceEvent: SpaceEventEntity,
    host: UserEntity,
  ): Observable<SpaceEventEntity> {
    return from(
      this.connection.manager.update(
        SpaceEventEntity,
        { id: spaceEvent.id },
        {
          is_approved: true,
          host: host,
        },
      ),
    ).pipe(switchMap(() => this.getSpecificSpaceEventById(spaceEvent.id)));
  }
}
