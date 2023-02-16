import { Injectable } from '@nestjs/common';
import { Context } from 'telegraf';
import { readFileSync } from 'fs';

@Injectable()
export class AppServices {
  async getHello(ctx: Context) {
    const username = ctx.message.from.username;
    const startSticker = readFileSync('./public/start.webp');

    await ctx.reply(`Hi @${username}!`);
    await ctx.sendSticker({ source: startSticker });
  }

  async getHelp(ctx: Context) {
    const helpSticker = readFileSync('./public/help.webp');
    const helpText =
      'I can help you to manage your money:\n' +
      '\n' +
      'Manage it by sending these commands:\n' +
      '\n' +
      '/start - start a conversation\n' +
      '/help - show the list of commands\n' +
      '\n' +
      '𝑫𝑨𝑻𝑨𝑩𝑨𝑺𝑬 𝑪𝑶𝑴𝑴𝑨𝑵𝑫𝑺:\n' +
      '/send - send and update information to database\n' +
      '/consult - show you any information you want\n' +
      '/updates - show you the last five updates in database\n' +
      '\n' +
      '𝑵𝑶𝑻𝑰𝑭𝑰𝑪𝑨𝑻𝑰𝑶𝑵𝑺 𝑪𝑶𝑴𝑴𝑨𝑵𝑫𝑺:\n' +
      '/nots - enable notifications\n' +
      '/notsdisable - disable notifications';

    await ctx.reply(helpText);
    await ctx.sendSticker({ source: helpSticker });
  }

  async unknownCommand(ctx: Context) {
    const message = ctx.message;

    await ctx.reply(
      `Unknown command: ${message['text']}.` +
        '\n' +
        'Type /help to see the list of available commands.',
      {
        reply_to_message_id: message.message_id,
      },
    );
  }
}
