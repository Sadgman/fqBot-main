const { Client, LocalAuth, MessageMedia, RemoteAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const prapido = import ('./pasorapido.mjs')
const fs = require('fs');

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

const PosiblesRrn = [
    "rnc: ",
    "rnc ",
    "cedula "
]



client.on('message_create', async (message) => {
    if(message?.body == '' || !message?.body){
        return;
    }
    const contact = await message.getContact();
    const numbot = client.info.wid.user
    const msg = message.body.toLocaleLowerCase()
    const eselbot =  contact.id.user !== numbot

    console.log(PosiblesRrn.includes(msg))

    //&& eselbot
    if(msg.includes("rnc: ") ){
        const { default: rncvalidator } = await import('./rncvalidate.mjs');
        message.reply('validando...')
        
        const position = message.body?.toLocaleLowerCase().split('').join('').split('\n').findIndex(f => f.includes('rnc'))
        const rnc = message.body?.toLocaleLowerCase().split('').join('').split('\n')[position].trim()
        let data = await rncvalidator(rnc)
        
        message.reply(data?.rnc? `rnc ${data?.rnc}\nnombre o razon social: ${data?.namereason}\nnombre comercial ${data?.comercialname}\ncategoria ${data?.category}\nRegimen de pagos ${data?.payscheme}\nestado ${data?.status}\nActividad Comercial ${data?.economicactivity}\nadministracion local ${data?.admlocal}\nFacturador Electrónico ${data?.facElec}\nLicencias de Comercialización de VHM ${data?.VHM}` : "no se encuentra inscrito como contribuyente ")
        // message.reply(message.body.split('rnc: ')?.[1]?.split('\n'))
    }
    if(message.body.toLocaleLowerCase() == 'ping'){
        message.reply('pong')
    }
    if(message.body.toLocaleLowerCase() === ".paso"){
        const res = await (await prapido).prapido()
        message.reply(`El balance del paso rapido es de ${res}`)
    }
})
client.initialize();
