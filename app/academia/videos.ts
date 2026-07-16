export type TrainingVideo = {
  id: number;
  stepLabel: string;
  title: string;
  description: string;
  duration: string;
  thumbnail: string;
  videoUrl: string;
};

export const trainingVideos: TrainingVideo[] = [
  {
    id: 1,
    stepLabel: "Paso 1",
    title: "¿Qué es Forex?",
    description:
      "Conoce qué es el mercado Forex, cómo funciona y cuáles son sus conceptos fundamentales.",
    duration: "08:21",
    thumbnail: "/logo/logo carvipix.png",
    videoUrl: "/training-videos/step-1-que-es-forex.mp4",
  },
  {
    id: 2,
    stepLabel: "Paso 2",
    title: "Descarga estas aplicaciones para empezar",
    description:
      "Instala las herramientas necesarias para comenzar a trabajar correctamente.",
    duration: "06:44",
    thumbnail: "/logo/logo carvipix.png",
    videoUrl: "/training-videos/step-2-aplicaciones.mp4",
  },
  {
    id: 3,
    stepLabel: "Paso 3",
    title: "Cómo conectar MetaTrader 4 con tu broker",
    description:
      "Aprende a vincular correctamente tu cuenta del broker con MetaTrader 4.",
    duration: "09:13",
    thumbnail: "/logo/logo carvipix.png",
    videoUrl: "/training-videos/step-3-conectar-mt4-broker.mp4",
  },
  {
    id: 4,
    stepLabel: "Paso 4",
    title: "Cómo comprar criptomonedas fuera de Estados Unidos",
    description:
      "Proceso básico para comprar criptomonedas cuando el usuario se encuentra fuera de Estados Unidos.",
    duration: "07:36",
    thumbnail: "/logo/logo carvipix.png",
    videoUrl: "/training-videos/step-4-crypto-fuera-usa.mp4",
  },
  {
    id: 5,
    stepLabel: "Paso 5",
    title: "Cómo comprar criptomonedas para depositar fondos",
    description:
      "Aprende a comprar criptomonedas y utilizarlas para realizar un depósito.",
    duration: "10:05",
    thumbnail: "/logo/logo carvipix.png",
    videoUrl: "/training-videos/step-5-crypto-deposito.mp4",
  },
  {
    id: 6,
    stepLabel: "Paso 6",
    title: "Cómo mantener una operación abierta",
    description:
      "Aprende a gestionar correctamente una operación después de abrirla.",
    duration: "06:18",
    thumbnail: "/logo/logo carvipix.png",
    videoUrl: "/training-videos/step-6-mantener-trade.mp4",
  },
];

export const telegramGroupUrl = "https://t.me/";
export const supportUrl = "mailto:soporte@carvipix.com";
