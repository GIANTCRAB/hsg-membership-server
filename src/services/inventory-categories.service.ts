import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';
import { from, Observable } from 'rxjs';
import { InventoryCategoryEntity } from '../entities/inventory-category.entity';

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
}
