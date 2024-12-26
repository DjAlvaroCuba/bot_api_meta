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

// Lista de imágenes asociadas a palabras clave
const images = [
    { keyword: "instituto", url: "https://xtfklksqkumipzyezoxu.supabase.co/storage/v1/object/public/Muller/FormaPago.jpg" },
    { keyword: "cursos", url: "https://xtfklksqkumipzyezoxu.supabase.co/storage/v1/object/public/Muller/FormaPago.jpg" },
    { keyword: "allcats", url: "https://xtfklksqkumipzyezoxu.supabase.co/storage/v1/object/public/Muller/logo_allcats.png" },
];

// Prompt base que define el contexto
const basePrompt = `
Eres un asistente de IA , responde  solo con la información que se encuentra aquí, con respuestas cortas , sé amable , y servicial.
Si no esta relacionado simplemente dile que no cuentas con esa informacion 
Informacion-->
Uno de los mejores Institutos de Educación Superior Privada en Perú, dedicados a la formación de profesionales altamente capacitados para enfrentar el competitivo mercado laboral. Ofrecemos una educación de excelencia, respaldada por más de 31 años de experiencia y un compromiso con el desarrollo integral de nuestros estudiantes.
En el Instituto Paul Müller, nuestra cultura institucional promueve relaciones solidarias, trabajo en equipo y responsabilidad, enfocándonos en la mejora continua para garantizar la calidad educativa.
las carreas que tenemos son programacion web y excel avanzado
`;

// Historial de chat
const chatHistory: { role: "user" | "model"; text: string }[] = [];

// Flujo principal
const ingresoflow = addKeyword("")
    .addAction(async (ctx, ctxFn) => {
        try {
            // Captura el mensaje del usuario
            const userPrompt = ctx.body;

            // Agrega el mensaje del usuario al historial
            chatHistory.push({ role: "user", text: userPrompt });

            // Construye el historial como texto para el modelo
            const formattedHistory = chatHistory.map(msg => `${msg.role === "user" ? "Usuario" : "Modelo"}: ${msg.text}`).join("\n");

            // Construye el prompt para identificar imágenes
            const themePrompt = `
                Usuario: ${userPrompt}
                Dado el mensaje anterior, identifica el tema o palabra clave más relevante para buscar una imagen. 
                Responde con una sola palabra clave si aplica, o responde "ninguna" si no se necesita una imagen.
            `;

            // Genera una respuesta para identificar el tema
            const themeResult = await model.generateContent(themePrompt);
            const detectedTheme = themeResult.response.text().trim().toLowerCase();

            // Verifica si hay una palabra clave asociada a una imagen
            const image = images.find(img => detectedTheme.includes(img.keyword));

            if (image) {
                // Envía la imagen si se encuentra una coincidencia
                await ctxFn.flowDynamic([{ body: "Aquí tienes la imagen solicitada:", media: image.url }]);
                return;
            }

            // Si no hay solicitud de imagen, genera una respuesta normal basada en el historial
            const responsePrompt = `${basePrompt}\n${formattedHistory}\nModelo:`;
            const responseResult = await model.generateContent(responsePrompt);
            const aiResponse = responseResult.response.text().trim();

            // Agrega la respuesta del modelo al historial
            chatHistory.push({ role: "model", text: aiResponse });
            console.log("Historial de chat actualizado tras la respuesta del modelo:", chatHistory);
            // Envía la respuesta generada al usuario
            await ctxFn.flowDynamic(aiResponse);
        } catch (error) {
            console.error("Error generando respuesta:", error);
            // Respuesta en caso de error
            await ctxFn.flowDynamic("Hubo un problema al procesar tu solicitud. Por favor, intenta nuevamente.");
        }
    });
//model.count(charthistoryu)
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

    // Inicia el servidor
    httpServer(+PORT);
};

// Ejecutar el bot
main();
