import { SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from 'src/auth/domain/entities';

export const Roles = Reflector.createDecorator<UserRole[]>();
