export function escapeMessage(message: string) {
  return message
    .replace(/-/g, '\\-')
    .replace(/\./g, '\\.')
    .replace(/!/g, '\\!')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/>/g, '\\>')
    .replace(/</g, '\\<')
    .replace(/\+/g, '\\+');
}
