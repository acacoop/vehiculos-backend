/**
 * Manual stub for expo-server-sdk.
 * The real package ships as native ESM (import.meta.url) and cannot be
 * transformed by ts-jest. Jest will map imports to this file via
 * moduleNameMapper so tests never load the real package.
 */

export class Expo {
  static isExpoPushToken(_token: unknown): _token is string {
    return false;
  }

  chunkPushNotifications(_messages: ExpoPushMessage[]): ExpoPushMessage[][] {
    return [_messages];
  }

  async sendPushNotificationsAsync(
    _chunk: ExpoPushMessage[],
  ): Promise<ExpoPushTicket[]> {
    return [];
  }

  async getPushNotificationReceiptsAsync(
    _receiptIds: string[],
  ): Promise<Record<string, unknown>> {
    return {};
  }

  chunkPushNotificationReceiptIds(_receiptIds: string[]): string[][] {
    return [_receiptIds];
  }
}

export type ExpoPushMessage = {
  to: string | string[];
  sound?: string;
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
};

export type ExpoPushTicket =
  | { status: "ok"; id: string }
  | {
      status: "error";
      message: string;
      details?: { error?: string };
    };
