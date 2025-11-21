const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});

exports.sendBulletinNotification = async (parentEmail, studentName, trimester, bulletinUrl) => {
  const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: parentEmail,
    subject: `Nouveau bulletin disponible - ${studentName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">NovaBulletin - Nouveau Bulletin Disponible</h2>
        <p>Bonjour,</p>
        <p>Le bulletin du <strong>${trimester} trimestre</strong> de <strong>${studentName}</strong> est maintenant disponible.</p>
        <p>Vous pouvez le consulter et le télécharger depuis votre espace parent.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${bulletinUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Consulter le Bulletin
          </a>
        </div>
        <p>Cordialement,<br>L'équipe NovaBulletin</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Notification envoyée à ${parentEmail}`);
  } catch (error) {
    console.error('Erreur envoi email:', error);
  }
};

exports.sendPaymentConfirmation = async (parentEmail, studentName, amount, trimester) => {
  const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: parentEmail,
    subject: `Confirmation de paiement - ${studentName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Paiement Confirmé</h2>
        <p>Bonjour,</p>
        <p>Votre paiement des frais scolaires pour <strong>${studentName}</strong> a été confirmé.</p>
        <div style="background-color: #f0f9ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Montant:</strong> ${amount.toLocaleString()} FCFA</p>
          <p><strong>Trimestre:</strong> ${trimester}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        <p>Vous pouvez maintenant accéder aux bulletins de notes de votre enfant.</p>
        <p>Cordialement,<br>L'équipe NovaBulletin</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Erreur envoi email confirmation:', error);
  }
};

exports.sendPasswordReset = async (email, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: email,
    subject: 'Réinitialisation de votre mot de passe NovaBulletin',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Réinitialisation de mot de passe</h2>
        <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
        <p>Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Réinitialiser le mot de passe
          </a>
        </div>
        <p>Ce lien expirera dans 1 heure.</p>
        <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
        <p>Cordialement,<br>L'équipe NovaBulletin</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Erreur envoi email reset:', error);
  }
};