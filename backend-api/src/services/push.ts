// Sends Expo push notifications via the Expo Push API (no extra npm dependency).
// Best-effort: if delivery fails, we log and continue — never throw.

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function sendPushNotification(message: PushMessage): Promise<void> {
  if (!message.to || !message.to.startsWith("ExponentPushToken[")) return;
  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        to: message.to,
        title: message.title,
        body: message.body,
        data: message.data ?? {},
        sound: "default",
        priority: "high",
      }),
    });
  } catch (err) {
    console.error("[Push] Failed to send notification:", err);
  }
}

export async function sendPushToUser(
  pushToken: string | undefined | null,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  if (!pushToken) return;
  await sendPushNotification({ to: pushToken, title, body, data });
}
