const { Client, LocalAuth, MessageMedia, RemoteAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const prapido = import ('./pasorapido.js')

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

setInterval(async () => {
    if((await prapido).prapido <= 35000){
        client.sendMessage('18099708194@c.us', 'Se requiere recarga de paso rapido')
    }
}, 1000);

client.on('message', async (message) => {
    const chat = message.getChat()
    message.
    console.log(message)
    const { default: rncvalidator } = await import('./rncvalidate.js');
    if(message.body.includes('rnc: ')){
        message.reply('validando...')
        console.log(message.body.split('rnc: ')[0])
        message.reply(message.body.split('rnc: ')[1].split('/n'))
        message.reply((await rncvalidator((message.body.split('rnc: ')[1].split('/n')).toLocaleString())).toString())
    }
})
client.initialize();
