import { Command } from 'commander';
import { registerAliases } from './commands/aliases.ts';
import { registerBlocks } from './commands/blocks.ts';
import { registerDesign } from './commands/design.ts';
import { registerErrors } from './commands/errors.ts';
import { registerFeedback } from './commands/feedback.ts';
import { registerPush } from './commands/push.ts';
import { registerRecipes } from './commands/recipes.ts';
import { registerServer } from './commands/server.ts';
import { registerStatus } from './commands/status.ts';
import { registerSurfaces } from './commands/surfaces.ts';
import { registerThemes } from './commands/themes.ts';
import { registerValidate } from './commands/validate.ts';

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

program.parseAsync().catch((e) => {
  console.error(e);
  process.exit(2);
});
