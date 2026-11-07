import { createClient } from '@vercube/client';
import type { VercubeRoutes } from '../../api/.vercube/routes';

/**
 * The typed client for the API. Its routes come from the API's controllers
 * through apps/api/.vercube/routes.d.ts, which `vercube dev` keeps up to date:
 * change a handler and every call that no longer fits stops compiling.
 */
export const api = createClient<VercubeRoutes>({ baseURL: globalThis.location.origin });

// Fails to compile when the route map lost its types: an unresolved import in a
// .d.ts turns every route into \`any\` without a word, skipLibCheck hides it.
type RoutesAreTyped = unknown extends VercubeRoutes['GET /api/foo'] ? false : true;

export const routesAreTyped: RoutesAreTyped = true;
