import { SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthUserRole } from 'src/auth/domain/entities';

export const Roles = Reflector.createDecorator<AuthUserRole[]>();
