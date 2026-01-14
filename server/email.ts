// Email service using Resend integration
import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {
    apiKey: connectionSettings.settings.api_key, 
    fromEmail: connectionSettings.settings.from_email
  };
}

async function getUncachableResendClient() {
  const creds = await getCredentials();
  return {
    client: new Resend(creds.apiKey),
    fromEmail: connectionSettings.settings.from_email
  };
}

export async function sendPasswordResetEmail(toEmail: string, resetLink: string) {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    
    const result = await client.emails.send({
      from: fromEmail || 'Phantom RP <noreply@resend.dev>',
      to: toEmail,
      subject: 'إعادة تعيين كلمة المرور - Phantom RP Police',
      html: `
        <div dir="rtl" style="font-family: 'Cairo', 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1a1a2e; color: #ffffff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #3b82f6;">Phantom RP Police</h1>
          </div>
          
          <div style="background-color: #16213e; padding: 30px; border-radius: 10px;">
            <h2 style="margin-bottom: 20px; color: #ffffff;">إعادة تعيين كلمة المرور</h2>
            
            <p style="color: #94a3b8; line-height: 1.8;">
              لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك.
            </p>
            
            <p style="color: #94a3b8; line-height: 1.8;">
              اضغط على الزر أدناه لإعادة تعيين كلمة المرور:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                إعادة تعيين كلمة المرور
              </a>
            </div>
            
            <p style="color: #64748b; font-size: 14px; line-height: 1.8;">
              صلاحية هذا الرابط: 15 دقيقة فقط.
            </p>
            
            <p style="color: #64748b; font-size: 14px; line-height: 1.8;">
              إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد الإلكتروني.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #64748b; font-size: 12px;">
            <p>Phantom RP Police Department</p>
          </div>
        </div>
      `,
    });

    return { success: true, result };
  } catch (error: any) {
    console.error('Failed to send password reset email:', error);
    return { success: false, error: error.message };
  }
}
