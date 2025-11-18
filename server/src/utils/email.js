// SRC/email/email.js
const nodemailer = require("nodemailer");
const path = require("path");
const { htmlToText } = require("html-to-text");
const { ENV } = require("../lib/env");

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.userName = user.userName;
    this.url = url;
    this.from = `Jumia <${ENV.EMAIL_FROM}>`;
  }

  newTransport() {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: ENV.EMAIL_SENDING_ADDRESS,
        pass: ENV.EMAIL_SENDING_PASSWORD, // ✅ use correct env var for password
      },
    });
  }

  async send(templateName, subject) {
      console.log('send hit')

    // 1) Load the template module
    const templatePath = path.join(
      process.cwd(),
      "src",
      "emailTemplate",
      `${templateName}.js`
    );

    // Require the template (must use module.exports)
    const { createEmail } = require(templatePath);

    // 2) Render the HTML
    const html = createEmail(this.userName, this.url);

    // 3) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText(html),
    };

    // 4) Send the email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send("welcome", "Welcomed to the Skill-link App");
    console.log('email sent')
  }
  async sendPasswordReset() {
    await this.send(
      "passwordReset",
      "Your reset password token, (Valid for only 10mins)"
    );
  }
};
