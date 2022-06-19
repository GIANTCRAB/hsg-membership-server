import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';
import { firstValueFrom, from, map, Observable, switchMap } from 'rxjs';
import { InventoryItemEntity } from '../entities/inventory-item.entity';
import { CreateInventoryItemDto } from '../controllers/inventory-items/create-inventory-item-dto';
import { UsersService } from './users.service';
import moment from 'moment';
import { InventoryCategoriesService } from './inventory-categories.service';
import { UserEntity } from '../entities/user.entity';
import { PhotoUploadsService } from './photo-uploads.service';
import { ListDataDto } from '../shared-dto/list-data.dto';
import { DataMapperHelper } from '../shared-helpers/data-mapper.helper';
import { UpdateInventoryItemDto } from '../controllers/inventory-items/update-inventory-item-dto';
import { SearchInventoryItemDto } from '../controllers/inventory-items/search-inventory-item-dto';
import { DbSearchService } from './db-search.service';
import { SearchInventoryItemFieldsDto } from '../controllers/inventory-items/search-inventory-item-fields-dto';

@Injectable()
export class InventoryItemsService {
  constructor(
    private readonly connection: Connection,
    private readonly usersService: UsersService,
    private readonly inventoryCategoriesService: InventoryCategoriesService,
    private readonly photoUploadsService: PhotoUploadsService,
    private readonly dbSearchService: DbSearchService,
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
          'owned_by',
          'category',
          'donated_by',
          'maintained_by',
          'created_by',
          'photo',
        ],
      }),
    );
  }

  public getInventoryItemsAndCount(
    page: number = 1,
  ): Observable<ListDataDto<InventoryItemEntity>> {
    const databaseIndex = page - 1;
    const toTake = DataMapperHelper.defaultToTake;
    const toSkip = toTake * databaseIndex;
    return from(
      this.connection.manager.findAndCount(InventoryItemEntity, {
        where: { is_valid: true },
        skip: toSkip,
        take: toTake,
      }),
    ).pipe(
      map((result) =>
        DataMapperHelper.mapArrayToListDataDto<InventoryItemEntity>(
          page,
          result,
        ),
      ),
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
          if (
            createInventoryItemDto.is_working !== undefined &&
            !createInventoryItemDto.is_working
          ) {
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

  public updateInventoryItem(
    updateInventoryItemDto: UpdateInventoryItemDto,
    inventoryItem: InventoryItemEntity,
  ): Observable<InventoryItemEntity | undefined> {
    const updatedInventoryItemEntity: Partial<InventoryItemEntity> = {
      title: updateInventoryItemDto.title ?? inventoryItem.title,
      description:
        updateInventoryItemDto.description ?? inventoryItem.description,
      item_count: updateInventoryItemDto.item_count ?? inventoryItem.item_count,
      is_in_space:
        updateInventoryItemDto.is_in_space ?? inventoryItem.is_in_space,
      is_working: updateInventoryItemDto.is_working ?? inventoryItem.is_working,
    };
    return from(
      this.connection.manager.transaction(
        async (transactionalEntityManager) => {
          if (
            updatedInventoryItemEntity.is_working !== undefined &&
            !updatedInventoryItemEntity.is_working
          ) {
            if (updatedInventoryItemEntity.not_working_description) {
              updatedInventoryItemEntity.not_working_description =
                updateInventoryItemDto.not_working_description;
            }

            if (updatedInventoryItemEntity.not_working_start_date) {
              updatedInventoryItemEntity.not_working_start_date = moment(
                updateInventoryItemDto.not_working_start_date,
              )
                .utc()
                .toDate();
            }
          }

          if (updateInventoryItemDto.donated_by_user_id !== undefined) {
            if (updateInventoryItemDto.donated_by_user_id === null) {
              updatedInventoryItemEntity.donated_by = null;
            } else {
              const donatedByUser = await firstValueFrom(
                this.usersService.getUserById(
                  updateInventoryItemDto.donated_by_user_id,
                ),
              );

              if (donatedByUser) {
                updatedInventoryItemEntity.donated_by = donatedByUser;
              }
            }
          }

          if (updateInventoryItemDto.maintained_by_user_id !== undefined) {
            if (updateInventoryItemDto.maintained_by_user_id === null) {
              updatedInventoryItemEntity.maintained_by = null;
            } else {
              const maintainedByUser = await firstValueFrom(
                this.usersService.getUserById(
                  updateInventoryItemDto.maintained_by_user_id,
                ),
              );
              if (maintainedByUser) {
                updatedInventoryItemEntity.maintained_by = maintainedByUser;
              }
            }
          }

          if (updateInventoryItemDto.owned_by_user_id !== undefined) {
            if (updateInventoryItemDto.owned_by_user_id === null) {
              updatedInventoryItemEntity.owned_by = null;
            } else {
              const ownedByUser = await firstValueFrom(
                this.usersService.getUserById(
                  updateInventoryItemDto.owned_by_user_id,
                ),
              );
              if (ownedByUser) {
                updatedInventoryItemEntity.owned_by = ownedByUser;
              }
            }
          }

          if (updateInventoryItemDto.category_id !== undefined) {
            if (updateInventoryItemDto.category_id === null) {
              updatedInventoryItemEntity.category = null;
            } else {
              const category = await firstValueFrom(
                this.inventoryCategoriesService.getInventoryCategoryById(
                  updateInventoryItemDto.category_id,
                ),
              );
              if (category) {
                updatedInventoryItemEntity.category = category;
              }
            }
          }

          return transactionalEntityManager.update(
            InventoryItemEntity,
            {
              id: inventoryItem.id,
            },
            updatedInventoryItemEntity,
          );
        },
      ),
    ).pipe(switchMap(() => this.getInventoryItemById(inventoryItem.id)));
  }

  public searchInventoryItems(
    searchInventoryItemDto: SearchInventoryItemDto,
  ): Observable<ListDataDto<InventoryItemEntity>> {
    return this.dbSearchService.searchDatabase<
      InventoryItemEntity,
      SearchInventoryItemFieldsDto
    >(InventoryItemEntity, searchInventoryItemDto, [
      'owned_by',
      'category',
      'donated_by',
      'maintained_by',
      'created_by',
      'photo',
    ]);
  }
}
