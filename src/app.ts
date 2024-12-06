import { join } from 'path'
import { config } from 'dotenv';
import { createBot, createProvider, createFlow, addKeyword, addAnswer } from '@builderbot/bot';
import { MemoryDB as Database } from '@builderbot/bot';
import { MetaProvider as Provider } from '@builderbot/provider-meta';


// Cargar variables de entorno desde .env
config();

const PORT = process.env.PORT ?? 3008;

// Definición de flujos
const ingresoflow = addKeyword("ui3v")
    .addAction(async (ctx, ctxFn) => {
        await ctxFn.flowDynamic("*PASO PARA INGRESAR A LA PLATAFORMA* ");
        await ctxFn.flowDynamic("(1) Hacer clic en la página de Paul Müller *https://idiomaspaulmuller.servidor-vps.space/login* ");
        await ctxFn.flowDynamic("(2) Colocar tu número de DNI \n\n *EJEMPLO*\n\n USUARIO = *00000(SU DNI)* \n\nCONTRASEÑA = *000000(SU DNI)*");
    });

const horarioflow = addKeyword("6QDX")
    .addAction(async (ctx, ctxFn) => {
        await ctxFn.flowDynamic("Buen día, ¿a qué horario desea cambiarlo? Así puedo darle una fecha de inicio. 😊\n\n *Recuerde que el cambio de horario tiene un costo de S/.11.00 y se realiza después de tomar su examen final.*");
    });

const justificacionflow = addKeyword("BxJG")
    .addAction(async (ctx, ctxFn) => {
        await ctxFn.flowDynamic("Debe adquirir en caja una solicitud de justificación y presentarla a la oficina de Centro de Idiomas. Si la falta fue en día de examen, debe anexar un documento que valide la información para poder programar el examen sin costo.");
    });

const libroflow = addKeyword("6x0a")
    .addAction(async (ctx, ctxFn) => {
        await ctxFn.flowDynamic("¡Buen día! Si la *nota final* es mayor a 13, el alumno ha pasado de módulo y puede adquirir el siguiente libro en el área de caja de lunes a viernes de 9am a 7pm. 📚✅\n\nSi la nota es de 10 a 12, debe tomar un examen de recuperación. Con una nota de 0 a 9, el alumno repite automáticamente el módulo. 📝🔄");
    });

//const registroflow = addKeyword("sssss")
//   .addAction(async (ctx, ctxFn) => {
//       await ctxFn.flowDynamic("¡Buen día! Me puedes enviar los siguientes datos:\n\nNombres:\nApellidos:\nDNI:\nHorario:\nProfesor:\nBásico:");
//});

const examenflow = addKeyword("1010")
    .addAnswer(`Formas de pago`, { media: "https://drive.google.com/file/d/1_R_JZX8ApwNp69sXI8ivNUidRE3TGPrs/view?usp=drive_link" })

const justificacion_faltaflow = addKeyword("AKSD")
    .addAction(async (ctx, ctxFn) => {
        await ctxFn.flowDynamic("Debe adquirir en caja una solicitud de justificación y presentarla a la oficina de centro de idiomas, Si la falta fue día de examen debe anexar un documento que valide la información para poder programar el examen sin ningún costo ");
    });

const preguntaflow = addKeyword("ÑPOK")
        
    .addAnswer("nombre",{capture:true},
        
        async (ctx ,ctxFn) => {
            await ctxFn.state.update({"name": ctx.body})   
        }
    )
//prueba sheet
const sheetprueba = addKeyword("KkAM")
    .addAnswer("comenzamos con el registro, para ello te ire pidiendo datos. ", {capture: true , buttons: [{body:"si"}, {body:"no"}]},
        async(ctx,ctxFn) => {
            if(ctx.body === "no"){
                return ctxFn.endFlow("el registro fue cancelado")
    
            } else if (ctx.body === "si"){
                await ctxFn.flowDynamic("Perfecto, voy a proceder")
            }else {
                return ctxFn.fallBack("Elige una opcion:")
            }
        })
    .addAnswer("nombre",{capture: true},
        async(ctx, ctxFn) => {
            await ctxFn.flowDynamic("Bienvenido a Muller : " + ctx.body )
            await ctxFn.state.update({"name":ctx.body})
            console.log(ctxFn.state.get("name"))
            console.log(ctx)
        }
    )
    .addAnswer("email", { capture: true },
        async (ctx, ctxFn) => {
            await ctxFn.flowDynamic("Perfecto , su correo es : " + ctx.body )
            await ctxFn.state.update({"email":ctx.body})
            console.log(ctxFn.state.get("email"))
        }   
    );
//prueba-final sheet

//const defaultFlow = addKeyword('')
   // .addAnswer("Gracias por comunicarte conmigo")
    //.addAnswer("Estoy aquí para ayudarte con la información que necesitas.", { buttons: [{ body: "opciones" }] });
    //await ctxFn.flowDynamic("Peefecto: " + ctx.body + "...")

const welcomeFlow = addKeyword(["hola", "opciones"])
    .addAnswer(
        '¡Hola! Bienvenido al *Centro de Idiomas Paul Múller*',
        { capture: false },
        async (ctx, { provider }) => {
            const list = {
                "header": { "type": "text", "text": "¿En qué te podemos ayudar hoy?" },
                "body": { "text": "Elige una opción." },
                "footer": { "text": "Centro de Idiomas Paul Múller" },
                "action": {
                    "button": "OPCIONES",
                    "sections": [
                        {
                            "title": "PREGUNTAS FRECUENTES",
                            "rows": [
                                { "id": "1111", "title": "1 titulo", "description": "Plataforma de acceso" },
                                { "id": "2222", "title": "2 titulo", "description": "Cambio de horario" },
                                { "id": "3333", "title": "3 titulo", "description": "Solicitar justificación" },
                                { "id": "4444", "title": "4 titulo", "description": "Adquirir el libro" },
                                { "id": "5555", "title": "5 titulo", "description": "No registrado en la plataforma" },
                                { "id": "6666", "title": "6 titulo", "description": "Examen de recuperación" },
                                { "id": "7777", "title": "7 titulo", "description": "Justificaion de falta" },
                                { "id": "8888", "title": "8 titulo", "description": "Registro nombre" },
                                { "id": "9999", "title": "9 titulo", "description": "Registro nombre" },
                                { "id": "1010", "title": "PAGO", "description": "Forma de pago" }
                                
                            ]
                        }
                    ]
                }
            };
            await provider.sendList(ctx.from, list);
        }
    );

const main = async () => {
    const adapterFlow = createFlow([welcomeFlow, ingresoflow, horarioflow, justificacionflow, libroflow, examenflow,justificacion_faltaflow,preguntaflow,sheetprueba]);
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

        // Capturar número y mensaje en consola
        console.log(`Nuevo mensaje recibido:`);
        console.log(`Número: ${number}`);
        console.log(`Mensaje: ${message}`);
        
        if (urlMedia) {
            console.log(`Media URL: ${urlMedia}`);
        }

        // Enviar respuesta (opcional)
        await bot.sendMessage(number, '¡Gracias por tu mensaje! Estamos procesándolo.');
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

main();
