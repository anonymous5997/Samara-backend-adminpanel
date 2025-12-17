import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

export const sesClient = new SESClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function sendOtpEmail(email: string, otp: string) {
  const command = new SendEmailCommand({
    Source: process.env.SES_FROM_EMAIL!,
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Data: "Your Samara Login OTP",
      },
      Body: {
        Html: {
          Data: `
            <h2>Samara Login OTP</h2>
            <p>Your OTP is:</p>
            <h1>${otp}</h1>
            <p>This OTP is valid for 10 minutes.</p>
          `,
        },
      },
    },
  });

  await sesClient.send(command);
}
