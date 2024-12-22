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

// Prompt base que define el contexto
const basePrompt = `
PASO PARA INGRESAR A LA PLATAFORMA:
(1) hacer clic en la página de Paul Müller: 
https://idiomaspaulmuller.servidor-vps.space/login
(2) Colocar tu número de DNI.

Ejemplo: 
USUARIO: 0000000 (SU DNI)
CONTRASEÑA: 0000000 (SU DNI)

Por favor, responde únicamente con base en esta información. Si no puedes responder, indícalo.
`;

// Flujo de ingreso que utiliza el prompt base junto con el mensaje del usuario
const ingresoflow = addKeyword("")
    .addAction(async (ctx, ctxFn) => {
        try {
            // Captura el mensaje del usuario
            const userPrompt = ctx.body;

            // Construye el prompt para la IA combinando el basePrompt con el mensaje del usuario
            const finalPrompt = `${basePrompt}\nUsuario: ${userPrompt}\nIA:`;

            // Genera respuesta usando GoogleGenerativeAI
            const result = await model.generateContent(finalPrompt);
            const aiResponse = result.response.text();

            // Envía la respuesta generada al usuario
            await ctxFn.flowDynamic(aiResponse);
        } catch (error) {
            console.error("Error generando respuesta:", error);
            // Respuesta en caso de error
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

    // Iniciar el servidor
    httpServer(+PORT);
};

// Ejecutar el bot
main();
