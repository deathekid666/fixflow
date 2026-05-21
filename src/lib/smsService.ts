// src/lib/smsService.ts
// SMS service — mock by default, swap provider when ready.

export interface SmsProvider {
  send(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

class MockSmsProvider implements SmsProvider {
  async send(to: string, message: string) {
    // Logs to console in dev. Replace with real provider in production.
    console.log(`[SMS MOCK] To: ${to} | Message: ${message}`);
    return { success: true, messageId: `mock_${Date.now()}` };
  }
}

// ── Swap here when you have real credentials ──────────────────────────────────
// import twilio from "twilio";
// class TwilioProvider implements SmsProvider {
//   private client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
//   async send(to: string, message: string) {
//     try {
//       const msg = await this.client.messages.create({
//         body: message,
//         from: process.env.TWILIO_PHONE_NUMBER!,
//         to,
//       });
//       return { success: true, messageId: msg.sid };
//     } catch (err: any) {
//       return { success: false, error: err.message };
//     }
//   }
// }

function getProvider(): SmsProvider {
  return new MockSmsProvider();
  // return new TwilioProvider(); // ← switch to this when ready
}

export const smsService = {
  send: (to: string, message: string) => getProvider().send(to, message),

  buildDeliveryMessage(customerName: string, orderNumber: string, deviceModel: string): string {
    return `Bonjour ${customerName}, votre réparation (${deviceModel} — #${orderNumber}) est prête. Merci de choisir FixFlow !`;
  },
};
