import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  UnprocessableEntityException,
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
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { GetPageDto } from '../../shared-dto/get-page.dto';

@Controller('api/space-events')
export class SpaceEventsController {
  constructor(
    private spaceEventsService: SpaceEventsService,
    private loginTokensService: LoginTokensService,
  ) {}

  @Get('latest')
  // Events that have not yet past, limit of 5
  getRecentUpcoming(): Observable<object> {
    return this.spaceEventsService.getLatestValidEvents();
  }

  @Get('upcoming')
  @HttpCode(200)
  getPaginatedUpcoming(@Body() getPageDto: GetPageDto): Observable<object> {
    return this.spaceEventsService.getValidUpcomingEventsAndCount(
      getPageDto.page,
    );
  }

  @Get('need-host')
  @HttpCode(200)
  getAwaitingApproval(@Body() getPageDto: GetPageDto): Observable<object> {
    return this.spaceEventsService.getNeedApprovalEvents(getPageDto.page);
  }

  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        photo: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
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
            throw new UnprocessableEntityException([
              'Conflict with an existing space event.',
            ]);
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
        throw new NotFoundException([
          'Space event with such an ID could not be found.',
        ]);
      }),
    );
  }

  @ApiBearerAuth()
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
                  throw new UnprocessableEntityException([
                    'Conflict with an existing space event.',
                  ]);
                }),
              );
          }
          throw new BadRequestException([
            'Space event is already approved and hosted by a member.',
          ]);
        }
        throw new NotFoundException([
          'Space event with such an ID could not be found.',
        ]);
      }),
    );
  }

  @ApiBearerAuth()
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
                          throw new UnprocessableEntityException([
                            'Conflict with an existing space event.',
                          ]);
                        } else {
                          return this.spaceEventsService.updateSpaceEvent(
                            updateSpaceEventDto,
                            spaceEvent,
                          );
                        }
                      }),
                    );
                }
                throw new ForbiddenException([
                  'You are not the organizer of the event.',
                ]);
              }),
            );
        }
        throw new NotFoundException([
          'Space event with such an ID could not be found.',
        ]);
      }),
    );
  }

  @ApiBearerAuth()
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
            throw new UnprocessableEntityException([
              'Conflict with an existing space event.',
            ]);
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

  @Get()
  @HttpCode(200)
  getPaginated(@Body() getPageDto: GetPageDto): Observable<object> {
    return this.spaceEventsService.getValidEventsAndCount(getPageDto.page);
  }
}
