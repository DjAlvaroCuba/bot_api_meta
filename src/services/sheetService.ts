const { sheets } = require('@googleapis/sheets');
const { auth } = require('@googleapis/sheets'); // Accede a la autenticación

async function main() {
    // Configuración del cliente de autenticación
    const authClient = new auth.GoogleAuth({
        keyFilename: 'muller-442915-dc991695a279.json', // Ruta al archivo JSON de las credenciales
        scopes: ['https://www.googleapis.com/auth/spreadsheets'], // Alcance para lectura y escritura
    });
        
    // Obtener una instancia autenticada del cliente de Google Sheets
    const client = sheets({
        version: 'v4',
        auth: await authClient.getClient(),
    });

    // Definir ID de la hoja y rango
    const spreadsheetId = '1dj4algCFO4-CE--1nR4b2UDXIIIBa-FTbetaSukOs9A';
    const range = 'Hoja 1'; // Ajusta el rango según tu hoja

    try {
        // Datos a agregar (puedes personalizarlos)
        const values = [
            ['Dato 1', 'Dato 2', 'Dato 3'], // Fila 1
            ['Dato 4', 'Dato 5', 'Dato 6'], // Fila 2
        ];

        // Usar append para agregar datos al final
        const response = await client.spreadsheets.values.append({
            spreadsheetId,
            range,
            valueInputOption: 'RAW', // RAW: texto sin formato; USER_ENTERED: interpreta fórmulas
            requestBody: {
                values, // Valores a insertar
            },
        });

        console.log('Datos agregados:', response.data.updates);
    } catch (error) {
        console.error('Error de la API:', error.response?.data || error.message);
    }
}

main();
