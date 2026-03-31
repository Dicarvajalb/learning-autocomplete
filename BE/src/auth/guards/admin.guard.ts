import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthenticatedUser, AuthUserRole } from '../domain/entities';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;
    return user?.role === AuthUserRole.ADMIN;
  }
}
