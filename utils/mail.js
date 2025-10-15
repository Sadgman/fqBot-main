import mail from 'nodemailer';

export default async function main(options={
    mensaje,
    uer,
    asunto,
    email,
    password,
    mentions: [''],
    archivo: {
        filename: '',
        content: '',
        encoding: 'base64'
    }
    }) {
    const { mensaje, uer, asunto, email, password, archivo, mentions } = options;

    const transporter = mail.createTransport({
        host: 'mail.farquina.com',
        port: 465,
        secure: true,
        name: 'farquina.com',
        auth: {
            user: uer,
            pass: password
        },
        tls: {
            ciphers: 'SSLv3', 
            rejectUnauthorized: false
        }
    })
    const h = `
    <p>${mensaje}</p>
    <br>
    <p><img src="cid:firma@fq" style='width:360px'></p>
    `;
    await transporter.sendMail({
        from: '"Asistente de Tecnología" <asistente.tecnologia@farquina.com>',
        to: email,
        cc: mentions,
        subject: asunto,
        bcc: uer,
        html: h,
        attachments: [
            { filename: 'firma.png', path: './firma.png', cid: 'firma@fq' },
            archivo
        ]
    })
    return true;
}