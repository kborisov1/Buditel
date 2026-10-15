import { getApi } from '../../../server';

const handle = (request: Request) => getApi().fetch(request);

export { handle as GET, handle as POST, handle as PUT, handle as PATCH, handle as DELETE };
