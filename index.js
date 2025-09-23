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
        ]
    },
});
async function comp(){
    try{
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
    }catch (error) {
        return "0000"
    }
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
    "cedula ",
    "cedula.",
    "rnc.",
    "rnc .",
    "cedula .",
    "cedula: ",
    "cédula  ",
    "cédula. ",
    "Cédula/RNC:",
    "Cédula/RNC: "
]



client.on('message_create', async (message) => {
    console.log((await message.getChat()).id)
    if(message?.body == '' || !message?.body){
        return;
    }
    console.log('Mensaje recibido:', message.body);
    const contact = await message.getContact();
    const numbot = client.info.wid.user
    const msg = message.body.toLocaleLowerCase()
    const eselbot =  contact.id.user !== numbot
    const hasKeyword = PosiblesRrn.some(keyword => msg.includes(keyword));

    if(hasKeyword && eselbot ){
        const { default: rncvalidator } = await import('./rncvalidate.mjs');

        let rnc = null;
        const lines = msg.split('\n').map(line => line.trim()); 
        
        // Encontrar el índice de la línea que contiene la palabra clave
        const lineIndex = lines.findIndex(line => 
            PosiblesRrn.some(keyword => line.includes(keyword))
        );

        if (lineIndex !== -1) {
            const lineWithKeyword = lines[lineIndex];
            const keywordFound = PosiblesRrn.find(keyword => lineWithKeyword.includes(keyword));
            
            let potentialRnc = lineWithKeyword.split(keywordFound)[1].trim();

            if (!potentialRnc && lines.length > lineIndex + 1) {
                potentialRnc = lines[lineIndex + 1].trim();
            }

            if (potentialRnc) {
                const match = potentialRnc.match(/[\d-]+/);
                if (match) {
                    rnc = match[0];
                }
            }
        }
        rnc = rnc?.replace(/[^0-9]/g, '');
        console.log('RNC o Cedula extraído:', rnc);
        
        if(rnc?.length === 9){
            message.reply(`Tipo de documento rnc`)   
        }else if(rnc?.length === 11){
            message.reply('Tipo de documento Cédula')
        }else if(rnc?.length < 9 || rnc?.length > 11){
            message.reply('Por favor verificar ese número de rnc o cédula')
            return;
        }

        let data = await rncvalidator(rnc)

        console.log(data?.status)
        if(data?.status === "SUSPENDIDO"){
            message.reply("El cliente se encuentra suspendido, no podremos registrarlo.")
        }
        if(data?.payscheme){
            message.reply(data?.rnc? `rnc ${data?.rnc}\nnombre o razon social: ${data?.namereason}\nnombre comercial ${data?.comercialname}\ncategoria ${data?.category}\nRegimen de pagos ${data?.payscheme}\nestado ${data?.status}\nActividad Comercial ${data?.economicactivity}\nadministracion local ${data?.admlocal}\nFacturador Electrónico ${data?.facElec}\nLicencias de Comercialización de VHM ${data?.VHM}` : "No se encuentra inscrito como contribuyente")
        }else{
            message.reply(data?.rnc? `Nombre ${data?.namereason}\nRNC o Cédula ${data?.rnc}\nEstado ${data?.status}\nTipo ${data?.comercialname}\nMarca ${data?.category}` : 'No se encuentra inscrito como contribuyente')
        }
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
