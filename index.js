import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import Fcc from './utils/ia/FormatClientConvert.js';
import runCommand from './utils/command.js';
import fs from 'fs';
import ultimoCliente from './utils/excel/ultimoCliente.js';
import FCclient from './utils/ia/FormatClientCreate.js';
import dotenv from 'dotenv';
import mail from './utils/mail.js'
import prapido from 'pasorapido-balance-checker';

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
const pasor = await prapido.init({
    headless: true,
    userDataDir: './pasorapido',
})
async function comp(){
    try{
        let res;
        try{
            res = await pasor.getBalance();
        }
        catch(e){
            if(e instanceof prapido.RequireLogin){
                await pasor.WritetwoFactor(process.env.nombre, process.env.contra)
                client.sendMessage('18098972404@c.us', 'Se requiere autenticación para acceder a la cuenta de paso rápido utiliza el comando . + v + <codigo>.')
                return;
            }
        }
        if( res <= 35000){
            client.sendMessage('18092711144@c.us', `Se requiere recarga de paso rapido saldo actual de ${res}`)
        }
        setInterval(async () => {
            for(let i=0;i<=2; i++){
                const res = await pasor.getBalance();
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
    if(!message){
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
        unrestrictedNumers?.includes(contact?.id?.user) || chat.id.user === '120363202084167394')
    ){
        let rnc = await idStract(msg)

        if(!rnc){
            const iaresp = await Fcc(msg);
            rnc = await idStract(iaresp);
            if(!rnc) return;
        }
        client.sendMessage('18098972404@c.us', `Hay un nuevo cliente para crear favor de verificar`)
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
            await message.reply(`Tipo de documento RNC`)   
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
        let msdg = await FCclient(await qa(msgq))
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
        const rs = formato[1].trim().toLocaleUpperCase();
        const ult = await ultimoCliente()
        const codcli = await ult.find(cod => {return cod.toString()[0] == rs[0]});
        let vendedor = JSON.parse(fs.readFileSync('vendedores.json'))
        const bf = await import('./bfclient.js');
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
            vendedor: vendedor?.[contact.id.user]?.zona ? vendedor?.[contact.id.user]?.zona : '',
            zona: "",
            btnAgregar: 'NO'
        });
        bf.cerrarProceso();
        message.reply(`El cliente será creado con el código ${codcli}`)
    }
    if(msg == 'ping'){
        message.reply('pong')
    }
    if(msg.includes(".v")){
        const code = msg.replace('.v', '').trim();
        if(code.length < 4){
            message.reply('Por favor ingresa un código válido de 4 dígitos o más.');
            return;
        }
        if(await pasor.WriteCode(code)) await comp();
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
    // Funcion para mencionar a todos los integrantes del grupo
    async function mentionAll(text){
        //compruebo si el chat es un grupo, si el usuario es admin o si mi numero es el que hace la llamada.
        if((chat.isGroup && unrestrictedNumers.includes(contact.id.user)) || chat.id.user === '120363202084167394'){

            let mention = [];
            //busco dentro del array para introducir el id de todos los usuarios serializados dentro de otro array
            await chat.participants.forEach(participant => {
                mention.push(`${participant.id._serialized}`);
            });
        
            await chat.sendMessage(text, { mentions: mention });
        }
    }
    if(message.body.toLocaleLowerCase() === '!t' || message.body.toLocaleLowerCase().startsWith('!t')){
        const parts = message.body.split(' ');
        //verifico si parts tiene una longitud mayor a uno y si no incluye la palabra !t
        if(parts.length > 1 && !parts.slice(1).join(' ').toLocaleLowerCase().includes('!t')){
            //si es asi mando el texto a la funcion para que lo envie
            mentionAll(parts.slice(1).join(' '));
        }
    }
    if(msg.includes('.cotizar')){
        msg = msg.replace('.cotizar', '').trim();
        const mensaje = `Saludos buenas, puede cotizarme:\n${msg} a nombre de Farquina por favor y gracias.`
        const empresas = ['18095780076', '18095780426', '18095776975', '18492141933', '18295723056']
        empresas.forEach(async (empresa) => {
            await client.sendMessage(`${empresa}@c.us`, mensaje)
        });
        message.reply('Cotización solicitada')
    }
    async function sendmail(docq){
        message.reply('Enviando correo...')
        await mail({
            mensaje: 'Saludos, adjunto comprobante de recarga paso rápido Farmoquimica Nacional Rnc 106-01204-1 Cuenta# 75363\nPor favor enviar el comprobante.',
            uer: process.env.usermail,
            asunto: 'Recarga de paso rápido',
            email: "serviciospasorapido@cardnet.com.do",
            mentions: ['tecnologia@farquina.com', 'j.disla@farquina.com'],
            password: process.env.passmail,
            archivo: {
                filename: 'comprobante' + '.' + docq.mimetype.split('/')[1],
                content: docq.data,
                encoding: 'base64'
            }
        });   
        message.reply('Correo enviado')
        return;
    }
    if(message?.hasMedia){
        const media = await message.downloadMedia();
        if(media.mimetype.includes('image') || media.mimetype.includes('pdf')){
            fs.writeFileSync('media.png', media.data, {encoding: 'base64'});
            const paso = await runCommand(`easyocr -l es es -f media.png --detail=0 --gpu=True`);
            if(paso.includes('BHD') && paso.includes("106012041") && paso.toLocaleLowerCase().includes('recarga')){
                await sendmail(media)
            }
        }
        return;
    }
    if(msg == ".s"){
        if((quotedMsg?.hasMedia || message?.hasMedia)){
            const docq = quotedMsg?.hasMedia ? await quotedMsg.downloadMedia() : await message.downloadMedia()
            await sendmail(docq)
            return;
        }
    }
    if(msg === ".paso"){
        const res = await pasor.getBalance()
        message.reply(`El balance del paso rapido es de ${res}`)
    }
})
client.initialize();
