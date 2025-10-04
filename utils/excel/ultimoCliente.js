import { exec } from 'child_process';
import xls from 'xlsx';

export default function ultimoCliente() {
    return new Promise((resolve, reject) => {
        exec(`cscript //NoLogo ax.vbs`, async(error, stdout, stderr) => {
            if (error) {
                console.error(`ERROR al ejecutar VBScript: ${stderr}`);
                return reject(stderr);
            }

            try {
                const workbook = xls.readFile('ulticlient.xlsb');

                const hclient = workbook.SheetNames[1];
                const worksheet = workbook.Sheets[hclient];

                const ulcli = xls.utils.sheet_to_json(worksheet, { raw: true }); 
                const menoresPorLetra = {};
                
                ulcli.forEach((client, index) => {
                    if(client.codclte.trim().length == 6 && client.codclte.trim().includes('-')){
                        const codigo = client.codclte.trim();
                        const letra = codigo.split('-')[0];
                        const numero = parseInt(codigo.replace(/\D/g, ""));
                        
                        if(!menoresPorLetra[letra] || numero < menoresPorLetra[letra].numero) {
                            menoresPorLetra[letra] = {
                                codigo: codigo,
                                numero: numero
                            };
                        }
                    }
                });            
                const resultado = Object.values(menoresPorLetra).map(item => item.codigo);
                resolve(resultado);
                            
            } catch (readError) {
                throw new Error(`ERROR al leer el archivo Excel: ${readError.message}`);
            }
        });
    });
}