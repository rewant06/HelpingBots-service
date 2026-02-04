import { JwtKeyCrypto } from './jwt-key-crypto';

describe('JwtKeyCrypto', () => {
  beforeAll(() => {
    process.env.JWT_SIGNING_KEY_ENC_KEY = Buffer.alloc(32, 7).toString(
      'base64',
    );
  });

  it('encrypts and decrypts PEM roundtrip', () => {
    const c = new JwtKeyCrypto();
    const pem = '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n';
    const enc = c.encryptPem(pem);
    expect(enc.startsWith('v1:')).toBe(true);
    expect(c.decryptPem(enc)).toBe(pem);
  });
});
