import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminTokenGuard } from '../../guards/admin-token-guard';
import { CreateInventoryCategoryDto } from './create-inventory-category-dto';
import { InventoryCategoriesService } from '../../services/inventory-categories.service';
import { map, Observable, switchMap } from 'rxjs';
import { ApiBearerAuth } from '@nestjs/swagger';
import { GetPageDto } from '../../shared-dto/get-page.dto';
import { DataMapperHelper } from '../../shared-helpers/data-mapper.helper';
import { UpdateInventoryItemDto } from '../inventory-items/update-inventory-item-dto';

@Controller('api/inventory-categories')
export class InventoryCategoriesController {
  constructor(
    private readonly inventoryCategoriesService: InventoryCategoriesService,
  ) {}

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  getInventoryCategoryById(@Param() params): Observable<object> {
    return this.inventoryCategoriesService
      .getInventoryCategoryById(params.id)
      .pipe(
        map((inventoryItem) =>
          DataMapperHelper.checkEntityAndReturnStatus(inventoryItem),
        ),
      );
  }

  @ApiBearerAuth()
  @Post(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminTokenGuard)
  updateInventoryCategoryById(
    @Param() params,
    @Body() updateInventoryItemDto: UpdateInventoryItemDto,
  ): Observable<object> {
    return this.inventoryCategoriesService
      .getInventoryCategoryById(params.id)
      .pipe(
        map((category) =>
          DataMapperHelper.checkEntityAndReturnStatus(category),
        ),
        switchMap((result) =>
          this.inventoryCategoriesService.updateInventoryCategory(
            updateInventoryItemDto,
            result,
          ),
        ),
      );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  getInventoryCategories(@Body() getPageDto: GetPageDto): Observable<object> {
    return this.inventoryCategoriesService.getInventoryCategoriesAndCount(
      getPageDto.page,
    );
  }

  @ApiBearerAuth()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AdminTokenGuard)
  postInventoryCategory(
    @Body() createInventoryCategoryDto: CreateInventoryCategoryDto,
  ): Observable<object> {
    return this.inventoryCategoriesService.addInventoryCategory(
      createInventoryCategoryDto,
    );
  }
}
