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
Responde , solo con la informacion que se encuetra aqui , con respuesta cortas , se amable , si la respuesta esta fuera de contexto o no pertenece simplemente dile , gracias pero sino fie de ayuda puedo comunicarlo con mi asesor humano.
Uno de los mejores Institutos de Educación Superior Privada en Perú, dedicados a la formación de profesionales altamente capacitados para enfrentar el competitivo mercado laboral. Ofrecemos una educación de excelencia, respaldada por más de 31 años de experiencia y un compromiso con el desarrollo integral de nuestros estudiantes.
En el Instituto Paul Müller, nuestra cultura institucional promueve relaciones solidarias, trabajo en equipo y responsabilidad, enfocándonos en la mejora continua para garantizar la calidad educativa.

`;

// Flujo de ingreso que utiliza el prompt base junto con el mensaje del usuario
const ingresoflow = addKeyword("")
    .addAction(async (ctx, ctxFn) => {
        try {
            // Captura el mensaje del usuario
            const userPrompt = ctx.body;

            // Construye el prompt para la IA combinando el basePrompt con el mensaje del usuario
            const finalPrompt = `${basePrompt}+${userPrompt}`;

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
