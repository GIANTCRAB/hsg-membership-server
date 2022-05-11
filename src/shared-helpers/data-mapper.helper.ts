import { ListDataDto } from '../shared-dto/list-data.dto';
import { NotFoundException } from '@nestjs/common';

export class DataMapperHelper {
  static defaultToTake = 30;

  static mapArrayToListDataDto<T>(page: number, result: [T[], number]) {
    const totalCount = result[1];
    const finalResult: ListDataDto<T> = {
      data: result[0],
      current_page: page,
      last_page: Math.floor(totalCount / this.defaultToTake) + 1,
      total_count: totalCount,
    };

    return finalResult;
  }

  static checkEntityAndReturnStatus<T>(givenEntity: T) {
    if (givenEntity) {
      return givenEntity;
    }
    throw new NotFoundException(['Entity with such an ID could not be found.']);
  }
}
