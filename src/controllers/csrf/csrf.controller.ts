import { Controller, Get, HttpCode, Req, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller('api/user-auth')
export class CsrfController {
  constructor() {}

  @HttpCode(200)
  @Get('csrf-token')
  getCsrfTokenHeader(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.cookie('XSRF-TOKEN', req.csrfToken(), {
      httpOnly: false,
    });
  }
}
