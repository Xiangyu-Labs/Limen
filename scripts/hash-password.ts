import { stdin, stdout } from 'node:process';
import { hashPassword } from '../src/lib/auth/security';

function readHidden(prompt: string) {
  if (!stdin.isTTY || !stdout.isTTY || typeof stdin.setRawMode !== 'function') {
    throw new Error('This command must run in an interactive terminal');
  }
  stdout.write(prompt);
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding('utf8');

  return new Promise<string>((resolve, reject) => {
    let value = '';
    function finish(error?: Error) {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.off('data', onData);
      stdout.write('\n');
      if (error) reject(error);
      else resolve(value);
    }
    function onData(chunk: string) {
      if (chunk === '\u0003') return finish(new Error('Cancelled'));
      if (chunk === '\r' || chunk === '\n') return finish();
      if (chunk === '\u007f') {
        if (value.length > 0) {
          value = value.slice(0, -1);
          stdout.write('\b \b');
        }
        return;
      }
      if (/^[\x20-\x7e]+$/.test(chunk)) {
        value += chunk;
        stdout.write('*'.repeat(chunk.length));
      }
    }
    stdin.on('data', onData);
  });
}

async function main() {
  const password = await readHidden('Password: ');
  const confirmation = await readHidden('Confirm password: ');
  if (password !== confirmation) throw new Error('Passwords do not match');
  console.log(`AUTH_PASSWORD_HASH=${await hashPassword(password)}`);
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
