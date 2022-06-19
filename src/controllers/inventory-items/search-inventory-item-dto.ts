import { IsArray, IsInt, IsNotEmpty, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SearchInventoryItemFieldsDto } from './search-inventory-item-fields-dto';
import { Type } from 'class-transformer';

export class SearchInventoryItemDto
  implements SearchableInterface<SearchInventoryItemFieldsDto>
{
  @ApiProperty()
  @IsArray()
  @IsNotEmpty()
  search_fields: SearchInventoryItemFieldsDto[];

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page: number = 1;
}
