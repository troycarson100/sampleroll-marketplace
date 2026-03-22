/**
 * Optional Resend integration. If RESEND_API_KEY is unset, returns { sent: false }.
 */
export async function sendContractInviteEmail(params: {
  to: string;
  acceptUrl: string;
  title: string;
}): Promise<{ sent: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (!key || !from) {
    return { sent: false };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [params.to],
        subject: `SampleRoll: ${params.title}`,
        html: `
          <p>You have a revenue share agreement to review from SampleRoll.</p>
          <p><strong>${escapeHtml(params.title)}</strong></p>
          <p><a href="${params.acceptUrl}">Review and respond</a></p>
          <p>If the button does not work, paste this URL into your browser:<br/>
          <span style="word-break:break-all">${escapeHtml(params.acceptUrl)}</span></p>
        `,
      }),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      return {
        sent: false,
        error: body.message ?? `Resend HTTP ${res.status}`,
      };
    }
    return { sent: true };
  } catch (e) {
    return {
      sent: false,
      error: e instanceof Error ? e.message : "Email send failed",
    };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
