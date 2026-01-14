// Discord integration for verifying server membership
// Uses Discord Bot Token for member verification

import { Client, GatewayIntentBits } from 'discord.js';

// Phantom RP Discord Server ID
const DISCORD_SERVER_ID = "1446611384488955998";

// Check if a Discord user is a member of the Phantom RP server
export async function verifyDiscordMembership(discordId: string): Promise<{ isMember: boolean; username?: string; error?: string }> {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  
  if (!botToken) {
    console.error("DISCORD_BOT_TOKEN not found in environment variables");
    return { isMember: false, error: "Bot Token غير مُعد" };
  }

  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
  });

  try {
    await client.login(botToken);
    
    const guild = await client.guilds.fetch(DISCORD_SERVER_ID);
    if (!guild) {
      await client.destroy();
      return { isMember: false, error: "لم يتم العثور على السيرفر" };
    }

    try {
      const member = await guild.members.fetch(discordId);
      const username = member.user.tag;
      await client.destroy();
      return { isMember: true, username };
    } catch (memberError: any) {
      await client.destroy();
      if (memberError.code === 10007) { // Unknown Member
        return { isMember: false, error: "هذا الحساب غير موجود في سيرفر Phantom RP" };
      }
      if (memberError.code === 10013) { // Unknown User
        return { isMember: false, error: "معرف الديسكورد غير صحيح" };
      }
      return { isMember: false, error: "حدث خطأ في التحقق من العضوية" };
    }
  } catch (error: any) {
    console.error("Discord verification error:", error);
    if (error.code === 'TokenInvalid') {
      return { isMember: false, error: "Bot Token غير صالح" };
    }
    if (error.code === 50001) { // Missing Access
      return { isMember: false, error: "البوت ليس لديه صلاحية الوصول للسيرفر" };
    }
    return { isMember: false, error: "حدث خطأ في الاتصال بالديسكورد" };
  }
}
