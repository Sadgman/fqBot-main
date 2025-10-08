const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const prapido = import ('./pasorapido.mjs')
const Fcc = require('./utils/ia/FormatClientConvert.js')
const fs = require('fs');
const bf = require('./bfclient.js');
const { default: ultimoCliente } = require('./utils/excel/ultimoCliente.js');
const FCclient = require('./utils/ia/FormatClientCreate.js')
const dotenv = require('dotenv');
dotenv.config();

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
                if( res <= 40000){
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

const unrestrictedNumers = [
    '18092711144',
    '18098972404'
]

client.on('message_create', async (message) => {
    if(message?.body == '' || !message?.body){
        return;
    }
    const chat = await message.getChat()

    const contact = await message?.getContact();
    console.log(`Mensaje de ${contact?.name} En el chat de ${chat.id.user} Mensaje ${message?.body}`);
    const quotedMsg = message?.hasQuotedMsg ? await message?.getQuotedMessage() : null;
    const msgq = quotedMsg?.body?.toLocaleLowerCase();
    const numbot = client?.info?.wid.user
    let msg = qa(message.body.toLocaleLowerCase())
    let eselbot =  contact?.id?.user !== numbot
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

    if(
        hasKeyword && eselbot && (chat.id?.user === '18093194627-1614002478' ||
        unrestrictedNumers?.includes(contact?.id?.user))
    ){
        let rnc = await idStract(msg)

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
            await message.reply(`Tipo de documento rnc`)   
        }else if(rnc?.length === 11){
            await message.reply('Tipo de documento Cédula')
        }
        if(!(data?.rnc)){
            await message.reply("No se encuentra inscrito como contribuyente, favor de verificar el RNC o cédula")
            return;
        }
        if(data?.payscheme){
            message.reply(`RNC ${data?.rnc}\nnombre o razon social: ${data?.namereason}\nnombre comercial ${data?.comercialname}\ncategoria ${data?.category}\nRegimen de pagos ${data?.payscheme}\nestado ${data?.status}\nActividad Comercial ${data?.economicactivity}\nadministracion local ${data?.admlocal}\nFacturador Electrónico ${data?.facElec}\nLicencias de Comercialización de VHM ${data?.VHM}`)
        }else{
            message.reply(`Nombre ${data?.namereason}\nRNC o Cédula ${data?.rnc}\nEstado ${data?.status}\nTipo ${data?.comercialname}\nMarca ${data?.category}`)
        }

    }
    //Crear cliente
    if(msg === '.c' && message.hasQuotedMsg && unrestrictedNumers.includes(contact.id.user)){
        message.reply('creando cliente...')
        let msdg = await FCclient.default(await qa(msgq))
        msdg = await qa(msdg);

        const formato = msdg.split('|')
        switch(formato[6]){
            case 'r':
                formato[6] = 'RNC'
                break;
            case 'c':
                formato[6] = 'CEDULA'
                break;
            default:
                formato[6] = 'OTRO'
                break;
        }
        // formato para crear cliente
        // crear|codcli|rnc|razonsocial|direccion1|direccion2|telefono1|telefono2|tipoid(rnc,cedula,otro)|pais|propietario|sector
        const rs = formato[1].trim().toLocaleUpperCase();
        const ult = await ultimoCliente()
        const codcli = await ult.find(cod => {return cod.toString()[0] == rs[0]});
        bf.default({
            Codcli: codcli,
            RNC: formato[0],
            RazonSocial: formato[1] || "",
            Direccion1: formato[2] || "",
            Direccion2: formato[3] || "",
            Telefono1: formato[4] || "",
            Telefono2: formato[5] || "",
            TipoID: formato[0].length === 9 ? "RNC" : formato[0].length === 11 ? "CEDULA" : "OTRO",
            Pais: formato[7] || "REP. DOMINICANA",
            Propietario: formato[8] || "",
            diascredito: '30',
            tiporelacion: 'Solo Cliente',
            limitecredito: '500',
            Sector: formato[9] || "",
            clasificacion: "CLIENTES EN GENERAL",
            moneda: "PESOS DOMINICANOS",
            tipocliente: "Corporativo",
            regimpositivo: "CREDITO FISCAL",
            btnAgregar: 'NO'
        });
        message.reply(`El cliente será creado con el código ${codcli}`)
    }
    if(msg == 'ping'){
        message.reply('pong')
    }
    if(msg.includes(".u")){
        if(msg.length > 2){
            const rs = msg.replace('.u', '').trim().toLocaleUpperCase();
            ultimoCliente().then(res => {
                res.forEach(element => {
                    if(element.toString()[0] == rs[0]){
                        message.reply(`${element}`);
                        return;
                    }
                    
                });
            })
        }
    }
    if(msg === ".paso"){
        const res = await (await prapido).prapido()
        message.reply(`El balance del paso rapido es de ${res}`)
    }
})
client.initialize();
