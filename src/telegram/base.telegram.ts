import { Injectable } from '@nestjs/common';
import { Scenes } from 'telegraf';
import { readFileSync } from 'fs';

@Injectable()
export class BaseTelegram {
  // Methods
  completedMessage(ctx: Scenes.WizardContext, message?: string) {
    const completedMessage = message ?? 'Data sent successfully!';
    ctx.editMessageText(completedMessage);
    this.completedSticker(ctx);
  }

  completedSticker(ctx: Scenes.WizardContext) {
    const confirmedSticker = readFileSync('./public/confirmed.webp');
    ctx.sendSticker({ source: confirmedSticker });
  }

  errorMessage(ctx: Scenes.WizardContext, message?: string) {
    const errorText = message ?? 'There was an error';
    const errorSticker = readFileSync('./public/error.webp');
    ctx.editMessageText(errorText);
    ctx.sendSticker({ source: errorSticker });
  }

  cancelOperation(ctx: Scenes.WizardContext) {
    ctx.editMessageText('Operation was cancelled');
    ctx.scene.leave();
  }
}
