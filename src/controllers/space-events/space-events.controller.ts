import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { map, Observable, switchMap } from 'rxjs';
import { SpaceEventsService } from '../../services/space-events.service';
import { UserTokenGuard } from '../../guards/user-token-guard';
import { CreateSpaceEventDto } from './create-space-event-dto';
import { LoginTokensService } from '../../services/login-tokens.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('space-events')
export class SpaceEventsController {
  constructor(
    private spaceEventsService: SpaceEventsService,
    private loginTokensService: LoginTokensService,
  ) {}

  @Get('latest')
  // Events that have not yet past
  getRecentUpcoming(): Observable<object> {
    return this.spaceEventsService.getLatestValidEvents();
  }

  @Get(':id')
  getSpecificSpaceEvent(@Param() params): Observable<object> {
    return this.spaceEventsService.getSpecificSpaceEventById(params.id).pipe(
      map((spaceEvent) => {
        if (spaceEvent) {
          return spaceEvent;
        }
        throw new HttpException(
          'Space event with such an ID could not be found.',
          HttpStatus.NOT_FOUND,
        );
      }),
    );
  }

  @HttpCode(201)
  @UseGuards(UserTokenGuard)
  @Post()
  createSpaceEvent(
    @Headers('authorization') authorizationToken: string,
    @Body() createSpaceEventDto: CreateSpaceEventDto,
  ): Observable<object> {
    return this.spaceEventsService
      .checkForEventConflict(
        createSpaceEventDto.event_start_date,
        createSpaceEventDto.event_end_date,
      )
      .pipe(
        switchMap((result) => {
          if (result) {
            throw new HttpException(
              'Conflict with an existing space event.',
              HttpStatus.UNPROCESSABLE_ENTITY,
            );
          } else {
            return this.loginTokensService
              .getUserFromToken(authorizationToken)
              .pipe(
                switchMap((user) => {
                  return this.spaceEventsService.createSpaceEvent(
                    createSpaceEventDto,
                    user,
                  );
                }),
              );
          }
        }),
      );
  }

  @HttpCode(201)
  @UseGuards(UserTokenGuard)
  @UseInterceptors(FileInterceptor('photo'))
  @Post('with-photo')
  createSpaceEventWithPhoto(
    @Headers('authorization') authorizationToken: string,
    @UploadedFile() photo: Express.Multer.File,
    @Body() createSpaceEventDto: CreateSpaceEventDto,
  ): Observable<object> {
    return this.spaceEventsService
      .checkForEventConflict(
        createSpaceEventDto.event_start_date,
        createSpaceEventDto.event_end_date,
      )
      .pipe(
        switchMap((result) => {
          if (result) {
            throw new HttpException(
              'Conflict with an existing space event.',
              HttpStatus.UNPROCESSABLE_ENTITY,
            );
          } else {
            return this.loginTokensService
              .getUserFromToken(authorizationToken)
              .pipe(
                switchMap((user) => {
                  return this.spaceEventsService.createSpaceEventWithPhoto(
                    createSpaceEventDto,
                    user,
                    photo,
                  );
                }),
              );
          }
        }),
      );
  }
}
