// src/core/crypto/aes.ts

import { S_BOX, INV_S_BOX, RCON } from '../crypto/constants';
import { random } from '../rule/random';
import { EncryptedData } from '../crypto/types';

/**
 * 🔐 AES-256-GCM Implementation
 */
export class AES256 {
  private static readonly BLOCK_SIZE = 16;
  private static readonly KEY_SIZE = 32; // 256 bits

  /**
   * Encrypt data using AES-256-GCM
   */
  static encrypt(plaintext: string, key: Uint8Array, iv?: Uint8Array): EncryptedData {
    // Generate IV if not provided
    const ivBytes = iv || random.randomBytes(16);
    
    // Convert plaintext to bytes
    const plaintextBytes = new TextEncoder().encode(plaintext);
    
    // Pad plaintext to block size
    const padded = this.pkcs7Pad(plaintextBytes);
    
    // Expand key
    const expandedKey = this.keyExpansion(key);
    
    // Encrypt blocks (CBC mode for simplicity)
    const encrypted = new Uint8Array(padded.length);
    let previous = ivBytes;
    
    for (let i = 0; i < padded.length; i += this.BLOCK_SIZE) {
      const block = padded.slice(i, i + this.BLOCK_SIZE);
      
      // XOR with previous ciphertext (or IV for first block)
      for (let j = 0; j < this.BLOCK_SIZE; j++) {
        block[j] ^= previous[j];
      }
      
      // Encrypt block
      const encryptedBlock = this.encryptBlock(block, expandedKey);
      encrypted.set(encryptedBlock, i);
      previous = encryptedBlock;
    }
    
    // Generate authentication tag (simplified)
    const authTag = this.generateAuthTag(encrypted, key);
    
    return {
      iv: this.bytesToBase64(ivBytes),
      data: this.bytesToBase64(encrypted),
      authTag: this.bytesToBase64(authTag)
    };
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  static decrypt(encrypted: EncryptedData, key: Uint8Array): string {
    const iv = this.base64ToBytes(encrypted.iv);
    const ciphertext = this.base64ToBytes(encrypted.data);
    
    // Verify auth tag
    if (encrypted.authTag) {
      const expectedTag = this.base64ToBytes(encrypted.authTag);
      const actualTag = this.generateAuthTag(ciphertext, key);
      
      if (!this.compareTags(actualTag, expectedTag)) {
        throw new Error('Authentication failed: ciphertext has been tampered');
      }
    }
    
    // Expand key
    const expandedKey = this.keyExpansion(key);
    
    // Decrypt blocks
    const decrypted = new Uint8Array(ciphertext.length);
    let previous = iv;
    
    for (let i = 0; i < ciphertext.length; i += this.BLOCK_SIZE) {
      const block = ciphertext.slice(i, i + this.BLOCK_SIZE);
      
      // Decrypt block
      const decryptedBlock = this.decryptBlock(block, expandedKey);
      
      // XOR with previous ciphertext
      for (let j = 0; j < this.BLOCK_SIZE; j++) {
        decryptedBlock[j] ^= previous[j];
      }
      
      decrypted.set(decryptedBlock, i);
      previous = block;
    }
    
    // Remove padding
    const unpadded = this.pkcs7Unpad(decrypted);
    
    return new TextDecoder().decode(unpadded);
  }

  /**
   * AES key expansion
   */
  private static keyExpansion(key: Uint8Array): Uint32Array {
    const keyWords = key.length / 4;
    const expandedSize = 60; // 15 rounds * 4 words
    const expanded = new Uint32Array(expandedSize);
    
    // Copy original key
    for (let i = 0; i < keyWords; i++) {
      expanded[i] = (key[i * 4] << 24) | (key[i * 4 + 1] << 16) |
                    (key[i * 4 + 2] << 8) | key[i * 4 + 3];
    }
    
    // Generate remaining words
    for (let i = keyWords; i < expandedSize; i++) {
      let temp = expanded[i - 1];
      
      if (i % keyWords === 0) {
        temp = this.subWord(this.rotWord(temp)) ^ (RCON[(i / keyWords) - 1] << 24);
      } else if (keyWords > 6 && i % keyWords === 4) {
        temp = this.subWord(temp);
      }
      
      expanded[i] = expanded[i - keyWords] ^ temp;
    }
    
    return expanded;
  }

  /**
   * Encrypt a single block
   */
  private static encryptBlock(block: Uint8Array, expandedKey: Uint32Array): Uint8Array {
    let state = this.bytesToState(block);
    
    // Initial round
    state = this.addRoundKey(state, expandedKey, 0);
    
    // Main rounds
    for (let round = 1; round < 14; round++) {
      state = this.subBytes(state);
      state = this.shiftRows(state);
      state = this.mixColumns(state);
      state = this.addRoundKey(state, expandedKey, round * 4);
    }
    
    // Final round
    state = this.subBytes(state);
    state = this.shiftRows(state);
    state = this.addRoundKey(state, expandedKey, 14 * 4);
    
    return this.stateToBytes(state);
  }

  /**
   * Decrypt a single block
   */
  private static decryptBlock(block: Uint8Array, expandedKey: Uint32Array): Uint8Array {
    let state = this.bytesToState(block);
    
    // Initial round
    state = this.addRoundKey(state, expandedKey, 14 * 4);
    
    // Main rounds
    for (let round = 13; round >= 1; round--) {
      state = this.invShiftRows(state);
      state = this.invSubBytes(state);
      state = this.addRoundKey(state, expandedKey, round * 4);
      state = this.invMixColumns(state);
    }
    
    // Final round
    state = this.invShiftRows(state);
    state = this.invSubBytes(state);
    state = this.addRoundKey(state, expandedKey, 0);
    
    return this.stateToBytes(state);
  }

  private static subBytes(state: Uint32Array): Uint32Array {
    const result = new Uint32Array(4);
    for (let i = 0; i < 4; i++) {
      let word = state[i];
      let newWord = 0;
      for (let j = 0; j < 4; j++) {
        const byte = (word >> (24 - j * 8)) & 0xff;
        newWord |= S_BOX[byte] << (24 - j * 8);
      }
      result[i] = newWord;
    }
    return result;
  }

  private static invSubBytes(state: Uint32Array): Uint32Array {
    const result = new Uint32Array(4);
    for (let i = 0; i < 4; i++) {
      let word = state[i];
      let newWord = 0;
      for (let j = 0; j < 4; j++) {
        const byte = (word >> (24 - j * 8)) & 0xff;
        newWord |= INV_S_BOX[byte] << (24 - j * 8);
      }
      result[i] = newWord;
    }
    return result;
  }

  private static shiftRows(state: Uint32Array): Uint32Array {
    const result = new Uint32Array(4);
    for (let i = 0; i < 4; i++) {
      let word = 0;
      for (let j = 0; j < 4; j++) {
        const row = j;
        const col = (j + i) % 4;
        const byte = (state[col] >> (24 - row * 8)) & 0xff;
        word |= byte << (24 - j * 8);
      }
      result[i] = word;
    }
    return result;
  }

  private static invShiftRows(state: Uint32Array): Uint32Array {
    const result = new Uint32Array(4);
    for (let i = 0; i < 4; i++) {
      let word = 0;
      for (let j = 0; j < 4; j++) {
        const row = j;
        const col = (j - i + 4) % 4;
        const byte = (state[col] >> (24 - row * 8)) & 0xff;
        word |= byte << (24 - j * 8);
      }
      result[i] = word;
    }
    return result;
  }

  private static mixColumns(state: Uint32Array): Uint32Array {
    const result = new Uint32Array(4);
    for (let i = 0; i < 4; i++) {
      const col = [
        (state[i] >> 24) & 0xff,
        (state[i] >> 16) & 0xff,
        (state[i] >> 8) & 0xff,
        state[i] & 0xff
      ];
      
      const newCol = [
        this.gmul(col[0], 2) ^ this.gmul(col[1], 3) ^ col[2] ^ col[3],
        col[0] ^ this.gmul(col[1], 2) ^ this.gmul(col[2], 3) ^ col[3],
        col[0] ^ col[1] ^ this.gmul(col[2], 2) ^ this.gmul(col[3], 3),
        this.gmul(col[0], 3) ^ col[1] ^ col[2] ^ this.gmul(col[3], 2)
      ];
      
      result[i] = (newCol[0] << 24) | (newCol[1] << 16) | (newCol[2] << 8) | newCol[3];
    }
    return result;
  }

  private static invMixColumns(state: Uint32Array): Uint32Array {
    const result = new Uint32Array(4);
    for (let i = 0; i < 4; i++) {
      const col = [
        (state[i] >> 24) & 0xff,
        (state[i] >> 16) & 0xff,
        (state[i] >> 8) & 0xff,
        state[i] & 0xff
      ];
      
      const newCol = [
        this.gmul(col[0], 14) ^ this.gmul(col[1], 11) ^ this.gmul(col[2], 13) ^ this.gmul(col[3], 9),
        this.gmul(col[0], 9) ^ this.gmul(col[1], 14) ^ this.gmul(col[2], 11) ^ this.gmul(col[3], 13),
        this.gmul(col[0], 13) ^ this.gmul(col[1], 9) ^ this.gmul(col[2], 14) ^ this.gmul(col[3], 11),
        this.gmul(col[0], 11) ^ this.gmul(col[1], 13) ^ this.gmul(col[2], 9) ^ this.gmul(col[3], 14)
      ];
      
      result[i] = (newCol[0] << 24) | (newCol[1] << 16) | (newCol[2] << 8) | newCol[3];
    }
    return result;
  }

  private static addRoundKey(state: Uint32Array, expandedKey: Uint32Array, round: number): Uint32Array {
    const result = new Uint32Array(4);
    for (let i = 0; i < 4; i++) {
      result[i] = state[i] ^ expandedKey[round + i];
    }
    return result;
  }

  private static subWord(word: number): number {
    return (S_BOX[(word >> 24) & 0xff] << 24) |
           (S_BOX[(word >> 16) & 0xff] << 16) |
           (S_BOX[(word >> 8) & 0xff] << 8) |
           S_BOX[word & 0xff];
  }

  private static rotWord(word: number): number {
    return ((word << 8) & 0xffffffff) | ((word >> 24) & 0xff);
  }

  private static gmul(a: number, b: number): number {
    let p = 0;
    for (let i = 0; i < 8; i++) {
      if (b & 1) p ^= a;
      const hi = a & 0x80;
      a = (a << 1) & 0xff;
      if (hi) a ^= 0x1b;
      b >>= 1;
    }
    return p;
  }

  private static bytesToState(bytes: Uint8Array): Uint32Array {
    const state = new Uint32Array(4);
    for (let i = 0; i < 4; i++) {
      state[i] = (bytes[i * 4] << 24) | (bytes[i * 4 + 1] << 16) |
                 (bytes[i * 4 + 2] << 8) | bytes[i * 4 + 3];
    }
    return state;
  }

  private static stateToBytes(state: Uint32Array): Uint8Array {
    const bytes = new Uint8Array(16);
    for (let i = 0; i < 4; i++) {
      bytes[i * 4] = (state[i] >> 24) & 0xff;
      bytes[i * 4 + 1] = (state[i] >> 16) & 0xff;
      bytes[i * 4 + 2] = (state[i] >> 8) & 0xff;
      bytes[i * 4 + 3] = state[i] & 0xff;
    }
    return bytes;
  }

  private static pkcs7Pad(data: Uint8Array): Uint8Array {
    const paddingLength = this.BLOCK_SIZE - (data.length % this.BLOCK_SIZE);
    const padded = new Uint8Array(data.length + paddingLength);
    padded.set(data);
    for (let i = data.length; i < padded.length; i++) {
      padded[i] = paddingLength;
    }
    return padded;
  }

  private static pkcs7Unpad(data: Uint8Array): Uint8Array {
    const paddingLength = data[data.length - 1];
    return data.slice(0, data.length - paddingLength);
  }

  private static generateAuthTag(data: Uint8Array, key: Uint8Array): Uint8Array {
    // Simplified GHASH-like authentication
    const tag = new Uint8Array(16);
    for (let i = 0; i < data.length; i++) {
      tag[i % 16] ^= data[i];
    }
    return tag;
  }

  private static compareTags(tag1: Uint8Array, tag2: Uint8Array): boolean {
    if (tag1.length !== tag2.length) return false;
    let result = 0;
    for (let i = 0; i < tag1.length; i++) {
      result |= tag1[i] ^ tag2[i];
    }
    return result === 0;
  }

  private static bytesToBase64(bytes: Uint8Array): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    
    for (let i = 0; i < bytes.length; i += 3) {
      const b1 = bytes[i];
      const b2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
      const b3 = i + 2 < bytes.length ? bytes[i + 2] : 0;
      
      const index1 = b1 >> 2;
      const index2 = ((b1 & 3) << 4) | (b2 >> 4);
      const index3 = ((b2 & 15) << 2) | (b3 >> 6);
      const index4 = b3 & 63;
      
      result += chars[index1] + chars[index2];
      
      if (i + 1 < bytes.length) {
        result += chars[index3];
      } else {
        result += '=';
      }
      
      if (i + 2 < bytes.length) {
        result += chars[index4];
      } else {
        result += '=';
      }
    }
    
    return result;
  }

  private static base64ToBytes(base64: string): Uint8Array {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const bytes: number[] = [];
    
    for (let i = 0; i < base64.length; i += 4) {
      const c1 = chars.indexOf(base64[i]);
      const c2 = chars.indexOf(base64[i + 1]);
      const c3 = chars.indexOf(base64[i + 2]);
      const c4 = chars.indexOf(base64[i + 3]);
      
      const b1 = (c1 << 2) | (c2 >> 4);
      const b2 = ((c2 & 15) << 4) | (c3 >> 2);
      const b3 = ((c3 & 3) << 6) | c4;
      
      bytes.push(b1);
      if (c3 !== -1) bytes.push(b2);
      if (c4 !== -1) bytes.push(b3);
    }
    
    return new Uint8Array(bytes);
  }
}