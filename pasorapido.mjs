import puppeteer from 'puppeteer'
import dotenv from 'dotenv'
dotenv.config()
const browser = await puppeteer.launch({
    headless: true,
    userDataDir: './data'
})
const page = await browser.newPage()

export async function prapido() {
    console.log('Comprobando paso rapido...')
    page.on('framenavigated', async (pestana) => {
        if(pestana == page.mainFrame()){
            const urllogin = pestana.url()
            if(urllogin === "https://clientes.pasorapido.gob.do/login"){
                    const nombre = "input[name='email']"
                    const contra = "input[name='password']"
                    await page.waitForSelector(nombre)
                    await page.type(nombre, process.env.nombre)
                    await page.type(contra, process.env.contra)
                    page.click("input[type='checkbox']")
                    page.click("button[type='submit']")
                    await page.waitForNavigation()
                    await page.waitForNetworkIdle()
            }
        }
    })
    try{
        await page.goto("https://clientes.pasorapido.gob.do/inicio")
        
        await page.waitForSelector('h4', { visible: true })
        const precio = await page.evaluate(async () =>{
            const p = document.querySelectorAll("h4")[1].textContent
            return p
        })
        const total = parseInt((await precio).match(/[\d.]+/g).join(''));
        return total
    }catch{
        console.warn("hubo un error reintentando");
        await prapido()
    }
}