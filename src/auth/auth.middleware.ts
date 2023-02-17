import { readFileSync } from 'fs';
import { config } from 'dotenv';
import { ConfigService } from '@nestjs/config';

config();
const configService = new ConfigService();

// id
const adminUserId = Number(configService.get('ADMIN_USER_ID'));

export function AuthMiddleware(ctx, next) {
  if (ctx.message) {
    const userId = ctx.message.from.id;

    if (userId == adminUserId) {
      return next();
    } else {
      const unauthorizedSticker = readFileSync('./public/unauthorized.webp');

      ctx.reply(`Hey! You don't have the permissions to use this bot`);
      ctx.sendSticker({ source: unauthorizedSticker });
    }
  } else {
    return next();
  }
}
