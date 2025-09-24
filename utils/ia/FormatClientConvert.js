import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY});

const instruc = `
Tu tarea es actuar como un asistente de entrada de datos. Toma la información proporcionada en la sección "DATOS DEL CLIENTE" y úsala para rellenar la plantilla de la sección "PLANTILLA".

Reglas importantes:
1.  El dato "Cédula/RNC" debe colocarse en el campo "rnc:" sin espacios entre sus numeros ni guiones.
2.  El dato "Contacto" debe colocarse en el campo "Nombre propietario:".
3.  Si un campo en los datos del cliente está vacío (como Teléfono o Sector), déjalo vacío en la plantilla.
4. En algunos casos el sector o la zona esta en la ubicacion asi que te toca pensar.
5.  Tu respuesta debe ser ÚNICA Y EXCLUSIVAMENTE la plantilla llena. No escribas "Aquí está la plantilla llena", ni saludos, ni ninguna otra palabra.
6. Todos los datos deben estar en mayusculas.
7. Sino se te envia ningun dato de cliente. no debes responder.
8. Al final de la plantilla escribe ByAlastor.

--- PLANTILLA ---
[ Formato para la creación de clientes ]
Razón Social: 
rnc:
Dirección: 
Nombre propietario:
Teléfono: 
Móvil: 
Sector: 
Zona: 
Vendedor: 
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
  return response.text;
}
