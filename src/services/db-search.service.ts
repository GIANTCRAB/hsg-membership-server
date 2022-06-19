import { Injectable } from '@nestjs/common';
import { Connection, EntityTarget, FindConditions } from 'typeorm';
import { from, map, Observable } from 'rxjs';
import { ListDataDto } from '../shared-dto/list-data.dto';
import { DataMapperHelper } from '../shared-helpers/data-mapper.helper';

@Injectable()
export class DbSearchService {
  constructor(private readonly connection: Connection) {}

  public searchDatabase<T, K>(
    entityType: EntityTarget<T>,
    searchQuery: SearchableInterface<K>,
    relations: string[],
  ): Observable<ListDataDto<T>> {
    const databaseIndex = searchQuery.page - 1;
    const toTake = DataMapperHelper.defaultToTake;
    const toSkip = toTake * databaseIndex;
    return from(
      this.connection.manager.findAndCount<T>(entityType, {
        where: this.searchQueryFormation<T, K>(searchQuery),
        relations: relations,
        skip: toSkip,
        take: toTake,
      }),
    ).pipe(
      map((result) =>
        DataMapperHelper.mapArrayToListDataDto<T>(searchQuery.page, result),
      ),
    );
  }

  private searchQueryFormation<T, K>(
    searchQuery: SearchableInterface<K>,
  ): FindConditions<T>[] {
    const whereFields: FindConditions<T>[] = [];
    if (searchQuery.search_fields !== undefined) {
      searchQuery.search_fields.forEach((searchField) => {
        const whereField: FindConditions<T> = {};
        for (const fieldName in searchField) {
          whereField[String(fieldName)] = searchField[fieldName];
        }
      });
    }
    return whereFields;
  }
}
