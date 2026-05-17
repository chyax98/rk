import { Command } from 'commander';
import { registerValidate } from './commands/validate';
import { registerPush } from './commands/push';
import { registerStatus } from './commands/status';
import { registerFeedback } from './commands/feedback';
import { registerSurfaces } from './commands/surfaces';
import { registerThemes } from './commands/themes';
import { registerBlocks } from './commands/blocks';
import { registerAliases } from './commands/aliases';
import { registerErrors } from './commands/errors';
import { registerRecipes } from './commands/recipes';
import { registerDesign } from './commands/design';
import { registerServer } from './commands/server';

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
