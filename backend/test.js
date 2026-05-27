const nodemailer = require('nodemailer');
require('dotenv').config();

const testEmail = async () => {
  console.log('📧 Testing email configuration...');
  console.log(`📤 From: ${process.env.EMAIL_USER}`);
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  
  try {
    // Verify connection
    await transporter.verify();
    console.log('✅ Email transporter verified successfully!');
    
    // Send test email to yourself
    const info = await transporter.sendMail({
      from: `"ESSA Nyarugunga School" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: '✅ Email Test - ESSA Nyarugunga System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1a3a5c, #2c5f8a); color: white; padding: 30px; text-align: center; border-radius: 10px;">
            <h2>📧 Email Configuration Successful!</h2>
          </div>
          <div style="padding: 20px; background: #f5f5f5;">
            <p>Your ESSA Nyarugunga School Management System is now ready to send emails.</p>
            <p><strong>Configured Email:</strong> ${process.env.EMAIL_USER}</p>
            <p><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
            <p>✓ Welcome emails to new teachers<br>
            ✓ Newsletter to subscribers<br>
            ✓ Contact form notifications<br>
            ✓ Admission confirmations</p>
          </div>
        </div>
      `
    });
    
    console.log('✅ Test email sent successfully!');
    console.log(`📨 Message ID: ${info.messageId}`);
    console.log(`📬 Check your inbox at: ${process.env.EMAIL_USER}`);
    
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure 2-Step Verification is ENABLED');
    console.log('2. Generate a NEW App Password (not your regular password)');
    console.log('3. Copy the 16-character password exactly as shown');
    console.log('4. Remove any spaces from the password');
    console.log('5. Update .env file with the new password');
  }
};

testEmail();