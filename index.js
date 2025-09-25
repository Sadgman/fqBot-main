const { Client, LocalAuth, MessageMedia, RemoteAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const prapido = import ('./pasorapido.mjs')
const Fcc = require('./utils/ia/FormatClientConvert.js')
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
//  Quitar acentos
function qa(palabra){
    
    const palabras_raras = ["á", "é", "í", "ó", "ú", "ñ", "ü"];
    const letras_normales = ["a", "e", "i", "o", "u", "n", "u"];
    for (let i = 0; i < palabras_raras.length; i++) {
        palabra = palabra.replace(new RegExp(palabras_raras[i], 'g'), letras_normales[i]);
    }
    return palabra;
}

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

const PosiblesRrn = [,
    "rnc",
    "cedula",
    "Cedula/RNC",
]



client.on('message_create', async (message) => {
    console.log((await message.getChat()).id)
    if(message?.body == '' || !message?.body){
        return;
    }
    const contact = await message.getContact();
    console.log(`Mensaje de ${contact?.name} Mensaje ${message?.body}`);
    const quotedMsg = message.hasQuotedMsg ? await message.getQuotedMessage() : null;
    const numbot = client.info.wid.user
    const msg = qa(message.body.toLocaleLowerCase())
    let eselbot =  contact.id.user !== numbot
    if (msg.includes('byalastor')) eselbot = true;
    const hasKeyword = PosiblesRrn?.some(keyword => msg?.includes(keyword?.toLocaleLowerCase()));
    async function idStract(msgg){
        let rnc = null;
        const lines = msgg?.split('\n')?.map(line => line?.trim()); 
        
        // Encontrar el índice de la línea que contiene la palabra clave
        const lineIndex = lines?.findIndex(line => 
            PosiblesRrn?.some(keyword => line?.includes(keyword))
        );

        if (lineIndex !== -1) {
            const lineWithKeyword = lines?.[lineIndex];
            const keywordFound = PosiblesRrn?.find(keyword => lineWithKeyword?.includes(keyword));
            
            let potentialRnc = lineWithKeyword?.split(keywordFound)[1]?.trim();

            if (!potentialRnc && lines?.length > lineIndex + 1) {
                potentialRnc = lines?.[lineIndex + 1]?.trim();
            }

            if (potentialRnc) {
                const match = potentialRnc?.match(/[\d-]+/);
                if (match) {
                    rnc = match[0];
                }
            }
        }
        if(rnc?.length < 4){
            rnc = null;
        }
        return rnc;
    }

    if(hasKeyword && eselbot ){

        let rnc = await idStract(msg)
        console.log(rnc)

        if(!rnc){
            const iaresp = await Fcc.default(msg);
            rnc = await idStract(iaresp);
            if(!rnc) return;
        }
        client.sendMessage('18098972404@c.us', `Hay un nuevo cliente para crear favor de verificar`)
        //client.sendMessage('18092711144@c.us', `Hay un nuevo cliente para crear favor de verificar`)
        rnc = rnc?.replace(/[^0-9]/g, '');
    
        if(rnc?.length < 9 || rnc?.length > 11){
            message.reply('Por favor verificar ese número de rnc o cédula')
            return;
        }
        const { default: rncvalidator } = await import('./rncvalidate.mjs');
        let data = await rncvalidator(rnc)

        if(data?.status === "SUSPENDIDO"){
            message.reply("El cliente se encuentra suspendido, no podremos registrarlo.")
            return;
        }
        if(rnc?.length === 9){
            message.reply(`Tipo de documento rnc`)   
        }else if(rnc?.length === 11){
            message.reply('Tipo de documento Cédula')
        }
        if(!(data?.rnc)){
            message.reply("No se encuentra inscrito como contribuyente, Favor de verificar el RNC o Cédula")
            return;
        }
        if(data?.payscheme){
            message.reply(`RNC ${data?.rnc}\nnombre o razon social: ${data?.namereason}\nnombre comercial ${data?.comercialname}\ncategoria ${data?.category}\nRegimen de pagos ${data?.payscheme}\nestado ${data?.status}\nActividad Comercial ${data?.economicactivity}\nadministracion local ${data?.admlocal}\nFacturador Electrónico ${data?.facElec}\nLicencias de Comercialización de VHM ${data?.VHM}`)
        }else{
            message.reply(`Nombre ${data?.namereason}\nRNC o Cédula ${data?.rnc}\nEstado ${data?.status}\nTipo ${data?.comercialname}\nMarca ${data?.category}`)
        }

    }
    //Para darle formato al cliente
    if(msg == '.f' && message.hasQuotedMsg){
        const msgq = quotedMsg.body.toLocaleLowerCase();
        const iaresp = await Fcc.default(msgq);
        if(iaresp) message.reply(iaresp);
    }
    if(msg == 'ping'){
        message.reply('pong')
    }
    if(msg === ".paso"){
        const res = await (await prapido).prapido()
        message.reply(`El balance del paso rapido es de ${res}`)
    }
})
client.initialize();
