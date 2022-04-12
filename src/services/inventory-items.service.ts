import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';
import { from, Observable } from 'rxjs';
import { InventoryItemEntity } from '../entities/inventory-item.entity';

@Injectable()
export class InventoryItemsService {
  constructor(private readonly connection: Connection) {}

  public getInventoryItemById(
    inventoryItemId: string,
  ): Observable<InventoryItemEntity | undefined> {
    return from(
      this.connection.manager.findOne(InventoryItemEntity, {
        where: {
          id: inventoryItemId,
          is_valid: true,
        },
        relations: ['ohp_claimed_by', 'owned_by', 'donated_by', 'photo'],
      }),
    );
  }

  public getInventoryItemsAndCount(
    page: number = 0,
  ): Observable<[InventoryItemEntity[], number]> {
    const toTake = 30;
    const toSkip = toTake * page;
    return from(
      this.connection.manager.findAndCount(InventoryItemEntity, {
        where: { is_valid: true },
        skip: toSkip,
        take: toTake,
      }),
    );
  }
}
