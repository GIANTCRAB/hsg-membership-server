import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';
import { from, Observable } from 'rxjs';
import { InventoryCategoryEntity } from '../entities/inventory-category.entity';
import { CreateInventoryCategoryDto } from '../controllers/inventory-categories/create-inventory-category-dto';

@Injectable()
export class InventoryCategoriesService {
  constructor(private readonly connection: Connection) {}

  public getInventoryCategoryById(
    inventoryCategoryId: string,
  ): Observable<InventoryCategoryEntity | undefined> {
    return from(
      this.connection.manager.findOne(InventoryCategoryEntity, {
        where: {
          id: inventoryCategoryId,
          is_valid: true,
        },
      }),
    );
  }

  public addInventoryCategory(
    createInventoryCategoryDto: CreateInventoryCategoryDto,
  ): Observable<InventoryCategoryEntity | undefined> {
    const inventoryCategory: Partial<InventoryCategoryEntity> = {
      title: createInventoryCategoryDto.title,
      description: createInventoryCategoryDto.description,
    };
    return from(
      this.connection.manager.save<InventoryCategoryEntity>(
        this.connection.manager.create<InventoryCategoryEntity>(
          InventoryCategoryEntity,
          inventoryCategory,
        ),
      ),
    );
  }
}
