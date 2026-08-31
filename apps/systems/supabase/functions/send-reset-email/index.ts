import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, resetLink } = await req.json()

    if (!email || !resetLink) {
      return new Response(
        JSON.stringify({ error: 'Email and resetLink are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get SMTP configuration from environment
    const smtpHost = Deno.env.get('SMTP_HOST')
    const smtpPort = Deno.env.get('SMTP_PORT')
    const smtpSecure = Deno.env.get('SMTP_SECURE') === 'true'
    const smtpUser = Deno.env.get('SMTP_USER')
    const smtpPass = Deno.env.get('SMTP_PASS')
    const emailFrom = Deno.env.get('EMAIL_FROM') || 'noreply@upgoma.org'

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      console.error('SMTP configuration not complete')
      return new Response(
        JSON.stringify({ error: 'Email service not configured properly' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build email content
    const emailContent = `
From: ${emailFrom}
To: ${email}
Subject: Réinitialisation de votre mot de passe - Université Polytechnique de Goma
MIME-Version: 1.0
Content-Type: text/html; charset=UTF-8

<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Réinitialisation du mot de passe</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #1e40af; margin-bottom: 10px;">Université Polytechnique de Goma</h1>
    <p style="color: #666; font-size: 14px;">Système Académique</p>
  </div>
  
  <div style="background: #f3f4f6; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
    <h2 style="color: #1e40af; margin-top: 0;">Réinitialisation de votre mot de passe</h2>
    <p>Bonjour,</p>
    <p>Vous avez demandé la réinitialisation de votre mot de passe pour le système académique de l'Université Polytechnique de Goma.</p>
    <p>Cliquez sur le bouton ci-dessous pour définir votre nouveau mot de passe :</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetLink}" style="display: inline-block; background: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
        Réinitialiser mon mot de passe
      </a>
    </div>
    
    <p style="font-size: 14px; color: #666;">Ou copiez et collez ce lien dans votre navigateur :</p>
    <p style="font-size: 12px; word-break: break-all; color: #1e40af;">${resetLink}</p>
  </div>
  
  <div style="background: #fef3c7; padding: 15px; border-radius: 5px; margin-bottom: 20px; font-size: 13px;">
    <p style="margin: 0;"><strong>⚠️ Important :</strong></p>
    <ul style="margin: 10px 0; padding-left: 20px;">
      <li>Ce lien expire dans 1 heure</li>
      <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
      <li>Ne partagez jamais ce lien avec personne</li>
    </ul>
  </div>
  
  <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 12px; color: #666; text-align: center;">
    <p>Cet email a été envoyé automatiquement par le système académique UPG.</p>
    <p>© 2024 Université Polytechnique de Goma. Tous droits réservés.</p>
  </div>
</body>
</html>
    `.trim()

    // Send email via SMTP using Deno's native TCP socket
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
    
    const conn = await Deno.connect({
      hostname: smtpHost,
      port: parseInt(smtpPort),
      transport: 'tcp',
    })

    const send = async (data: string) => {
      await conn.write(encoder.encode(data + '\r\n'))
      const response = decoder.decode(await conn.read(new Uint8Array(1024)))
      console.log('SMTP Response:', response)
      return response
    }

    await send(`EHLO ${smtpHost}`)
    if (smtpSecure) {
      await send('STARTTLS')
      // Note: For production, you'd need proper TLS handling here
      // For simplicity with Brevo, we can use the non-secure port 587
    }
    await send(`AUTH LOGIN`)
    await send(btoa(smtpUser))
    await send(btoa(smtpPass))
    await send(`MAIL FROM: ${emailFrom}`)
    await send(`RCPT TO: ${email}`)
    await send('DATA')
    await send(emailContent)
    await send('.')
    await send('QUIT')

    conn.close()

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error in send-reset-email function:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to send email' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
