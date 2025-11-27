import * as argon2 from 'argon2';

export default async function ({ task, args }: { task: string; args: any }) {
  switch (task) {
    case 'hash':
      return argon2.hash(args.password);
    case 'verify':
      return argon2.verify(args.hash, args.password);
    default:
      throw new Error(`Unknown task: ${task}`);
  }
}
