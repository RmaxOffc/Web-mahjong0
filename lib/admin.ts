// Daftar Discord user ID yang boleh ubah persentase/payout, dipisah koma
// di environment variable ADMIN_DISCORD_IDS, contoh:
// ADMIN_DISCORD_IDS="123456789012345678,987654321098765432"
export function isAdminDiscordId(discordId: string | null | undefined): boolean {
  if (!discordId) return false;
  const list = (process.env.ADMIN_DISCORD_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.includes(discordId);
}
