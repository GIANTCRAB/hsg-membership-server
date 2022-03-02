import {Injectable} from "@nestjs/common";
import {Between, Connection, LessThan, MoreThan} from "typeorm";
import {from, map, Observable} from "rxjs";
import {SpaceEventEntity} from "../entities/space-event.entity";
import {CreateSpaceEventDto} from "../controllers/space-events/create-space-event-dto";
import {UserEntity} from "../entities/user.entity";
import moment from "moment";

@Injectable()
export class SpaceEventsService {
    constructor(private readonly connection: Connection) {
    }

    // Limit of 5
    public getLatestValidEvents(): Observable<SpaceEventEntity[]> {
        return from(this.connection.manager.find(SpaceEventEntity, {
            where: {
                is_valid: true,
                event_start_date: MoreThan((new Date()).toISOString())
            },
            take: 5,
            order: {
                event_start_date: "ASC"
            }
        }));
    }

    public getSpecificSpaceEventById(spaceEventId: string): Observable<SpaceEventEntity> {
        return from(this.connection.manager.findOne(SpaceEventEntity, spaceEventId, {
            relations: ['organizer'],
        }));
    }

    public createSpaceEvent(createSpaceEventDto: CreateSpaceEventDto, organizer: UserEntity): Observable<SpaceEventEntity> {
        return from(this.connection.manager.save(new SpaceEventEntity({
            event_start_date: moment(createSpaceEventDto.event_start_date).utc().toDate(),
            event_end_date: moment(createSpaceEventDto.event_end_date).utc().toDate(),
            title: createSpaceEventDto.title,
            description: createSpaceEventDto.description,
            organizer: organizer,
        })));
    }

    public checkForEventConflict(start_date: string, end_date: string): Observable<boolean> {
        const event_start_date = moment(start_date).utc().toDate();
        const event_end_date = moment(end_date).utc().toDate();
        return from(this.connection.manager.count(SpaceEventEntity, {
            where: [
                {
                    event_start_date: Between(event_start_date, event_end_date),
                },
                {
                    event_end_date: Between(event_start_date, event_end_date),
                },
                {
                    event_start_date: MoreThan(event_start_date),
                    event_end_date: LessThan(event_start_date),
                },

                {
                    event_start_date: LessThan(event_end_date),
                    event_end_date: MoreThan(event_end_date),
                }
            ],
        })).pipe(map(results => results !== 0));
    }

    public invalidateAllSpaceEventsOfUser(user: UserEntity) {
        return from(this.connection.manager.update(SpaceEventEntity, {organizer: user}, {is_valid: false}));
    }
}
