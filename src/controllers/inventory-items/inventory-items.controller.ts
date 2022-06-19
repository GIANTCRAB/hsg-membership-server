import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
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
import { UpdateInventoryItemDto } from './update-inventory-item-dto';
import { InventoryItemEntity } from '../../entities/inventory-item.entity';
import { SearchInventoryItemDto } from './search-inventory-item-dto';

@Controller('api/inventory-items')
export class InventoryItemsController {
  constructor(
    private readonly inventoryItemsService: InventoryItemsService,
    private readonly loginTokensService: LoginTokensService,
  ) {}

  @ApiBearerAuth()
  @Post('with-photo')
  @HttpCode(HttpStatus.CREATED)
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

  @Post('search')
  @HttpCode(HttpStatus.OK)
  searchInventoryItems(
    @Body() searchInventoryItemDto: SearchInventoryItemDto,
  ): Observable<object> {
    return this.inventoryItemsService.searchInventoryItems(
      searchInventoryItemDto,
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  getInventoryById(@Param() params): Observable<object> {
    return this.inventoryItemsService
      .getInventoryItemById(params.id)
      .pipe(
        map((inventoryItem) =>
          DataMapperHelper.checkEntityAndReturnStatus(inventoryItem),
        ),
      );
  }

  @ApiBearerAuth()
  @Post(':id')
  @UseGuards(AdminTokenGuard)
  @HttpCode(HttpStatus.OK)
  updateInventoryById(
    @Param() params,
    @Body() updateInventoryItemDto: UpdateInventoryItemDto,
  ): Observable<object> {
    return this.inventoryItemsService.getInventoryItemById(params.id).pipe(
      map((inventoryItem: InventoryItemEntity) =>
        DataMapperHelper.checkEntityAndReturnStatus(inventoryItem),
      ),
      switchMap((result: InventoryItemEntity) => {
        return this.inventoryItemsService.updateInventoryItem(
          updateInventoryItemDto,
          result,
        );
      }),
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  getInventoryItems(@Body() getPageDto: GetPageDto): Observable<object> {
    return this.inventoryItemsService.getInventoryItemsAndCount(
      getPageDto.page,
    );
  }

  @ApiBearerAuth()
  @Post()
  @HttpCode(HttpStatus.CREATED)
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
