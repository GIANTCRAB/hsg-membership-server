import {Injectable} from "@nestjs/common";
import {Connection, MoreThan} from "typeorm";
import {from, Observable} from "rxjs";
import {SpaceEventEntity} from "../entities/space-event.entity";

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
}
