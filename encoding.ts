export function encodeToBytes(data: string): Uint8Array {
  return new TextEncoder().encode(data);
}
