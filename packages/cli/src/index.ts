import { Command } from 'commander';
import { registerValidate } from './commands/validate.ts';
import { registerPush } from './commands/push.ts';
import { registerStatus } from './commands/status.ts';
import { registerFeedback } from './commands/feedback.ts';
import { registerSurfaces } from './commands/surfaces.ts';
import { registerThemes } from './commands/themes.ts';
import { registerBlocks } from './commands/blocks.ts';
import { registerAliases } from './commands/aliases.ts';
import { registerErrors } from './commands/errors.ts';
import { registerRecipes } from './commands/recipes.ts';
import { registerDesign } from './commands/design.ts';
import { registerServer } from './commands/server.ts';

const program = new Command();
program.name('renderkit').description('Local Agent artifact renderer').version('0.0.1');

registerValidate(program);
registerPush(program);
registerStatus(program);
registerFeedback(program);
registerSurfaces(program);
registerThemes(program);
registerBlocks(program);
registerAliases(program);
registerErrors(program);
registerRecipes(program);
registerDesign(program);
registerServer(program);

program.parseAsync().catch(e => { console.error(e); process.exit(2); });
