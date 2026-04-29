export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { productor, fecha, zona, vacas, ccPond, ccServ, prenezEst, condForr, aguaTDS, resumenInforme } = req.body || {};

  // Log en Vercel Functions (visible en el dashboard de Vercel)
  console.log("[notify-owner]", JSON.stringify({
    productor, fecha, zona, vacas, ccPond, ccServ, prenezEst, condForr, aguaTDS,
    resumen: resumenInforme?.slice(0, 200),
  }));

  // TODO: integrar email (SendGrid, Resend, etc.) cuando se quiera notificación activa
  res.status(200).json({ ok: true });
}
