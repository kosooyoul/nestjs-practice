import * as base64 from 'base64-js';
import * as uuidBase64 from 'uuid-base64';
import * as uuid from 'uuid';
import * as md5 from 'md5';

export default class GlobalStringUtils {
  static toBase64(text: string): string {
    const buffer = new ArrayBuffer(text.length);
    const bytes = new Uint8Array(buffer);
    const length = text.length;
    for (let i = 0; i != length; ++i) {
      bytes[i] = text.charCodeAt(i) & 0xff;
    }
    return base64.fromByteArray(bytes);
  }

  static fromBase64(base64: string): string {
    return Buffer.from(base64, 'base64').toString();
  }

  static generateNumericCode(length: number): string {
    let code = '';
    for (let i = 0; i < length; i++) {
      code += Math.floor(Math.random() * 10);
    }
    return code;
  }

  static generateUuid(): string {
    return uuidBase64.encode(uuid.v4());
  }

  static hashObject(obj: any): string {
    return md5(JSON.stringify(obj));
  }

  static extractHashTags(text: string): string[] {
    const regex = /(^[\s\n]*|[\s\n])#([\p{Pc}\p{N}\p{L}\p{Mn}]{1,50})([\s\n]|$)/gmu;
    const matches = text.match(regex) || [];
    const tags = matches.map(t => t.trim().slice(1));
    return tags;
  }

  static extractUrls(text: string): string[] {
    const regex = /(^[\s\n]*|[\s\n])(http|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:\/~+#-]*[\w@?^=%&\/~+#-])/gmu;
    const matches = text.match(regex) || [];
    const urls = matches.map(t => t.trim());
    return urls;
  }

  static ellipsis(text: string, length: number): string {
    return text.length > length ? text.slice(0, length) + '...' : text;
  }
}