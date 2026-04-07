import { Expo, ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";
import { PushTokenService } from "@/services/pushTokenService";

const expo = new Expo();

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export class NotificationService {
  constructor(private readonly pushTokenService: PushTokenService) {}

  async sendToUser(
    userId: string,
    payload: NotificationPayload,
  ): Promise<void> {
    const tokens = await this.pushTokenService.getTokensByUser(userId);
    if (!tokens.length) return;

    const pushTokens = tokens.map((t) => t.token);
    await this.sendMessages(pushTokens, payload);
  }

  async sendToUsers(
    userIds: string[],
    payload: NotificationPayload,
  ): Promise<void> {
    const tokens = await this.pushTokenService.getTokensByUsers(userIds);
    if (!tokens.length) return;

    const pushTokens = tokens.map((t) => t.token);
    await this.sendMessages(pushTokens, payload);
  }

  private async sendMessages(
    pushTokens: string[],
    payload: NotificationPayload,
  ): Promise<void> {
    const messages: ExpoPushMessage[] = [];

    for (const token of pushTokens) {
      if (!Expo.isExpoPushToken(token)) {
        const t = token as string;
        const masked =
          t.length > 8 ? `${t.slice(0, 4)}...${t.slice(-4)}` : "****";
        console.warn(`Invalid Expo push token: ${masked}`);
        continue;
      }

      messages.push({
        to: token,
        sound: "default",
        title: payload.title,
        body: payload.body,
        data: payload.data ?? {},
      });
    }

    if (!messages.length) return;

    const chunks = expo.chunkPushNotifications(messages);

    for (const chunk of chunks) {
      try {
        const tickets: ExpoPushTicket[] =
          await expo.sendPushNotificationsAsync(chunk);

        // Handle errors — remove invalid tokens
        for (let i = 0; i < tickets.length; i++) {
          const ticket = tickets[i];
          if (ticket.status === "error") {
            console.error(
              `Push notification error: ${ticket.message}`,
              ticket.details,
            );
            if (
              ticket.details?.error === "DeviceNotRegistered" &&
              chunk[i]?.to
            ) {
              const tokenStr = Array.isArray(chunk[i].to)
                ? chunk[i].to[0]
                : chunk[i].to;
              if (typeof tokenStr === "string") {
                await this.pushTokenService.deleteTokenByValue(tokenStr);
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to send push notification chunk:", error);
      }
    }
  }
}
