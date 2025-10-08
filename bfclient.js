import spawn from 'child_process';

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
