import {Injectable} from "@nestjs/common";
import {Between, Connection, MoreThan} from "typeorm";
import {from, map, Observable} from "rxjs";
import {SpaceEventEntity} from "../entities/space-event.entity";
import {CreateSpaceEventDto} from "../controllers/space-events/create-space-event-dto";
import {UserEntity} from "../entities/user.entity";

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

    public createSpaceEvent(createSpaceEventDto: CreateSpaceEventDto): Observable<SpaceEventEntity> {
        return from(this.connection.manager.save(new SpaceEventEntity({
            event_start_date: createSpaceEventDto.event_start_date,
            event_end_date: createSpaceEventDto.event_end_date,
            title: createSpaceEventDto.title,
            description: createSpaceEventDto.description,
            organizer: createSpaceEventDto.organizer,
        })));
    }

    public checkForEventConflict(start_date: Date, end_date: Date): Observable<boolean> {
        return from(this.connection.manager.count(SpaceEventEntity, {
            where: [
                {
                    event_start_date: Between(start_date, end_date),
                },
                {
                    event_end_date: Between(start_date, end_date),
                },
            ],
        })).pipe(map(results => results !== 0));
    }
}
