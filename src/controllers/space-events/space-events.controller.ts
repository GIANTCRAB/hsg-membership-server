import {
    Controller,
    Get
} from "@nestjs/common";
import {Observable} from "rxjs";
import {SpaceEventsService} from "../../services/space-events.service";

@Controller('space-events')
export class SpaceEventsController {
    constructor(private spaceEventsService: SpaceEventsService) {

    }

    @Get('latest')
    // Events that have not yet past
    getRecentUpcoming(): Observable<object> {
        return this.spaceEventsService.getLatestValidEvents();
    }
}
