import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';
import { from, map, Observable } from 'rxjs';
import { InventoryCategoryEntity } from '../entities/inventory-category.entity';
import { CreateInventoryCategoryDto } from '../controllers/inventory-categories/create-inventory-category-dto';
import { ListDataDto } from '../shared-dto/list-data.dto';
import { DataMapperHelper } from '../shared-helpers/data-mapper.helper';

@Injectable()
export class InventoryCategoriesService {
  constructor(private readonly connection: Connection) {}

  public getInventoryCategoriesAndCount(
    page: number = 1,
  ): Observable<ListDataDto<InventoryCategoryEntity>> {
    const databaseIndex = page - 1;
    const toTake = DataMapperHelper.defaultToTake;
    const toSkip = toTake * databaseIndex;
    return from(
      this.connection.manager.findAndCount(InventoryCategoryEntity, {
        where: { is_valid: true },
        skip: toSkip,
        take: toTake,
      }),
    ).pipe(
      map((result) =>
        DataMapperHelper.mapArrayToListDataDto<InventoryCategoryEntity>(
          page,
          result,
        ),
      ),
    );
  }

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
