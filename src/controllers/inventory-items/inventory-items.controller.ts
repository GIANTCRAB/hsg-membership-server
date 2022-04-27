import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { map, Observable, switchMap } from 'rxjs';
import { CreateInventoryItemDto } from './create-inventory-item-dto';
import { InventoryItemsService } from '../../services/inventory-items.service';
import { AdminTokenGuard } from '../../guards/admin-token-guard';
import { LoginTokensService } from '../../services/login-tokens.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth } from '@nestjs/swagger';
import { GetPageDto } from '../../shared-dto/get-page.dto';
import { DataMapperHelper } from '../../shared-helpers/data-mapper.helper';

@Controller('inventory-items')
export class InventoryItemsController {
  constructor(
    private readonly inventoryItemsService: InventoryItemsService,
    private readonly loginTokensService: LoginTokensService,
  ) {}

  @Get(':id')
  @HttpCode(200)
  getInventoryById(@Param() params): Observable<object> {
    return this.inventoryItemsService
      .getInventoryItemById(params.id)
      .pipe(
        map((inventoryItem) =>
          DataMapperHelper.checkEntityAndReturnStatus(inventoryItem),
        ),
      );
  }

  @Get()
  @HttpCode(200)
  getInventoryCategories(@Body() getPageDto: GetPageDto): Observable<object> {
    return this.inventoryItemsService.getInventoryItemsAndCount(
      getPageDto.page,
    );
  }

  @ApiBearerAuth()
  @Post('with-photo')
  @HttpCode(201)
  @UseGuards(AdminTokenGuard)
  @UseInterceptors(FileInterceptor('photo'))
  postInventoryItemWithPhoto(
    @Headers('authorization') authorizationToken: string,
    @UploadedFile() photo: Express.Multer.File,
    @Body() createInventoryItemDto: CreateInventoryItemDto,
  ): Observable<object> {
    return this.loginTokensService
      .getUserFromToken(authorizationToken)
      .pipe(
        switchMap((user) =>
          this.inventoryItemsService.addInventoryItem(
            createInventoryItemDto,
            user,
            photo,
          ),
        ),
      );
  }

  @ApiBearerAuth()
  @Post()
  @HttpCode(201)
  @UseGuards(AdminTokenGuard)
  postInventoryItem(
    @Headers('authorization') authorizationToken: string,
    @Body() createInventoryItemDto: CreateInventoryItemDto,
  ): Observable<object> {
    return this.loginTokensService
      .getUserFromToken(authorizationToken)
      .pipe(
        switchMap((user) =>
          this.inventoryItemsService.addInventoryItem(
            createInventoryItemDto,
            user,
          ),
        ),
      );
  }
}
