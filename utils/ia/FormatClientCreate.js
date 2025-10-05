import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv'
dotenv.config()
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY});

const instruc = `
Tu tarea es actuar como un asistente de entrada de datos. Toma la información proporcionada en la sección "DATOS DEL CLIENTE" y úsala para rellenar la plantilla de la sección "PLANTILLA".

Reglas importantes:
1.  El dato "Cédula/RNC" debe colocarse en el campo "rnc" sin espacios entre sus numeros ni guiones.
2.  El dato "Contacto" debe colocarse en el campo "Nombre propietario:".
3.  Si un campo en los datos del cliente está vacío (como Teléfono o Sector), déjalo vacío en la plantilla.
4. En algunos casos el sector o la zona esta en la ubicacion asi que te toca pensar.
5.  Tu respuesta debe ser ÚNICA Y EXCLUSIVAMENTE la plantilla llena. No escribas "Aquí está la plantilla llena", ni saludos, ni ninguna otra palabra.
6. Los numeros de telefono no deben tener (), tampoco espacios, y deben tener sus respectivos guiones
7. Sino se te envia ningun dato de cliente. no debes responder.
8. remplaza las indicaciones de donde va cada cosa con los datos suministrados
9. Todos los datos deben estar en mayusculas.
10. Los nombres como calle, avenida etc deben ir abreviados.
11. si hay algun dato que no va en la plantilla no lo incluyas como palabras, etc.
12. Si no se te envia algun dato no debes inventarlo.

--- PLANTILLA de entrada ---
{
"razonsocial": 
"rnc": 
"direccion": 
"nombrepropietario": 
"telefono": 
"telefono2": 
"sector": 
"zona": 
"pais":
"vendedor": 
}
--- FIN DE LA PLANTILLA ---
` 

export default async function main(texto) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: texto,
    config:{
      systemInstruction: instruc,
    }
  });
  let rp = (response.text)?.replaceAll('```json','')?.replaceAll('```','');
  rp = JSON.parse(rp);
  return `${rp?.rnc}|${rp?.razonsocial}|${rp?.direccion}|${rp?.direccion2? rp?.direccion2 : ''}|${rp?.telefono}|${rp?.telefono2}|c|${rp?.pais}|${rp?.nombrepropietario}|${rp?.sector}`
}

