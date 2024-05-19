const nodemailer = require("nodemailer");
var smtpTransport = require("nodemailer-smtp-transport");

const mailSender = async (email, title, body) => {
  try {
    let transporter = nodemailer.createTransport(
      smtpTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        auth: {
          user: "official.ecotrade@gmail.com",
          pass: "mdit epyx rzcy yual",
        },
      })
    );

    let info = await transporter.sendMail({
      from: "Eco-TradeHub",
      to: `${email}`,
      subject: `${title}`,
      html: `${body}`,
    });

    console.log("Info is here: ", info);
    return info;
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = mailSender;
