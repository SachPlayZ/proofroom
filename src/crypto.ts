const encoder = new TextEncoder();

function toBase64(input: ArrayBuffer | Uint8Array): string {
  let binary = '';
  const bytes = input instanceof ArrayBuffer ? new Uint8Array(input) : input;
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function fromBase64(value: string): ArrayBuffer {
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function encryptDossier(payload: unknown): Promise<{
  ciphertext: string;
  hash: string;
  key: CryptoKey;
}> {
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = encoder.encode(JSON.stringify(payload));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
  const packet = `${toBase64(iv)}.${toBase64(encrypted)}`;
  return { ciphertext: packet, hash: `sha256:${(await sha256Hex(packet)).slice(0, 10)}…`, key };
}

export async function decryptDossier(ciphertext: string, key: CryptoKey): Promise<unknown> {
  const [ivEncoded, payloadEncoded] = ciphertext.split('.');
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(ivEncoded) },
    key,
    fromBase64(payloadEncoded),
  );
  return JSON.parse(new TextDecoder().decode(decrypted));
}
