const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

resend.emails.send({
    from: 'onboarding@resend.dev',
    to: 'llh9@yahoo.com',
    subject: 'Hello World',
    html: '<p>Congrats on sending your <strong>first email</strong>!</p>'
}).then((res, req) => {
    console.log('success from outside of the function')
    console.log(`Response: ${res}`)
    console.log(`Request: ${req}`)
}).catch(error => console.log(error()))

export default resend;