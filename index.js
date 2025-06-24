const { Client, LocalAuth, MessageMedia, RemoteAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    restartOnAuthFail: true,
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-dev-shm-usage',   
        ],
    },
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});

client.on('message', async (message) => {
    console.log(message.body)
    const { default: rncvalidator } = await import('./rncvalidate.js');
    if(message.body.includes('rnc: ')){
        message.reply('validando...')
        console.log(message.body.split('rnc: ')[0])
        message.reply(message.body.split('rnc: ')[1].split('/n'))
        message.reply((await rncvalidator((message.body.split('rnc: ')[1].split('/n')).toLocaleString())).toString())
    }
})
client.initialize();
