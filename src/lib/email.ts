import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.EMAIL_FROM ?? 'PeopleView <noreply@peopleview.app>';

const SUBJECTS: Record<string, string> = {
  EMAIL_VERIFY: 'Vérifiez votre adresse email — PeopleView',
  PASSWORD_RESET: 'Réinitialisation de votre mot de passe — PeopleView',
  TWO_FACTOR: 'Code de connexion — PeopleView',
  DELETE_ACCOUNT: 'Confirmation de suppression de compte — PeopleView',
};

const MESSAGES: Record<string, string> = {
  EMAIL_VERIFY: 'Entrez ce code pour vérifier votre adresse email et activer votre compte.',
  PASSWORD_RESET: 'Entrez ce code pour réinitialiser votre mot de passe.',
  TWO_FACTOR: 'Votre code de connexion à double facteur.',
  DELETE_ACCOUNT: 'Entrez ce code pour confirmer la suppression définitive de votre compte.',
};

function buildHtml(code: string, purpose: string): string {
  const message = MESSAGES[purpose] ?? 'Votre code de vérification.';
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#1e293b;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
    <div style="background:linear-gradient(135deg,#6366f1 0%,#7c3aed 100%);padding:28px 36px;">
      <h1 style="color:white;margin:0;font-size:20px;font-weight:700;letter-spacing:-0.3px;">PeopleView</h1>
    </div>
    <div style="padding:36px;">
      <p style="color:#e2e8f0;font-size:15px;line-height:1.65;margin:0 0 28px;">${message}</p>
      <div style="background:#0f172a;border-radius:10px;padding:28px 24px;text-align:center;margin:0 0 28px;border:1px solid rgba(99,102,241,0.3);">
        <span style="font-size:40px;font-weight:800;letter-spacing:14px;color:#a5b4fc;font-variant-numeric:tabular-nums;">${code}</span>
      </div>
      <p style="color:#94a3b8;font-size:13px;margin:0 0 6px;">Ce code est valable pendant <strong style="color:#e2e8f0;">10 minutes</strong>.</p>
      <p style="color:#64748b;font-size:12px;margin:0;">Si vous n'avez pas demandé ce code, ignorez cet email en toute sécurité.</p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendOtpEmail(to: string, code: string, purpose: string): Promise<void> {
  const subject = SUBJECTS[purpose] ?? 'Code de vérification — PeopleView';
  const html = buildHtml(code, purpose);

  if (!resend) {
    console.log(
      `\n[EMAIL DEV — ${purpose}]\nTo: ${to}\nSubject: ${subject}\nCode: ${code}\n`
    );
    return;
  }

  await resend.emails.send({ from: FROM, to, subject, html });
}
