import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminTokenGuard } from '../../guards/admin-token-guard';
import { CreateInventoryCategoryDto } from './create-inventory-category-dto';
import { InventoryCategoriesService } from '../../services/inventory-categories.service';
import { map, Observable } from 'rxjs';
import { ApiBearerAuth } from '@nestjs/swagger';
import { GetPageDto } from '../../shared-dto/get-page.dto';
import { DataMapperHelper } from '../../shared-helpers/data-mapper.helper';

@Controller('inventory-categories')
export class InventoryCategoriesController {
  constructor(
    private readonly inventoryCategoriesService: InventoryCategoriesService,
  ) {}

  @Get(':id')
  @HttpCode(200)
  getInventoryCategoryById(@Param() params): Observable<object> {
    return this.inventoryCategoriesService
      .getInventoryCategoryById(params.id)
      .pipe(
        map((inventoryItem) =>
          DataMapperHelper.checkEntityAndReturnStatus(inventoryItem),
        ),
      );
  }

  @Get()
  @HttpCode(200)
  getInventoryCategories(@Body() getPageDto: GetPageDto): Observable<object> {
    return this.inventoryCategoriesService.getInventoryCategoriesAndCount(
      getPageDto.page,
    );
  }

  @ApiBearerAuth()
  @Post()
  @HttpCode(201)
  @UseGuards(AdminTokenGuard)
  postInventoryCategory(
    @Body() createInventoryCategoryDto: CreateInventoryCategoryDto,
  ): Observable<object> {
    return this.inventoryCategoriesService.addInventoryCategory(
      createInventoryCategoryDto,
    );
  }
}
