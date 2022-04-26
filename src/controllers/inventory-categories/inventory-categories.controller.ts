import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { AdminTokenGuard } from '../../guards/admin-token-guard';
import { CreateInventoryCategoryDto } from './create-inventory-category-dto';
import { InventoryCategoriesService } from '../../services/inventory-categories.service';
import { Observable } from 'rxjs';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('inventory-categories')
export class InventoryCategoriesController {
  constructor(
    private readonly inventoryCategoriesService: InventoryCategoriesService,
  ) {}

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
