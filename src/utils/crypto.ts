import CryptoJS from 'crypto-js';
import { nanoid } from 'nanoid';
import config from '../config/env';

const SECRET_KEY = config.jwt.secret;

export const encrypt = (text: string): string => {
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
};

export const decrypt = (encryptedText: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedText, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

export const generateApiKey = (): string => {
  return nanoid(config.security.apiKeyLength);
};

export const hashPassword = async (password: string): Promise<string> => {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(password, config.security.bcryptRounds);
};

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(password, hash);
};
