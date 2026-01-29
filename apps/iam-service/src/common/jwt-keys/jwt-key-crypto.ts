import { Injectable } from '@nestjs/common';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto';

@Injectable()
export class JwtKeyCrypto {
  private getKey(): Buffer {
    const raw = process.env.JWT_SIGNING_KEY_ENC_KEY;
    if (!raw) {
      if (process.env.NODE_ENV === 'test') {
        return createHash('sha256').update('test-only-key').digest(); // 32 bytes
      }
      throw new Error('JWT_SIGNING_KEY_ENC_KEY not configured');
    }

    // Accept base64(32 bytes) or hex(64 chars) or derive via sha256 for other strings
    const b64 = Buffer.from(raw, 'base64');
    if (b64.length === 32) return b64;
    const hexOk = /^[0-9a-fA-F]{64}$/.test(raw);
    if (hexOk) return Buffer.from(raw, 'hex');
    if (Buffer.byteLength(raw, 'utf8') >= 32)
      return Buffer.from(raw, 'utf8').subarray(0, 32);
    return createHash('sha256').update(raw, 'utf8').digest();
  }

  encryptPem(pem: string): string {
    const key = this.getKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(pem, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return `v1:${iv.toString('base64')}.${tag.toString('base64')}.${ciphertext.toString('base64')}`;
  }

  decryptPem(enc: string): string {
    if (!enc.startsWith('v1:'))
      throw new Error('Unsupported privateKeyEnc format');
    const body = enc.slice(3);
    const [ivB64, tagB64, ctB64] = body.split('.');
    if (!ivB64 || !tagB64 || !ctB64) throw new Error('Malformed privateKeyEnc');

    const key = this.getKey();
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const ct = Buffer.from(ctB64, 'base64');
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(ct), decipher.final()]);
    return plaintext.toString('utf8');
  }
}
