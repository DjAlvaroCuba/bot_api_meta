// Importaciones necesarias
import { config } from 'dotenv';
import { createBot, createProvider, createFlow, addKeyword } from '@builderbot/bot';
import { MemoryDB as Database } from '@builderbot/bot';
import { MetaProvider as Provider } from '@builderbot/provider-meta';
import { GoogleGenerativeAI } from "@google/generative-ai";

config();
const PORT = process.env.PORT ?? 3008;
// Inicialización de GoogleGenerativeAI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Flujo de ingreso que usa GoogleGenerativeAI
const ingresoflow = addKeyword("ACA ES DONDE QUIERO QUE VAYA EL PROMPT")
    .addAction(async (ctx, ctxFn) => {
        try {
            const userPrompt = ctx.body || "Default prompt if no input"; // Captura el mensaje del usuario
            const result = await model.generateContent(userPrompt); // Genera respuesta usando GoogleGenerativeAI
            const aiResponse = result.response.text(); // Extrae el texto generado
            
            // Envía la respuesta generada al usuario
            await ctxFn.flowDynamic(aiResponse);
        } catch (error) {
            console.error("Error generando respuesta con GoogleGenerativeAI:", error);
            await ctxFn.flowDynamic("Hubo un problema al procesar tu solicitud. Por favor, intenta nuevamente.");
        }
    });

// Configuración principal del bot
const main = async () => {
    const adapterFlow = createFlow([ingresoflow]);
    const adapterProvider = createProvider(Provider, {
        jwtToken: process.env.JWT_TOKEN,
        numberId: process.env.NUMBER_ID,
        verifyToken: process.env.VERIFY_TOKEN,
        version: process.env.PROVIDER_VERSION
    });
    const adapterDB = new Database();

    const { handleCtx, httpServer } = await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    });

    adapterProvider.server.post(
        '/v1/messages',
        handleCtx(async (bot, req, res) => {
            const { number, message, urlMedia } = req.body;
            await bot.sendMessage(number, message, { media: urlMedia ?? null });
            return res.end('sended');
        })
    );

    adapterProvider.server.post(
        '/v1/register',
        handleCtx(async (bot, req, res) => {
            const { number, name } = req.body;
            await bot.dispatch('REGISTER_FLOW', { from: number, name });
            return res.end('trigger');
        })
    );

    adapterProvider.server.post(
        '/v1/blacklist',
        handleCtx(async (bot, req, res) => {
            const { number, intent } = req.body;
            if (intent === 'remove') bot.blacklist.remove(number);
            if (intent === 'add') bot.blacklist.add(number);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ status: 'ok', number, intent }));
        })
    );

    httpServer(+PORT);
};

// Ejecutar el bot
main();
