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
import { UpdateSpaceEventDto } from './update-space-event-dto';
import { MemberTokenGuard } from '../../guards/member-token-guard';

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

  @HttpCode(200)
  @UseGuards(MemberTokenGuard)
  @Post(':id/host-as-member')
  hostSpaceEvent(
    @Headers('authorization') authorizationToken: string,
    @Param() params,
  ): Observable<object> {
    return this.spaceEventsService.getSpecificSpaceEventById(params.id).pipe(
      switchMap((spaceEvent) => {
        if (spaceEvent) {
          if (!spaceEvent.is_approved) {
            return this.spaceEventsService
              .checkForEventConflict(
                spaceEvent.event_start_date.toISOString(),
                spaceEvent.event_end_date.toISOString(),
              )
              .pipe(
                switchMap((hasConflict) => {
                  if (!hasConflict) {
                    return this.loginTokensService
                      .getUserFromToken(authorizationToken)
                      .pipe(
                        switchMap((member) =>
                          this.spaceEventsService.hostSpaceEvent(
                            spaceEvent,
                            member,
                          ),
                        ),
                      );
                  }
                  throw new HttpException(
                    'Conflict with an existing space event.',
                    HttpStatus.UNPROCESSABLE_ENTITY,
                  );
                }),
              );
          }
          throw new HttpException(
            'Space event is already approved and hosted by a member.',
            HttpStatus.BAD_REQUEST,
          );
        }
        throw new HttpException(
          'Space event with such an ID could not be found.',
          HttpStatus.NOT_FOUND,
        );
      }),
    );
  }

  @HttpCode(200)
  @UseGuards(UserTokenGuard)
  @Post(':id')
  updateSpaceEvent(
    @Headers('authorization') authorizationToken: string,
    @Param() params,
    @Body() updateSpaceEventDto: UpdateSpaceEventDto,
  ): Observable<object> {
    return this.spaceEventsService.getSpecificSpaceEventById(params.id).pipe(
      switchMap((spaceEvent) => {
        if (spaceEvent) {
          return this.loginTokensService
            .getUserFromToken(authorizationToken)
            .pipe(
              switchMap((user) => {
                if (user.id === spaceEvent.organizer.id) {
                  return this.spaceEventsService
                    .checkForEventConflictAndExcludeCertainEvent(
                      updateSpaceEventDto.event_start_date,
                      updateSpaceEventDto.event_end_date,
                      spaceEvent,
                    )
                    .pipe(
                      switchMap((result) => {
                        if (result) {
                          throw new HttpException(
                            'Conflict with an existing space event.',
                            HttpStatus.UNPROCESSABLE_ENTITY,
                          );
                        } else {
                          return this.spaceEventsService.updateSpaceEvent(
                            updateSpaceEventDto,
                            spaceEvent,
                          );
                        }
                      }),
                    );
                }
                throw new HttpException(
                  'You are not the organizer of the event.',
                  HttpStatus.FORBIDDEN,
                );
              }),
            );
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
    @Headers('authorization')
    authorizationToken: string,
    @Body()
    createSpaceEventDto: CreateSpaceEventDto,
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
}
