// lib/auth/email.ts

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

interface ApprovalEmailParams {
  ownerEmail: string
  secretarioNome: string
  secretarioEmail: string
  approvalToken: string
  appUrl: string
}

export async function sendApprovalEmail({
  ownerEmail,
  secretarioNome,
  secretarioEmail,
  approvalToken,
  appUrl,
}: ApprovalEmailParams): Promise<void> {
  const approvalLink = `${appUrl}/aprovar?token=${approvalToken}`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.NODE_ENV === 'production'
        ? 'AgendaVet <noreply@seudominio.com>'
        : 'AgendaVet <onboarding@resend.dev>',
      to: ownerEmail,
      subject: `Novo cadastro aguardando aprovação — ${secretarioNome}`,
      html: `
        <h2>Novo secretário aguardando aprovação</h2>
        <p><strong>Nome:</strong> ${escapeHtml(secretarioNome)}</p>
        <p><strong>Email:</strong> ${escapeHtml(secretarioEmail)}</p>
        <p>Clique no botão abaixo para revisar e aprovar o acesso:</p>
        <a href="${approvalLink}" style="
          display: inline-block;
          padding: 12px 24px;
          background: #059669;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
        ">Aprovar Acesso</a>
        <p style="color: #666; font-size: 12px;">
          Este link expira em 72 horas.
        </p>
      `,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Falha ao enviar email: ${err}`)
  }
}
