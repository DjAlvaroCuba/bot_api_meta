import { google } from "googleapis";
import { sheets_v4 } from "googleapis";
import { config } from "dotenv"; // Importa dotenv

// Carga las variables de entorno desde el archivo .env
config();

class SheetManager {
    private sheets: sheets_v4.Sheets;
    private spreadsheetId: string;

    constructor() {
        // Usa la variable de entorno para el ID de la hoja
        const spreadsheetId = process.env.spreadsheetId;

        if (!spreadsheetId) {
            throw new Error("Falta la variable de entorno requerida: SPREADSHEET_ID.");
        }

        // Usamos google.sheets directamente sin autenticación, solo lectura pública
        this.sheets = google.sheets({ version: "v4" });
        this.spreadsheetId = spreadsheetId;
    }

    async userExists(number: string): Promise<boolean> {
        try {
            const result = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: "Users!A:A", // Asegúrate de que el rango sea el correcto
            });
            const rows = result.data.values;
            if (rows) {
                const numbers = rows.map(row => row[0]);
                return numbers.includes(number);
            }
            return false;
        } catch (error) {
            console.error("Error al verificar si el usuario existe", error);
            return false;
        }
    }

    async createUser(number: string, name: string, mail: string): Promise<void> {
        try {
            await this.sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: "Users!A:C", // Asegúrate de que el rango sea el correcto
                valueInputOption: "RAW",
                requestBody: {
                    values: [[number, name, mail]],
                },
            });

            await this.sheets.spreadsheets.batchUpdate({
                spreadsheetId: this.spreadsheetId,
                requestBody: {
                    requests: [
                        {
                            addSheet: {
                                properties: {
                                    title: number,
                                },
                            },
                        },
                    ],
                },
            });
        } catch (error: any) {
            if (error.code === 400 && error.message.includes("already exists")) {
                console.warn(`La hoja "${number}" ya existe.`);
            } else {
                console.error("Error al crear un usuario", error);
            }
        }
    }
}

export default new SheetManager();
