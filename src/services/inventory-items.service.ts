import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';
import { firstValueFrom, from, Observable } from 'rxjs';
import { InventoryItemEntity } from '../entities/inventory-item.entity';
import { CreateInventoryItemDto } from '../controllers/inventory-items/create-inventory-item-dto';
import { UsersService } from './users.service';
import moment from 'moment';
import { InventoryCategoriesService } from './inventory-categories.service';
import { UserEntity } from '../entities/user.entity';
import { PhotoUploadsService } from './photo-uploads.service';

@Injectable()
export class InventoryItemsService {
  constructor(
    private readonly connection: Connection,
    private readonly usersService: UsersService,
    private readonly inventoryCategoriesService: InventoryCategoriesService,
    private readonly photoUploadsService: PhotoUploadsService,
  ) {}

  public getInventoryItemById(
    inventoryItemId: string,
  ): Observable<InventoryItemEntity | undefined> {
    return from(
      this.connection.manager.findOne(InventoryItemEntity, {
        where: {
          id: inventoryItemId,
          is_valid: true,
        },
        relations: [
          'ohp_claimed_by',
          'owned_by',
          'donated_by',
          'maintained_by',
          'created_by',
          'photo',
        ],
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

  public addInventoryItem(
    createInventoryItemDto: CreateInventoryItemDto,
    creator: UserEntity,
    photo: Express.Multer.File = undefined,
  ): Observable<InventoryItemEntity | undefined> {
    const inventoryItemEntity: Partial<InventoryItemEntity> = {
      title: createInventoryItemDto.title,
      description: createInventoryItemDto.description,
      item_count: createInventoryItemDto.item_count,
      is_in_space: createInventoryItemDto.is_in_space,
      is_working: createInventoryItemDto.is_working,
      created_by: creator,
    };
    return from(
      this.connection.manager.transaction(
        async (transactionalEntityManager) => {
          if (createInventoryItemDto.not_working_description) {
            inventoryItemEntity.not_working_description =
              createInventoryItemDto.not_working_description;
          }

          if (createInventoryItemDto.not_working_start_date) {
            inventoryItemEntity.not_working_start_date = moment(
              createInventoryItemDto.not_working_start_date,
            )
              .utc()
              .toDate();
          }

          if (createInventoryItemDto.donated_by_user_id) {
            const donatedByUser = await firstValueFrom(
              this.usersService.getUserById(
                createInventoryItemDto.donated_by_user_id,
              ),
            );

            if (donatedByUser) {
              inventoryItemEntity.donated_by = donatedByUser;
            }
          }

          if (createInventoryItemDto.maintained_by_user_id) {
            const maintainedByUser = await firstValueFrom(
              this.usersService.getUserById(
                createInventoryItemDto.maintained_by_user_id,
              ),
            );
            if (maintainedByUser) {
              inventoryItemEntity.maintained_by = maintainedByUser;
            }
          }

          if (createInventoryItemDto.owned_by_user_id) {
            const ownedByUser = await firstValueFrom(
              this.usersService.getUserById(
                createInventoryItemDto.owned_by_user_id,
              ),
            );
            if (ownedByUser) {
              inventoryItemEntity.owned_by = ownedByUser;
            }
          }

          if (createInventoryItemDto.category_id) {
            const category = await firstValueFrom(
              this.inventoryCategoriesService.getInventoryCategoryById(
                createInventoryItemDto.category_id,
              ),
            );
            if (category) {
              inventoryItemEntity.category = category;
            }
          }

          if (photo) {
            inventoryItemEntity.photo =
              await this.photoUploadsService.uploadPhotoUsingTransaction(
                transactionalEntityManager,
                photo,
                createInventoryItemDto.title,
                creator,
              );
          }

          return transactionalEntityManager.save<InventoryItemEntity>(
            transactionalEntityManager.create<InventoryItemEntity>(
              InventoryItemEntity,
              inventoryItemEntity,
            ),
          );
        },
      ),
    );
  }
}
