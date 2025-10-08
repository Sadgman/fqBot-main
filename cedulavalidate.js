import puppeteer from 'puppeteer';

const  browser = await puppeteer.launch({
    headless: false
})
const page = await browser.newPage();

export default async function validatePerson(text) {
   try{
        let info = []
        page.goto("https://dgii.gov.do/app/WebApps/ConsultasWeb2/ConsultasWeb/consultas/ciudadanos.aspx")
        await page.waitForSelector('#cphMain_txtCedula');
        const rncocedula = text?.replace(/[^0-9]/g, '');
        const VisibleAndActive = async (label) => {
            return await page.waitForSelector(label, { visible: true, timeout: 1000 }).catch(() => null) && await page.$(label) 
        }
            await page.type("#cphMain_txtCedula", rncocedula);
            await page.waitForSelector('#cphMain_btnBuscarCedula'); 
            await page.click('#cphMain_btnBuscarCedula'); 

            const tableActive = await VisibleAndActive('table')
            if(tableActive){
                const selector = async (label) => {
                    return await page.$(label) ? await page.evaluate(el => el.textContent.trim(), await page.$(label)) : null
                }
                
                for(let i = 1; i<11; i++){
                    info.push(await selector(`table tr:nth-of-type(${i}) td:nth-of-type(2)`))
                }
            }
            if(info[3]){
                return {
                    rnc: info[3],
                    namereason: info[0],
                    comercialname: info[2],
                    category: info[4],
                    status: info[1],
                    cedulaornc: rncocedula?.length === 9 ? "es un rnc" : "es una cedula"
            
                }
            }else{
                const msg = await page.evaluate(async () =>{
                    return document.querySelector("#cphMain_lblInformacion")?.textContent === 'El RNC/Cédula consultado no se encuentra inscrito como Contribuyente.'
                }) 
                if(!msg){
                    await validatePerson(text)
                }
            }
    }catch(err){
        console.log(err)
        console.warn("hubo un error");
    }
}