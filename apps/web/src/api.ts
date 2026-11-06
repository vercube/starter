import { createClient } from '@vercube/client';
import type { VercubeRoutes } from '../../api/.vercube/routes';

/**
 * The typed client for the API. Its routes come from the API's controllers
 * through apps/api/.vercube/routes.d.ts, which `vercube dev` keeps up to date:
 * change a handler and every call that no longer fits stops compiling.
 */
export const api = createClient<VercubeRoutes>({ baseURL: globalThis.location.origin });
