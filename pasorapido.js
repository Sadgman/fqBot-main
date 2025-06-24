import puppeteer from 'puppeteer'

const browser = await puppeteer.launch({
    headless: false,
    userDataDir: './data'
})

const page = await browser.newPage()

await page.goto("https://clientes.pasorapido.gob.do/inicio")
await page.waitForSelector('h4', { visible: true })
const precio = await page.evaluate(async () =>{
    const p = document.querySelectorAll("h4")[1].textContent
    return p
})
const total = parseInt((await precio).match(/[\d.]+/g).join(''));
console.log(total)