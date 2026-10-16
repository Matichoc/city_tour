/**
 * Crea el formulario «Suma tu comercio» en Google Forms, en versión corta
 * (unos 3 minutos), y una planilla para las respuestas.
 *
 * Cómo usarlo:
 * 1. Entra a https://script.google.com con tu cuenta de Google → «Nuevo proyecto».
 * 2. Borra lo que aparece, pega este archivo completo y completa las dos
 *    constantes de abajo (WhatsApp y correo de contacto).
 * 3. Elige la función `crearFormulario` y pulsa «Ejecutar». La primera vez
 *    Google pide permisos: acéptalos (el formulario queda en tu Drive).
 * 4. En «Registro de ejecución» aparecen tres enlaces: el que se comparte con
 *    los comercios, el de edición y el de la planilla.
 *
 * Las fotos se piden por WhatsApp porque Google Forms no deja crear por código
 * la pregunta de subir archivos (y además obliga a iniciar sesión con Google).
 * Si quieres esa pregunta, agrégala a mano en el editor del formulario.
 *
 * Los textos de autorización son un BORRADOR: revisarlos con el abogado
 * (docs/REVISION-LEGAL.md) antes de enviarlo.
 */

// ─── Completa estos datos ────────────────────────────────────────────────
const WHATSAPP_CONTACTO = "+56 9 XXXX XXXX";
const CORREO_CONTACTO = "correo@ejemplo.cl";
// ─────────────────────────────────────────────────────────────────────────

function crearFormulario() {
  const form = FormApp.create("Suma tu comercio a «Papudo en tu mano»");
  form
    .setDescription(
      "«Papudo en tu mano» es la guía digital de Papudo, Las Salinas y Pullally. " +
        "Ayuda a que quienes nos visitan encuentren lo que ofrece el comercio local.\n\n" +
        "Esta temporada, tu ficha es GRATIS. Te toma unos 3 minutos. " +
        "Antes de publicarla, la revisamos contigo.",
    )
    .setProgressBar(true)
    .setConfirmationMessage(
      "¡Gracias! Te escribiremos por WhatsApp para mostrarte tu ficha antes de publicarla. " +
        "Si aún no nos mandas tus fotos, envíalas al " +
        WHATSAPP_CONTACTO +
        ".",
    );

  // 1. Tu negocio
  form.addSectionHeaderItem().setTitle("Tu negocio");

  form.addTextItem().setTitle("¿Cómo se llama tu negocio?").setRequired(true);

  form
    .addMultipleChoiceItem()
    .setTitle("¿Qué ofreces?")
    .setChoiceValues([
      "Comida (restaurante, cocinería, café, heladería…)",
      "Alojamiento (cabañas, hostal, camping…)",
      "Actividades o paseos",
      "Deportes y aventura",
      "Playa y balneario",
      "Productos del campo",
      "Cultura y patrimonio",
    ])
    .showOtherOption(true)
    .setRequired(true);

  form
    .addMultipleChoiceItem()
    .setTitle("¿Dónde está?")
    .setChoiceValues(["Papudo", "Las Salinas", "Pullally"])
    .showOtherOption(true)
    .setRequired(true);

  form
    .addTextItem()
    .setTitle("Dirección o cómo llegar")
    .setHelpText("Por ejemplo: «Av. Irarrázaval 123» o «frente a la caleta».")
    .setRequired(true);

  const frase = FormApp.createTextValidation()
    .setHelpText("Máximo 160 caracteres.")
    .requireTextLengthLessThanOrEqualTo(160)
    .build();
  form
    .addTextItem()
    .setTitle("Cuéntanos en una frase qué te hace especial")
    .setHelpText(
      "Por ejemplo: «Pescado del día y empanadas de mariscos frente al mar».",
    )
    .setValidation(frase)
    .setRequired(true);

  form
    .addParagraphTextItem()
    .setTitle("¿Qué días y a qué hora atiendes?")
    .setHelpText(
      "Por ejemplo: «Todos los días de 12 a 22 h; en invierno solo fines de semana».",
    )
    .setRequired(true);

  form
    .addTextItem()
    .setTitle("WhatsApp o teléfono del negocio")
    .setRequired(true);

  form
    .addTextItem()
    .setTitle("Instagram, Facebook o página web")
    .setHelpText("Opcional. Pega el enlace o escribe tu @usuario.");

  form
    .addTextItem()
    .setTitle("Enlace de Google Maps")
    .setHelpText("Opcional. En Google Maps: «Compartir» → «Copiar enlace».");

  // 2. Fotos
  form
    .addPageBreakItem()
    .setTitle("Tus fotos")
    .setHelpText(
      "Con 3 a 8 fotos tuyas tu ficha se ve mucho mejor: el frente, el interior, " +
        "tus platos o habitaciones. Lo más fácil es mandarlas por WhatsApp al " +
        WHATSAPP_CONTACTO +
        ".",
    );

  form
    .addMultipleChoiceItem()
    .setTitle("¿Cómo nos mandas tus fotos?")
    .setChoiceValues([
      "Por WhatsApp",
      "Por correo",
      "Prefiero que las tomen ustedes cuando me visiten",
    ])
    .setRequired(true);

  form
    .addTextItem()
    .setTitle("¿Quién tomó las fotos?")
    .setHelpText(
      "Para darle el crédito. Puede ser «yo» o el nombre de quien las tomó.",
    );

  // 3. Tus datos (no se publican)
  form
    .addPageBreakItem()
    .setTitle("Tus datos")
    .setHelpText("Son para coordinar contigo. No se publican.");

  form.addTextItem().setTitle("Tu nombre").setRequired(true);

  const correo = FormApp.createTextValidation()
    .setHelpText("Escribe un correo válido.")
    .requireTextIsEmail()
    .build();
  form
    .addTextItem()
    .setTitle("Tu correo")
    .setHelpText("Con este correo podrás entrar después a actualizar tu ficha.")
    .setValidation(correo)
    .setRequired(true);

  // 4. Autorización (borrador para el abogado)
  form
    .addCheckboxItem()
    .setTitle("Autorización")
    .setHelpText(
      "Tus datos de contacto se usan solo para administrar la ficha. Puedes pedir " +
        "corregirlos o borrarlos escribiendo a " +
        CORREO_CONTACTO +
        ".",
    )
    .setChoiceValues([
      "Soy dueño/a o encargado/a del negocio y autorizo publicar esta información y mis " +
        "fotos en «Papudo en tu mano», sin costo y mientras participe. Las fotos son mías " +
        "o tengo permiso para usarlas, y puedo pedir retirarlas cuando quiera.",
    ])
    .setRequired(true);

  // Planilla de respuestas
  const planilla = SpreadsheetApp.create("Respuestas — Suma tu comercio");
  form.setDestination(FormApp.DestinationType.SPREADSHEET, planilla.getId());

  Logger.log("Enlace para compartir: " + form.getPublishedUrl());
  Logger.log("Editar el formulario: " + form.getEditUrl());
  Logger.log("Planilla de respuestas: " + planilla.getUrl());
}
