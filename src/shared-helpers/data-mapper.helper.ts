import { ListDataDto } from '../shared-dto/list-data.dto';

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
}
