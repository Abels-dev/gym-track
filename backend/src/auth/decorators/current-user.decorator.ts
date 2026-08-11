import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthPrincipal } from '../auth.types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthPrincipal | undefined => {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthPrincipal }>();

    return request.user;
  },
);
