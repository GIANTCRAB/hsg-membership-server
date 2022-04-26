import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable, of } from 'rxjs';
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
    if (
      requestHeaders['authorization'] &&
      requestHeaders['authorization'].length > 0
    ) {
      const afterSplit: string[] = requestHeaders['authorization'].split(' ');
      if (afterSplit.length === 2) {
        const authorizationToken = afterSplit[1];
        return this.loginTokensService.verifyTokenIsAdmin(authorizationToken);
      }
    }
    return of(false);
  }
}
