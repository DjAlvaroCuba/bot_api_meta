const { sheets } = require('@googleapis/sheets');
const { auth } = require('@googleapis/sheets'); // Accede a la autenticación
require('dotenv').config();

async function main() {
    // Configuración del cliente de autenticación
    const authClient = new auth.GoogleAuth({
        credentials: {
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') // Asegurarse de que las nuevas líneas estén correctas
        },
        scopes: [
            'https://www.googleapis.com/auth/spreadsheets' // Cambiado a permisos de lectura y escritura
        ],
    });

    // Obtener una instancia autenticada del cliente de Google Sheets
    const client = sheets({
        version: 'v4',
        auth: await authClient.getClient(), // Obtener el cliente autenticado
    });

    // Definir ID de la hoja y rango
    const spreadsheetId = '1dj4algCFO4-CE--1nR4b2UDXIIIBa-FTbetaSukOs9A';
    const range = 'Hoja 1'; // Ajusta el rango según tu hoja

    try {
        // Obtener los datos desde la hoja
        const response = await client.spreadsheets.values.get({
            spreadsheetId,
            range,
        });
        const currentDate = new Date(); 
        const formattedDate = currentDate.toLocaleDateString('es-ES', { timeZone: 'America/Lima' }); // Solo fecha
        const formattedTime = currentDate.toLocaleTimeString('es-ES', { timeZone: 'America/Lima' }); // Solo hora
        // Datos a enviar a la hoja
        const newValues = [
            ['Alvaro' ,'Cuba', '71317809','activo','986991869',formattedDate, formattedTime]
        ];
        console.log('Datos obtenidos:', response.data.values);
        // Agregar datos al final de la hoja
        const appendResponse = await client.spreadsheets.values.append({
            spreadsheetId,
            range,
            valueInputOption: 'RAW', // RAW o USER_ENTERED para procesar fórmulas
            resource: {
                values: newValues,
            },
        });

        console.log('Datos enviados:', appendResponse.data.updates);
    } catch (error) {
        console.error('Error de la API:', error.response?.data || error.message);
    }
}

main();
