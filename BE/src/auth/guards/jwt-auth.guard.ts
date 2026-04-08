import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';
import { Reflector } from '@nestjs/core';
import { Roles } from 'src/common/decorators/roles.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const roles = this.reflector.getAllAndOverride(Roles, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roles || roles.length == 0) {
      return true;
    }
    const token = request.cookies?.access_token;
    console.log('🚀 ~ JwtAuthGuard ~ canActivate ~ token:', token);

    if (!token) {
      throw new UnauthorizedException('Missing authentication cookie');
    }

    const authenticatedUser =
      await this.authService.validateApplicationToken(token);
    request.user = authenticatedUser;

    return roles.some((r) => r === authenticatedUser.role);
  }
}
