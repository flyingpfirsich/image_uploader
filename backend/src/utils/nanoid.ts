import { nanoid, customAlphabet } from 'nanoid';

// Standard nanoid for IDs
export const generateId = () => nanoid(21);

// Custom alphabet for invite codes (uppercase, no confusing chars)
const inviteAlphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const generateInviteCode = customAlphabet(inviteAlphabet, 8);

export { generateInviteCode };


