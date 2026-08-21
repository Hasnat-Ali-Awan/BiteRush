import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { UserRole } from '../../users/schemas/user.schema';

export type AuthUser = {
  userId: string;
  email: string;
  role: UserRole;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    return ctx.switchToHttp().getRequest().user;
  },
);
