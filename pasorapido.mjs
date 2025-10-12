import puppeteer from 'puppeteer-core'
import dotenv from 'dotenv'
dotenv.config()

const browser = await puppeteer.launch({
    headless: false,
    userDataDir: './data',
    executablePath: process.env.executablePath
})
const page = await browser.newPage()

export async function prapido() {
    page.on('framenavigated', async (pestana) => {
        try {
            if(pestana == page.mainFrame()){
                const urllogin = pestana.url()
                if(urllogin === "https://clientes.pasorapido.gob.do/login"){
                        const checkbox = "input[type='checkbox']" 
                        await page.waitForSelector(nombre)
                        const insertText = async (selector, valor) => { 
                            await page.evaluate((selector, valor)=>{
                                document.querySelector(selector).value = valor
                            }, selector, valor)
                            await page.type(selector, '')
                        }
                        await insertText("input[name='email']", process.env.nombre);
                        await insertText("input[name='password']", process.env.contra);                    
                        await page.waitForSelector(checkbox)
                        await page.click(checkbox)
                        await page.click("button[type='submit']")
                        await page.waitForNavigation()
                        await page.waitForNetworkIdle()
                }
            }
        } catch (error) {
            console.error('Error en la navegación de la página:', error);
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
        return
    }
}