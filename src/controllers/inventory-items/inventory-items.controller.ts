import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Observable, switchMap } from 'rxjs';
import { CreateInventoryItemDto } from './create-inventory-item-dto';
import { InventoryItemsService } from '../../services/inventory-items.service';
import { AdminTokenGuard } from '../../guards/admin-token-guard';
import { LoginTokensService } from '../../services/login-tokens.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('inventory-items')
export class InventoryItemsController {
  constructor(
    private readonly inventoryItemsService: InventoryItemsService,
    private readonly loginTokensService: LoginTokensService,
  ) {}

  @ApiBearerAuth()
  @Post('with-photo')
  @HttpCode(201)
  @UseGuards(AdminTokenGuard)
  @UseInterceptors(FileInterceptor('photo'))
  postInventoryItemWithPhoto(
    @Headers('authorization') authorizationToken: string,
    @UploadedFile() photo: Express.Multer.File,
    @Body() createInventoryItemDto: CreateInventoryItemDto,
  ): Observable<object> {
    return this.loginTokensService
      .getUserFromToken(authorizationToken)
      .pipe(
        switchMap((user) =>
          this.inventoryItemsService.addInventoryItem(
            createInventoryItemDto,
            user,
            photo,
          ),
        ),
      );
  }

  @ApiBearerAuth()
  @Post()
  @HttpCode(201)
  @UseGuards(AdminTokenGuard)
  postInventoryItem(
    @Headers('authorization') authorizationToken: string,
    @Body() createInventoryItemDto: CreateInventoryItemDto,
  ): Observable<object> {
    return this.loginTokensService
      .getUserFromToken(authorizationToken)
      .pipe(
        switchMap((user) =>
          this.inventoryItemsService.addInventoryItem(
            createInventoryItemDto,
            user,
          ),
        ),
      );
  }
}
