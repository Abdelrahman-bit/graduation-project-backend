import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config({
   path: './config.env',
});

const transporter = nodemailer.createTransport({
   host: 'smtp.gmail.com',
   port: 465,
   secure: true,
   service: 'gmail',
   auth: {
      user: process.env.NODEMAILER_USER_EMAIL,
      pass: process.env.NODEMAILER_USER_PASS,
   },
});

async function sendEmail(options) {
   const mailOptions = {
      from: '"Support Team" E-tutor Website',
      to: options.email,
      subject: options.subject,
      text: options.text,
      html: options.html,
   };

   await transporter.sendMail(mailOptions);
   console.log('✅ Email sent to:', options.email);
}

export default sendEmail;
