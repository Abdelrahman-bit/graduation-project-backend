import nodemailer from 'nodemailer';

const sendEmail = async (emailOptions) => {
   // 1) Create an Email Transporter
   const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      auth: {
         user: process.env.MAIL_USER,
         pass: process.env.MAIL_PASS,
      },
   });

   // 2) Configure mail options
   const mailOptions = {
      from: 'LMS System <no-reply@lms.com>',
      to: emailOptions.email,
      subject: emailOptions.subject,
      text: emailOptions.message,
   };

   // 3) Send actual Email
   try {
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully!');
      console.log('Message ID:', info.messageId);
   } catch (err) {
      console.error('❌ Error sending email:', err);
   }
};

export default sendEmail;
