import spawn from 'child_process';
/*    
    Dejando algo en claro: 
    tuve que desarrollar esto de esta forma porque no me dejan hacer consultas en la base de datos. 
    Ni siquiera se puede programar en esta empresa, pero al menos logré automatizar algunos procesos repetitivos que tenía que hacer diariamente. 
    Espero poder conseguir un trabajo en el que valoren a los programadores y que el jefe de TI al menos tenga idea de cómo programar.

    No entiendo cómo existen Ingenieros en Sistemas que no saben programar, 
    ni la razón de la existencia del departamento de tecnología en esta empresa. 
    Realmente no estoy de acuerdo con muchas decisiones que se toman en este departamento, 
    y no culpo a mi jefe (es buena gente), pero simplemente esperaba algo más. 
    No sé, quizás un ingeniero real y encontrarme en un lugar donde se pueda aprender y crecer.

    Aquí mis habilidades técnicas, como la reparación de PC, se pusieron a prueba, 
    pero realmente no aprendí mucho sobre lo que esperaba. 
    Por mi cuenta aprendí cosas como los controles de las apps en Windows y la automatización UiA.

    También me di cuenta de que las empresas de mi país en tecnología prefieren depender de terceros; es decir, 
    no hay futuro para los programadores. Te sale mejor ser técnico, o al menos en mi ciudad no hay nada más que eso. 
    Quisiera poder cambiar algo y ver todo crecer, pero sé que es imposible. Al menos no se me ocurre nada.

    Bueno, al menos espero que alguien en algún momento haga algo para que los programadores tengan algún futuro, 
    y que las tecnologías de este país dejen de depender tanto de Microsoft, tanto los servidores como las aplicaciones. 
    Ojo, no digo que esté mal; C# es muy bueno. Incluso en este proyecto lo usé, 
    ya que no puedo insertar los datos directamente en la base de datos de Microsoft SQL. 
    Automaticé el proceso en una app llamada Bigflex.

    Me pregunto si algo de esto valdrá la pena algún día. 
    Mi vida como tal no tiene mucho sentido. No sé por qué hice esto. 
    Quizás era para no tener que hacerlo o para probarme que podía. 
    No creo que nadie aparte de mí lo use.
*/
const RUTA_EXE = process.env.bfclient;

let procesoCsharp = null;
let isReady = false;
let messageQueue = [];

function iniciarProceso() {
  if (procesoCsharp) {
    return; 
  }

  procesoCsharp = spawn.spawn(RUTA_EXE, [], {
    stdio: ['pipe', 'pipe', 'pipe'],
    detached: false
  });

  procesoCsharp.stdout.on('data', (data) => {
    const mensaje = data.toString().trim();
    
    if (mensaje.toUpperCase() === 'READY') {
      isReady = true;
      
      // Procesar cola de mensajes pendientes
      while (messageQueue.length > 0 && isReady) {
        const cliente = messageQueue.shift();
        enviarCliente(cliente);
      }
    }
  });

  procesoCsharp.stderr.on('data', (data) => {
    console.error('Error del proceso C#:', data.toString());
  });

  procesoCsharp.on('close', (code) => {
    isReady = false;
    procesoCsharp = null;
    
    // Reiniciar el proceso si se cierra inesperadamente
    if (messageQueue.length > 0) {
      setTimeout(iniciarProceso, 1000);
    }
  });

  procesoCsharp.on('error', (err) => {
    console.error('Error en el proceso C#:', err);
    isReady = false;
    procesoCsharp = null;
  });
}

// Función interna para enviar cliente al proceso ya listo
function enviarCliente(cliente) {
  if (procesoCsharp && isReady) {
    const comandoJson = JSON.stringify(cliente);
    try {
      procesoCsharp.stdin.write(comandoJson + '\n');
    } catch (error) {
      console.error('Error al enviar cliente:', error);
      isReady = false;
    }
  }
}
export default function crearCliente(cliente) {
  // Si el proceso no está iniciado, iniciarlo
  if (!procesoCsharp) {
    iniciarProceso();
  }

  // Si está listo, enviar inmediatamente; si no, agregar a la cola
  if (isReady) {
    enviarCliente(cliente);
  } else {
    messageQueue.push(cliente);
  }
}
export function cerrarProceso() {
  if (procesoCsharp) {
    procesoCsharp.stdin.write('exit\n');
    procesoCsharp.kill();
    procesoCsharp = null;
    isReady = false;
    messageQueue = [];
  }
}

// Iniciar el proceso al cargar el módulo
iniciarProceso();
