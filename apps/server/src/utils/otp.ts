import bcrypt from 'bcrypt';

export const generateOtp = (): string => {
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
};

export const hashOtp = async (otp: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(otp, saltRounds);
};

export const compareOtp = async (otp: string, hash: string): Promise<boolean> => {
  if (!hash) return false;
  return bcrypt.compare(otp, hash);
};

export const getOtpExpiry = (minutes = 10): Date => {
  return new Date(Date.now() + minutes * 60 * 1000);
};
