import puppeteer from 'puppeteer';

const  browser = await puppeteer.launch({
    headless: false
})
const page = await browser.newPage();
export default async function consultarnc(text){
    try{
        let info = []
        page.goto("https://dgii.gov.do/app/WebApps/ConsultasWeb2/ConsultasWeb/consultas/rnc.aspx")
        await page.waitForSelector('#cphMain_txtRNCCedula');
        const rncocedula = text?.replace(/[^0-9]/g, '');
        const VisibleAndActive = async (label) => {
            return await page.$(label) && await page.waitForSelector(label, { visible: true, timeout: 1000 }).catch(() => null)
        }
        if(rncocedula?.length === 9 || rncocedula?.length === 11){
            await page.type("#cphMain_txtRNCCedula", rncocedula);
            await page.waitForSelector('#cphMain_btnBuscarPorRNC'); 
            await page.click('#cphMain_btnBuscarPorRNC'); 

            const m = await VisibleAndActive("#cphMain_lblInformacion") ? await page.$eval('#cphMain_lblInformacion', t => t?.textContent) : ''
            // const estado = await page.waitForFunction(() => {
            //     return (document.querySelectorAll('table tr:nth-of-type(6) td')[1]).textContent;
            // })
            const tableActive = await VisibleAndActive('table')
            if(tableActive){
                const selector = async (label) => {
                    return await page.$(label) ? await page.evaluate(el => el.textContent.trim(), await page.$(label)) : null
                }
                
                for(let i = 1; i<11; i++){
                    info.push(await selector(`table tr:nth-of-type(${i}) td:nth-of-type(2)`))
                }
            }
            return {
                mWarning: m,
                rnc: info[0],
                namereason: info[1],
                comercialname: info[2],
                category: info[3],
                payscheme: info[4],
                status: info[5],
                economicactivity: info[6],
                admlocal: info[7],
                facElec: info[8],
                VHM: info[9]
        
            }
        }else{    
            await page.waitForSelector('#cphMain_btnBuscarPorRNC'); 
            await page.click('#cphMain_btnBuscarPorRNC'); 
            await page.click('#aBusquedaPorRazonSocial');
            // page.waitForSelector('input#cphMain_txtRazonSocial');
            // page.type("input#cphMain_txtRazonSocial", text);
            await page.waitForSelector('#cphMain_txtRazonSocial', { visible: true }); 
            await page.type('#cphMain_txtRazonSocial', text); 
            await page.waitForSelector('#cphMain_btnBuscarPorRazonSocial', { visible: true }); 
            await page.click('#cphMain_btnBuscarPorRazonSocial');
            const m = await VisibleAndActive("#cphMain_lblInformacion") ? await page.$eval('#cphMain_lblInformacion', t => t?.textContent) : ''
            if(m.includes('Ocurrió un error')){
                await rncocedula(rncocedula)
            }
            return m
            // page.waitForSelector("input[name='ctl00$cphMain$txtRazonSocial']");
            // page.type("input[name='ctl00$cphMain$txtRazonSocial']", text);
        }
    }catch(err){
        console.log(err)
        console.warn("hubo un error");
    }
    // document.querySelectorAll('table tr:nth-of-type(5) td:nth-of-type(2)')
    // const estado = await page.$eval('#cphMain_dvDatosContribuyentes tr:nth-child(6) td:nth-child(2)', el => el.textContent.trim()); 
    // console.log('Estado:', estado);
 /*    page.evaluate(() =>{
        console.log(document.querySelectorAll('input[value="BUSCAR"]')[0].click())
        document.querySelectorAll('input[value="BUSCAR"]').forEach((input)=>{
            input.click();
        })
    })  */ 
}/* 
consultarnc('fatimadsajksdjkaa').then((l)=>{
    console.log(l)
})
 */
