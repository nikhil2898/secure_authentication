import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
    service : "gmail",
    auth : {
        type : "OAuth2",
        user : process.env.EMAIL_USER,
        clientId : process.env.CLIENT_ID,
        clientSecret : process.env.CLIENT_SECRET,
        refreshToken : process.env.REFRESH_TOKEN
    }
})

transporter.verify( (err,success) => {
    if(err) {
        console.error("Error connecting to email server", err);
    } else {
        console.log("Email server is ready to send message")
    }
})

const sendEmail = async(to, subject, html) => {
    try {
        const info = await transporter.sendMail({
            from : `"Secure Authentication" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        })

        console.log("Email Sent successfully..")
    } catch(error) {
        console.error("Error sending EMail", error);
    }
}

export const sendVerifyEmail = async(userEmail, html) => {
    const subject = "Verify your email for account creation"
    await sendEmail(userEmail,subject,html);
}

export const sendOtpEmail = async(userEmail,html) => {
    const subject = "Otp for verification";
    await sendEmail(userEmail,subject,html);
}