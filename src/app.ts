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

// Imágenes de Paul Muller
const images = [
    { keyword: "instituto", url: "https://xtfklksqkumipzyezoxu.supabase.co/storage/v1/object/public/Muller/FormaPago.jpg" },
    { keyword: "cursos", url: "https://xtfklksqkumipzyezoxu.supabase.co/storage/v1/object/public/Muller/FormaPago.jpg" },
    { keyword: "allcats", url: "https://xtfklksqkumipzyezoxu.supabase.co/storage/v1/object/public/Muller/logo_allcats.png" },
];

// Prompt base que define el contexto
const basePrompt = `
Tu nombre es Alvaro Cuba, toma tu papel como soporte técnico para ayudar a los estudiantes. Solo debes responder con la siguiente información y limítate a no responder otras cosas que estén fuera de esa información. Esta es la información :::-->.
Acceso a la Plataforma:
Paso 1: Dirígete a la página de inicio de Paul Müller: https://idiomaspaulmuller.servidor-vps.space/login
Paso 2: Ingresa tu número de DNI como usuario y contraseña.
...
`; // (Recorta el contenido para mantener el código compacto)

// Historial de chat mapeado por número
const chatHistories: Record<string, { role: "user" | "model"; text: string }[]> = {};

// Flujo principal
const ingresoflow = addKeyword("")
    .addAction(async (ctx, ctxFn) => {
        try {
            const userNumber = ctx.from; // Número del usuario
            const userPrompt = ctx.body; // Mensaje del usuario

            // Inicializa historial si no existe
            if (!chatHistories[userNumber]) {
                chatHistories[userNumber] = [];
            }

            // Agrega el mensaje del usuario al historial
            chatHistories[userNumber].push({ role: "user", text: userPrompt });

            // Construye el historial como texto para el modelo
            const formattedHistory = chatHistories[userNumber]
                .map(msg => `${msg.role === "user" ? "Usuario" : "Modelo"}: ${msg.text}`)
                .join("\n");

            // Construye el prompt completo con el historial
            const responsePrompt = `${basePrompt}\n${formattedHistory}\nModelo:`;

            // Genera una respuesta basada en el historial
            const responseResult = await model.generateContent(responsePrompt);
            const aiResponse = responseResult.response.text().trim();

            // Agrega la respuesta del modelo al historial
            chatHistories[userNumber].push({ role: "model", text: aiResponse });

            console.log(`Historial para ${userNumber}:`, chatHistories[userNumber]);

            // Envía la respuesta generada al usuario
            await ctxFn.flowDynamic(aiResponse);
        } catch (error) {
            console.error("Error generando respuesta:", error);
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

    // Endpoints para manejar mensajes
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
