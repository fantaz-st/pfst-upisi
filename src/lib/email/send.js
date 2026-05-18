import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, html }) {
  try {
    const { data, error } = await resend.emails.send({
      from: "Pomorski fakultet Split <upisi@pfst.hr>",
      to,
      subject,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return { error };
    }

    return { success: true, data };
  } catch (err) {
    console.error("Send email error:", err);
    return { error: err.message };
  }
}
