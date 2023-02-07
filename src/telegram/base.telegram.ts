import { Injectable } from '@nestjs/common';
import { Scenes } from 'telegraf';
import { readFileSync } from 'fs';

@Injectable()
export class BaseTelegram {
  // Methods
  completedMessage(ctx: Scenes.WizardContext) {
    const confirmedSticker = readFileSync('./public/confirmed.webp');
    ctx.editMessageText(`Data sent successfully!`);
    ctx.sendSticker({ source: confirmedSticker });
  }

  errorMessage(ctx: Scenes.WizardContext) {
    const errorSticker = readFileSync('./public/error.webp');
    ctx.editMessageText(`There was an error, I'm Sorry...`);
    ctx.sendSticker({ source: errorSticker });
  }

  cancelOperation(ctx: Scenes.WizardContext) {
    ctx.editMessageText('Operation was cancelled');
    ctx.scene.leave();
  }
}
