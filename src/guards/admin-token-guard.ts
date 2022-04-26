import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { LoginTokensService } from '../services/login-tokens.service';

@Injectable()
export class AdminTokenGuard implements CanActivate {
  constructor(private loginTokensService: LoginTokensService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const requestHeaders = context.switchToHttp().getRequest().headers;
    return this.validateRequest(requestHeaders);
  }

  validateRequest(requestHeaders: any): Observable<boolean> {
    const authorizationToken = requestHeaders['authorization'].split(' ')[1];
    return this.loginTokensService.verifyTokenIsAdmin(authorizationToken);
  }
}
