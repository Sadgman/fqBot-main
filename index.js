const { Client, LocalAuth, MessageMedia, RemoteAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const prapido = import ('./pasorapido.js')
const fs = require('fs')

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

client.on('ready', async () => {
    console.log('Client is ready!');
    //hour * minute * milisecond
    //1 * 60 * 60000
    let time = fs.readFileSync('time.txt')
    if(fs.readFileSync('time.txt').toString() < 1){
        fs.writeFileSync("time.txt", `${(12 * 60) * 60000}`)
        time = (12 * 60) * 60000
    }
    console.log(time)
    console.log(setInterval(async () => {
        for(let i=0;i<=2; i++){
            const res = await (await prapido).prapido()
            if( res <= 35000){
                client.sendMessage('18092711144@c.us', 'Se requiere recarga de paso rapido')
            }
        }
    }, time))
});

client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});



client.on('message', async (message) => {
    const chat = message.getChat()
    const { default: rncvalidator } = await import('./rncvalidate.js');
    if(message.body.includes('rnc: ')){
        message.reply('validando...')
        console.log(message.body.split('rnc: ')[0])
        message.reply(message.body.split('rnc: ')[1].split('/n'))
        message.reply((await rncvalidator((message.body.split('rnc: ')[1].split('/n')).toLocaleString())).toString())
    }
    if(message.body.toLocaleLowerCase() == 'ping'){
        message.reply('pong')
    }
})
client.initialize();
