/**
 * «Escuchar»: lo que se lee, por partes. El audio lo genera el servidor con
 * voz natural (`src/lib/tts`); el navegador solo lo reproduce.
 */

/**
 * Una parte de lo que se lee: una ficha entera, o la presentación y cada
 * parada de una ruta. `label` se muestra mientras suena y `targetId` es el
 * elemento de la página que se marca como la parte en curso.
 */
export type ListenSection = {
  segments: string[];
  label?: string;
  targetId?: string;
};

/** Velocidades que ofrece el botón, en orden de rotación. */
export const SPEECH_RATES = [1, 1.25, 0.8] as const;
