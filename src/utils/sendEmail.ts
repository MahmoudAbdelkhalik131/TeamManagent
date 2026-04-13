import nodemailer from "nodemailer";
import https from "https";

interface options {
  email: string;
  subject: string;
  verifyCode: string;
}

const sendEmail = async (options: options): Promise<void> => {
  // --- OPTION 1: RESEND (Primary for Railway) ---
  if (process.env.RESEND_API_KEY) {
    console.log("Attempting to send email via Resend API...");
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        from: `${process.env.APP_NAME || "TeamManager"} <onboarding@resend.dev>`,
        to: options.email,
        subject: options.subject,
        html: `<div style="background-color:#F6F5F5;padding:2%;margin:2%;"><h1 dir='ltr'>${options.subject}</h1><h2 dir='ltr'>${options.verifyCode}</h2></div>`,
      });

      const reqOptions = {
        hostname: 'api.resend.com',
        path: '/emails',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Length': Buffer.byteLength(data),
        },
      };

      const req = https.request(reqOptions, (res) => {
        let responseData = '';
        res.on('data', (chunk) => { responseData += chunk; });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            console.log("Email sent successfully via Resend.");
            resolve();
          } else {
            console.error("Resend API error:", responseData);
            reject(new Error(`Resend API failed with status ${res.statusCode}: ${responseData}`));
          }
        });
      });

      req.on('error', (error) => {
        console.error("Resend connection error:", error);
        reject(error);
      });

      req.write(data);
      req.end();
    });
  }

  // --- OPTION 2: NODEMAILER (Fallback) ---
  console.log("RESEND_API_KEY not found. Falling back to Nodemailer SMTP...");
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  const emailOptions: any = {
    from: `"${process.env.APP_NAME}" <${process.env.EMAIL_USERNAME}>`,
    to: options.email,
    subject: options.subject,
    text: options.verifyCode,
    html: `<div style="background-color:#F6F5F5;padding:2%;margin:2%;"><h1 dir='ltr'>${options.subject}</h1><h2 dir='ltr'>${options.verifyCode}</h2></div>`,
  };
  await transporter.sendMail(emailOptions);
};

export default sendEmail;
