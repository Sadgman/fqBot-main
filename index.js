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

async function comp(){
    const res = await (await prapido).prapido()
    if( res <= 35000){
        client.sendMessage('18092711144@c.us', `Se requiere recarga de paso rapido saldo actual de ${res}`)
    }
    setInterval(async () => {
        for(let i=0;i<=2; i++){
            const res = await (await prapido).prapido()
            console.log(res <= 35000? `Se require recarga  saldo actual ${res}`: false)
            if( res <= 35000){
                client.sendMessage('18092711144@c.us', `Se requiere recarga de paso rapido saldo actual de ${res}`)
            }
        }
    }, 1200000)
}

client.on('ready', async () => {
    console.log('Client is ready!');
    await comp();
});

client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});



client.on('message_create', async (message) => {
    if(message?.body == '' || !message?.body){
        return;
    }
    const chat = message.getChat()
    const { default: rncvalidator } = await import('./rncvalidate.js');
    if(message.body.includes('rnc: ')){
        message.reply('validando...')
        const data = await rncvalidator(message.body?.split('rnc: ')[1]?.split('\n').toString())
        message.reply(`rnc ${data?.rnc}\nnombre o razon social: ${data?.namereason}\nnombre comercial ${data?.comercialname}\ncategoria ${data?.category}\nRegimen de pagos ${data?.payscheme}\nestado ${data?.status}\nActividad Comercial ${data?.economicactivity}\nadministracion local ${data?.admlocal}\nFacturador Electrónico ${data?.facElec}\nLicencias de Comercialización de VHM ${data?.VHM}`)
        // message.reply(message.body.split('rnc: ')?.[1]?.split('\n'))
    }
    if(message.body.toLocaleLowerCase() == 'ping'){
        message.reply('pong')
    }
})
client.initialize();
