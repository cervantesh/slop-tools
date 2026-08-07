import { useState } from "react";

// Datos con textura de mercado, sin nombres de relleno.
const talleres = [
  { id: "t-01", titulo: "Encuadernación japonesa", plazas: 3, precio: 4800 },
  { id: "t-02", titulo: "Tipografía de plomo móvil", plazas: 1, precio: 6200 },
  { id: "t-03", titulo: "Grabado en linóleo", plazas: 7, precio: 3900 },
];

const moneda = new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" });
const plazas = (n) => (n === 1 ? "1 plaza libre" : `${n} plazas libres`);

export default function App() {
  const [elegido, setElegido] = useState(null);

  return (
    <main className="medida">
      <div className="barra">
        <a href="/talleres">Talleres</a>
        <a href="/calendario">Calendario</a>
      </div>

      <h1>El taller de Villa Consuelo abre inscripción de invierno</h1>
      <p>
        Cinco sábados de trabajo con prensa manual. Se entra sabiendo poco y se sale
        con un cuaderno cosido a mano.
      </p>

      <section>
        <h2>Qué se puede coser este trimestre</h2>
        {talleres.map((t) => (
          <article key={t.id} className="tarjeta">
            <h3>{t.titulo}</h3>
            <p>{plazas(t.plazas)}</p>
            <p>{moneda.format(t.precio)}</p>
            <button className="accion" onClick={() => setElegido(t.id)}>
              Reservar plaza
            </button>
          </article>
        ))}
      </section>

      <article className="tarjeta-destacada">
        <h2>La prensa Chandler &amp; Price de 1912</h2>
        <p>
          Llegó a Santo Domingo en un barco de carga y estuvo veinte años parada en un
          almacén de la Duarte. Funciona a pedal y sigue imprimiendo.
        </p>
        <button className="accion-secundaria" aria-label="Ver la ficha técnica de la prensa">
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h14" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
      </article>

      {elegido && <p className="aviso">Plaza apartada. Te escribimos para confirmar el pago.</p>}
    </main>
  );
}
