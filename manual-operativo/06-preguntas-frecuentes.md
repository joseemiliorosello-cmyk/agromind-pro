# Sector 06 — Preguntas frecuentes y resolución de problemas

[← Volver al índice](README.md)

---

## Sobre la carga de datos

**No aparece la preñez estimada / la trayectoria de CC.**
Falta cargar la **distribución de CC del rodeo** (paso 2) y/o las **fechas de servicio**.
Son los dos datos que activan la proyección reproductiva. Sin ellos la app no puede
proyectar.

**Los porcentajes de destete no me dejan avanzar.**
Los tres (tradicional + anticipado + hiperprecoz) deben **sumar 100 %**. Si solo usás
uno, ponelo en 100 y los otros en 0.

**Cargué potreros pero el balance no cambia mucho.**
Verificá que cada potrero tenga **hectáreas** y **altura de pasto** cargadas. Sin esos
datos, el potrero no aporta a la disponibilidad y la app usa los datos generales del campo.

**El GPS no detecta la ubicación.**
Puede ser permiso del navegador denegado o sin señal. Podés **elegir la zona y provincia
manualmente** — el modelo climático funciona igual (solo perdés el NDVI y el clima en
tiempo real de ese punto exacto).

**El NDVI dice "estimado" o "proxy".**
El NDVI es un **valor satelital aproximado** comparado con el histórico de la zona. Es
orientativo, no una medición de precisión de tu potrero puntual.

---

## Sobre los resultados

**La preñez estimada no coincide con mi preñez histórica.**
Son dos cosas distintas. La **histórica** es lo que pasó (dato que cargás). La **estimada**
es lo que el modelo proyecta **según la CC y el manejo actuales**. Si difieren mucho,
suele indicar que algo cambió (mejor/peor año) o que hay un dato de CC poco representativo.

**La CC al servicio me da más alta de lo que espero.**
La recuperación de CC post-destete depende del **pasto disponible**. Si el campo tiene
poco pasto o está encañado, cargá bien la **fenología y la disponibilidad** — el
`factorForrajero` va a bajar la recuperación proyectada y la CC al servicio será más realista.

**El peso de la vaquillona al entore me da muy alto.**
Verificá el **PV de entrada** y, sobre todo, si cargaste el **PV medido al 2do invierno**.
La app usa el peso medido directo si está cargado (no le vuelve a sumar el verano). Si
cargás pesos inconsistentes, el resultado se distorsiona.

**No entiendo por qué un mes está en déficit si el campo está verde.**
Tres causas frecuentes: (1) **agua salina** que reduce el consumo efectivo; (2)
**sobrecarga** (muchos animales/ha); (3) la **demanda del mes** es alta porque las vacas
están en plena lactación. Mirá el tooltip del mes para ver el estado fisiológico.

---

## Sobre los documentos

**¿Qué contiene el Excel?**
El Excel trae **6 hojas**: Establecimiento, Balance mensual, Diagnóstico, Reproducción,
Recomendaciones (el detalle de la consulta de hoy) y **Historial** (una fila por visita,
para el seguimiento en el tiempo). Ver el detalle en el Sector 04.

**¿Se pierden los datos si cierro la app?**
No. Se **guardan en el dispositivo** automáticamente. El historial de visitas también.
Pero **son locales**: si cambiás de dispositivo o borrás datos del navegador, se pierden.
Exportá el Excel periódicamente como respaldo.

**El PDF sale con el nombre "agromind" y el Excel con "calfai".**
Es esperado. El proyecto se llama **AgroMind Pro** internamente; la marca comercial que
ve el productor en los informes es **CALFAI**.

---

## Sobre el acceso

**Me dice "Acceso no autorizado".**
Tu correo de Google no está en la **lista de autorizados**. El administrador debe
agregarlo a la variable `ALLOWED_EMAILS`. Es una medida para que la app sea privada.

---

## Límites del modelo (importante)

- La app es una **herramienta de apoyo a la decisión**, no un reemplazo del criterio
  profesional.
- Todos los resultados son **estimaciones** basadas en modelos y en los datos cargados.
  **Basura entra, basura sale**: la calidad del diagnóstico depende de la calidad de la CC,
  las fechas y los números que cargues.
- Los modelos están **calibrados para cría extensiva del NEA/Chaco** y regiones
  subtropicales similares. Fuera de ese contexto, interpretá con cautela.
- El NDVI y el clima satelital son **aproximaciones** regionales, no mediciones de tu
  lote exacto.

---

## ¿Dudas o mejoras?

Este manual y la app están en desarrollo continuo. Si encontrás algo que no cierra, un
cálculo que querés entender mejor, o una función que te gustaría, anotalo y pedilo.

---

[← Sector 05](05-glosario-y-fundamento.md) · [Volver al índice](README.md)
