import { Expo, ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";
import { PushTokenService } from "@/services/pushTokenService";

type ExpoPushErrorTicket = Extract<ExpoPushTicket, { status: "error" }>;

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
    const messages = this.buildMessages(pushTokens, payload);
    if (!messages.length) return;

    for (const chunk of expo.chunkPushNotifications(messages)) {
      await this.sendChunk(chunk);
    }
  }

  private buildMessages(
    pushTokens: string[],
    payload: NotificationPayload,
  ): ExpoPushMessage[] {
    return pushTokens.reduce<ExpoPushMessage[]>((acc, token) => {
      if (!Expo.isExpoPushToken(token)) {
        this.logInvalidToken(token);
        return acc;
      }

      acc.push({
        to: token,
        sound: "default",
        title: payload.title,
        body: payload.body,
        data: payload.data ?? {},
      });
      return acc;
    }, []);
  }

  private logInvalidToken(token: string): void {
    const masked =
      token.length > 8 ? `${token.slice(0, 4)}...${token.slice(-4)}` : "****";
    console.warn(`Invalid Expo push token: ${masked}`);
  }

  private async sendChunk(chunk: ExpoPushMessage[]): Promise<void> {
    try {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      await this.handleTicketErrors(chunk, tickets);
    } catch (error) {
      console.error("Failed to send push notification chunk:", error);
    }
  }

  private async handleTicketErrors(
    chunk: ExpoPushMessage[],
    tickets: ExpoPushTicket[],
  ): Promise<void> {
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      if (ticket.status !== "error") continue;

      console.error(
        `Push notification error: ${ticket.message}`,
        ticket.details,
      );
      await this.removeUnregisteredToken(chunk[i], ticket);
    }
  }

  private async removeUnregisteredToken(
    message: ExpoPushMessage | undefined,
    ticket: ExpoPushErrorTicket,
  ): Promise<void> {
    if (ticket.details?.error !== "DeviceNotRegistered" || !message?.to) return;

    const token = Array.isArray(message.to) ? message.to[0] : message.to;
    if (typeof token === "string") {
      await this.pushTokenService.deleteTokenByValue(token);
    }
  }
}
