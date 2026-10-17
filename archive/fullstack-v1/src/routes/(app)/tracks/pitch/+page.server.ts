import { program } from '$lib/server/content';
import { requireUser } from '$lib/server/guards';

export const load = (event) => {
	requireUser(event);
	return { track: program().pitch, platformBlock2: program().platform.blocks[1] };
};
