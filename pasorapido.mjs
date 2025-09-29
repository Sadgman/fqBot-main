import puppeteer from 'puppeteer'
import dotenv from 'dotenv'
dotenv.config()

const browser = await puppeteer.launch({
    headless: false,
    userDataDir: './data'
})
const page = await browser.newPage()

export async function prapido() {
    page.on('framenavigated', async (pestana) => {
        try {
            if(pestana == page.mainFrame()){
                const urllogin = pestana.url()
                if(urllogin === "https://clientes.pasorapido.gob.do/login"){
                        const nombre = "input[name='email']"
                        const contra = "input[name='password']"
                        const checkbox = "input[type='checkbox']" 
                        const isexist = async (n) => {
                            const element = await page.$(n);
                            const value = await page?.evaluate(el => el?.value, element);
                            return await value
                        }
                        await page.waitForSelector(nombre)
                        await page.evaluate()
                        await isexist(nombre) != '' ? await page.type(nombre, process.env.nombre) : null
                        await isexist(contra) != '' ? await page.type(contra, process.env.contra) : null
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