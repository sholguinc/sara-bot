import { Injectable } from '@nestjs/common';
import { Context } from 'telegraf';
import { readFileSync } from 'fs';
import { escapeMessage } from './utils';

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
      '_*Database Commands:*_\n' +
      '/send - send and update information to database\n' +
      '/consult - show you any information you want\n' +
      '/search - search expenses by some criteria\n' +
      '\n' +
      '_*Files Commands:*_\n' +
      '/upload - upload a csv file of expenses\n' +
      '/files - show info of last uploaded files\n' +
      '/data - download all data in a cvs file\n' +
      '\n' +
      '_*Users Commands:*_\n' +
      '/users - show users info and their incomes\n' +
      '/activate - activate or deactivate users';

    const escapedMessage = escapeMessage(helpText);
    await ctx.replyWithMarkdownV2(escapedMessage);
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

  async replyText(ctx: Context) {
    const message = ctx.message;

    await ctx.reply(message['text'], {
      reply_to_message_id: message.message_id,
    });
  }
}
