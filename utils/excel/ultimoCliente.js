import { exec } from 'child_process';
import xls from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function ultimoCliente() {
    return new Promise((resolve, reject) => {
        const vbsPath = path.resolve(__dirname, 'ax.vbs');
        const excelPath = path.resolve(__dirname, 'ulticlient.xlsb');
        
        const cmd = `cscript //NoLogo "${vbsPath}"`;
        exec(cmd, async (error, stdout, stderr) => {
            if (error) {
                return reject(new Error(stderr || error.message));
            }

            try {
                const workbook = xls.readFile(excelPath);

                const hclient = workbook.SheetNames[1];
                const worksheet = workbook.Sheets[hclient];

                const ulcli = xls.utils.sheet_to_json(worksheet, { raw: true }); 
                const menoresPorLetra = {};
                
                ulcli.forEach((client) => {
                    if (!client || !client.codclte) return;
                    const cod = String(client.codclte).trim();
                    if(cod.length == 6 && cod.includes('-')){
                        const codigo = cod;
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
                return resolve(resultado);
                            
            } catch (readError) {
                return reject(new Error(`ERROR al leer el archivo Excel: ${readError.message}`));
            }
        });
    });
}