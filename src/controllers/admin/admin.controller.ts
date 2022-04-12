import {
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Observable, of, switchMap } from 'rxjs';
import { UsersService } from '../../services/users.service';
import { AdminTokenGuard } from '../../guards/admin-token-guard';
import { AdminService } from '../../services/admin.service';

@Controller('admin')
export class AdminController {
  constructor(
    private adminService: AdminService,
    private usersService: UsersService,
  ) {}

  @Get('is-admin')
  @UseGuards(AdminTokenGuard)
  @HttpCode(200)
  getIsAdmin(): Observable<object> {
    return of({ is_admin: true });
  }

  @Post('user-management/:id/add-membership')
  @UseGuards(AdminTokenGuard)
  @HttpCode(200)
  postAddMembershipToUser(@Param() params): Observable<object> {
    return this.usersService
      .getUserById(params.id)
      .pipe(switchMap((user) => this.adminService.addMembershipToUser(user)));
  }

  @Post('user-management/:id/remove-membership')
  @UseGuards(AdminTokenGuard)
  @HttpCode(200)
  postRemoveMembershipToUser(@Param() params): Observable<object> {
    return this.usersService
      .getUserById(params.id)
      .pipe(
        switchMap((user) => this.adminService.removeMembershipFromUser(user)),
      );
  }
}