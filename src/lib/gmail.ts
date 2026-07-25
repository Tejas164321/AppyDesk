import { google } from "googleapis";

interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  resumeUrl?: string | null;
  resumeFilename?: string | null;
}

export async function sendEmailViaGmail({
  to,
  subject,
  body,
  resumeUrl,
  resumeFilename = "Resume.pdf",
}: SendEmailParams): Promise<{ messageId: string }> {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

  const isMockMode =
    !clientId ||
    !clientSecret ||
    !refreshToken ||
    clientId.includes("mock") ||
    refreshToken.includes("mock");

  let attachmentBuffer: Buffer | null = null;
  if (resumeUrl) {
    try {
      const res = await fetch(resumeUrl);
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        attachmentBuffer = Buffer.from(arrayBuf);
      }
    } catch (err) {
      console.warn("Could not download resume attachment from Cloudinary:", err);
    }
  }

  if (isMockMode) {
    console.log("=== Gmail API Mock Outbound Send ===");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body Length: ${body.length} chars`);
    console.log(`Attachment: ${attachmentBuffer ? `${resumeFilename} (${attachmentBuffer.length} bytes)` : "None"}`);
    console.log("====================================");
    return { messageId: `mock_msg_${Date.now()}` };
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  const boundary = `====_Boundary_${Date.now()}_====`;
  let rawMessage = [
    `To: ${to}`,
    `Subject: =?utf-8?B?${Buffer.from(subject).toString("base64")}?=`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    `Content-Transfer-Encoding: 8bit`,
    ``,
    body,
    ``,
  ];

  if (attachmentBuffer) {
    const base64Attachment = attachmentBuffer.toString("base64");
    rawMessage.push(
      `--${boundary}`,
      `Content-Type: application/pdf; name="${resumeFilename}"`,
      `Content-Disposition: attachment; filename="${resumeFilename}"`,
      `Content-Transfer-Encoding: base64`,
      ``,
      base64Attachment,
      ``
    );
  }

  rawMessage.push(`--${boundary}--`);

  const encodedMessage = Buffer.from(rawMessage.join("\r\n"))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const response = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encodedMessage,
    },
  });

  return { messageId: response.data.id || `msg_${Date.now()}` };
}
