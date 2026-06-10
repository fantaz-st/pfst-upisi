import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    ciphers: "SSLv3",
  },
});

export async function sendEmail({ to, subject, html }) {
  await transporter.sendMail({
    from: `"Referada Pomorskog fakulteta u Splitu" <upisi@pfst.hr>`,
    to,
    subject,
    html,
  });
}
