import nodemailer from "nodemailer";


interface options {
  email: string;
  subject: string;
  verifyCode: string;
}

const sendEmail = async (options: options): Promise<void> => {
  // --- PRIORITY: NODEMAILER (Gmail SMTP) ---
  console.log("Attempting to send email via Nodemailer (Gmail SMTP)...");
  
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
    from: `"${process.env.APP_NAME || "TeamManager"}" <${process.env.EMAIL_USERNAME}>`,
    to: options.email,
    subject: options.subject,
    text: `Your verification code is: ${options.verifyCode}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #333; text-align: center;">${process.env.APP_NAME || "TeamManager"}</h2>
        <hr style="border: 0; border-top: 1px solid #eee;" />
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin-top: 20px;">
          <h3 style="color: #555; margin-top: 0;">${options.subject}</h3>
          <p style="font-size: 16px; color: #666;">Use the verification code below:</p>
          <div style="background-color: #ffffff; padding: 15px; border: 1px solid #ddd; border-radius: 5px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #007bff;">
            ${options.verifyCode}
          </div>
        </div>
        <p style="font-size: 12px; color: #999; text-align: center; margin-top: 20px;">
          This is an automated email. Please do not reply.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(emailOptions);
    console.log("Email sent successfully via Nodemailer.");
  } catch (error) {
    console.error("Nodemailer Error:", error);

    // Fallback to Resend ONLY if key is present and Nodemailer fails
    if (process.env.RESEND_API_KEY) {
      console.log("Attempting to fallback to Resend API...");
      // ... (Rest of Resend logic if needed, but for now we skip to keep it simple)
      throw error; // Or handle fallback
    } else {
      throw error;
    }
  }
};

export default sendEmail;
