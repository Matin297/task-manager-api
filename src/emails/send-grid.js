const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = ({
    email,
    name
}) => {
    sgMail.send({
        to: email,
        from: 'asmamir297@gmail.com',
        subject: 'Welcome Email',
        text: `Dear ${name}, Welcome to our app. We hope that you enjoy using it.`
    });
}

const sendGoodbyeEmail = ({
    email,
    name
}) => {
    sgMail.send({
        to: email,
        from: 'asmamir297@gmail.com',
        subject: 'Goodbye Email',
        text: `Dear ${name}, We're sorry to hear you're leaving us. We will be glad to be informed of the reason.`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendGoodbyeEmail
}