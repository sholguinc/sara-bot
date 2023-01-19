export function escapeMessage(message: string) {
  return message.replace('-', '\\-').replace('.', '\\.').replace('!', '\\!');
}
