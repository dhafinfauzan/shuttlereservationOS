declare module 'swagger-ui-express' {
  import type { RequestHandler } from 'express';

  export const serve: RequestHandler[];
  export function setup(specification: unknown): RequestHandler;

  const swaggerUi: {
    serve: RequestHandler[];
    setup: typeof setup;
  };

  export default swaggerUi;
}
