import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Extracts the authenticated user from request.user (set by JwtStrategy.validate). */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
