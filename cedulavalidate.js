import puppeteer from 'puppeteer';

const  browser = await puppeteer.launch({
    headless: true
})
const page = await browser.newPage();
await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 9_0_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13A404 Safari/601.1')

export default async function validatePerson(text) {
   try{
        let info = []
        await page.goto("https://dgii.gov.do/app/WebApps/ConsultasWeb2/ConsultasWeb/consultas/ciudadanos.aspx")

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
                    typodoc: rncocedula?.length === 9 ? "es un rnc" : "es una cedula"
            
                }
            }else{
                const msg = await page.evaluate(async () =>{
                    return document.querySelector("#cphMain_divAlertDanger")?.textContent === 'El RNC/Cédula consultado no se encuentra inscrito como Registrado.'
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