export interface Encryptor {
  encrypt(plaintext: string): string;
  decrypt(ciphertext: string): string;
}

export function createEncryptor(): Encryptor {
  return {
    encrypt(plaintext) {
      return plaintext;
    },
    decrypt(ciphertext) {
      return ciphertext;
    }
  };
}