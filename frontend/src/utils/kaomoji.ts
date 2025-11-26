// Kaomoji faces for avatar placeholders
export const AVATAR_KAOMOJIS = [
  '(◕‿◕)',
  '(｡◕‿◕｡)',
  '(◠‿◠)',
  '(◕ᴗ◕)',
  '(◕‿‿◕)',
  '(◕◡◕)',
  '(◔‿◔)',
  '(◕‿-)',
  '(◠ω◠)',
  '(◕ω◕)',
  '(◕u◕)',
  '(◕ᵕ◕)',
  '(°‿°)',
  '(^‿^)',
  '(^_^)',
  '(◡‿◡)',
  '(◠◡◠)',
  '(◕‿◕✿)',
  '(◕ᴥ◕)',
  '(◕ˇ◕)',
  '(◕▿◕)',
  '(ᵔᴥᵔ)',
  '(◠ᴥ◠)',
  '(◕.◕)',
  '(⌒‿⌒)',
] as const;

/**
 * Get a deterministic kaomoji based on a string (user ID).
 * This ensures the same user always gets the same kaomoji.
 */
export function getKaomojiForUser(userId: string): string {
  // Simple hash function to convert string to number
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use absolute value and modulo to get index
  const index = Math.abs(hash) % AVATAR_KAOMOJIS.length;
  return AVATAR_KAOMOJIS[index];
}

