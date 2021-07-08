const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = 'Ahmed Samir, Natours CTO <cto@natour.com>';
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  //Send the actual email
  async send(template, subject) {
    // 1) Render HTML based on the template

    const html = pug.renderFile(`${__dirname}/../views/emails/${template}`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });

    // 2) Define the email options
    const emailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.htmlToText(html),
    };

    // 3) Create transport and send email
    await this.newTransport().sendMail(emailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to Natours family');
  }
};
