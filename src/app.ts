//import { join } from 'path'
import { config } from 'dotenv';
import { createBot, createProvider, createFlow, addKeyword, addAnswer } from '@builderbot/bot';
import { MemoryDB as Database } from '@builderbot/bot';
import { MetaProvider as Provider } from '@builderbot/provider-meta';
config();

const PORT = process.env.PORT ?? 3008;

// Definición de flujos
//Flujo inicial 
//const initialflow = addKeyword<Provider>("Hola")
//    .addAnswer("Hola , gracias por comunicarte conmigo , para darte una mejor experiencia responde la siguiente pregunta: ")
//    .addAnswer("Eres alumno de Muller", {capture: true , buttons: [{body:"si,soy alumno"}, {body:"no soy alumno"}]},
//    async(ctx,{gotoFlow}) => {
//        if(ctx.body === "si,soy alumno"){
//            return gotoFlow(welcomeFlow)
//        } else if (ctx.body === "no soy alumno"){
//            return gotoFlow(sheetprueba)
//        }else {
//            return gotoFlow(initialflow)
//        }
//    })
//flujo de bienvenida alumno 
const welcomeFlow = addKeyword([""])
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
                                { "id": "1111", "title": "Ingreso", "description": "¿Como ingreso a la plataforma ?" },
                                { "id": "2222", "title": "Horario", "description": "Cambio de horario" },
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
    
//flujo de ingreso 
const ingresoflow = addKeyword("1111")
    .addAction(async (ctx, ctxFn) => {
        await ctxFn.flowDynamic("*PASOS PARA INGRESAR A LA PLATAFORMA* ");
        await ctxFn.flowDynamic("*PRIMERO* Ingresas al siguiente enlace  *https://idiomaspaulmuller.servidor-vps.space/login*");
        await ctxFn.flowDynamic("*SEGUNDO* Cuando te pida las credenciales debes colocar tu DNI en los dos campos , de esta forma : \n\n USUARIO = *TU DNI* \n\nCONTRASEÑA = *TU DNI*");
    });
//flujo de cambio de horario
const horarioflow = addKeyword("2222")
    .addAction(async (ctx, ctxFn) => {
        await ctxFn.flowDynamic("Buen día,_Para el cambio de horario debe comunicarse con este numero_ \n" );
        await ctxFn.flowDynamic("*https://wa.me/message/SIDQZGO3WXBSC1*");
        await ctxFn.flowDynamic("_Recuerde que el cambio de horario tiene un costo de S/.11.00 y se realiza después de tomar su examen final._");
    }); 
//flujo de pago 
const pagoflow = addKeyword("1010")
    .addAction(async(ctxFn) => {
        await ctxFn.flowDynamic( "_Aqui te muestro como pagar , no olvides seguir los pasos_", { media:"https://xtfklksqkumipzyezoxu.supabase.co/storage/v1/object/public/Muller/FormaPago.jpg "});
        await ctxFn.flowDynamic( "*Recuerda*");
        await ctxFn.flowDynamic( `Colocar tu nombre completo y N° de DNI en la referencia del pago para identificarte como estudiante.😊👋🏻` );
        
    }) 


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

//const chupapiflow = addKeyword('')
   //.addAnswer("Joven ahorita estoy ocupado , provincia atiendo mañana")
    //.addAnswer("Estoy aquí para ayudarte con la información que necesitas.", { buttons: [{ body: "opciones" }] });
    //await ctxFn.flowDynamic("Peefecto: " + ctx.body + "...")





const main = async () => {
    const adapterFlow = createFlow([welcomeFlow, ingresoflow, horarioflow, justificacionflow, libroflow, pagoflow,justificacion_faltaflow,preguntaflow,sheetprueba]);
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

main();
