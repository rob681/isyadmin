import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IsyAdmin - Tu dinero, claro y simple",
  description:
    "Sube tus estados de cuenta, la IA clasifica tus gastos automáticamente. Separa personal de negocio, detecta suscripciones, y toma el control de tus finanzas.",
};

const features = [
  {
    icon: "📄",
    title: "Sube tu estado de cuenta",
    description:
      "Arrastra el PDF de cualquier banco mexicano. La IA lee, interpreta y clasifica cada movimiento en segundos.",
  },
  {
    icon: "🤖",
    title: "Clasificación inteligente",
    description:
      "Detecta automáticamente el tipo de gasto, comercio, suscripciones recurrentes, MSI y domiciliaciones.",
  },
  {
    icon: "🏠",
    title: "Personal y Negocio",
    description:
      "Separa tus gastos personales de los de negocio en la misma tarjeta. Marca cada movimiento donde corresponde.",
  },
  {
    icon: "📊",
    title: "Dashboard inteligente",
    description:
      "Visualiza ingresos, egresos, tendencias y alertas. Entiende tu dinero de un vistazo con insights de IA.",
  },
  {
    icon: "🧾",
    title: "Facturas y deducibles",
    description:
      "Registra facturas, identifica gastos deducibles automáticamente y mantén todo listo para tu contador.",
  },
  {
    icon: "👥",
    title: "Comparte con tu equipo",
    description:
      "Invita a tu pareja, socio o contador. Compartan la misma visión financiera sin complicaciones.",
  },
];

const steps = [
  {
    step: "1",
    title: "Regístrate gratis",
    description: "Crea tu cuenta en 30 segundos. Sin tarjeta de crédito.",
  },
  {
    step: "2",
    title: "Sube un PDF",
    description: "Arrastra el estado de cuenta de tu banco favorito.",
  },
  {
    step: "3",
    title: "Revisa y confirma",
    description: "La IA clasifica todo. Tú solo confirmas o ajustas.",
  },
  {
    step: "4",
    title: "Toma el control",
    description: "Ve tu dashboard con insights, alertas y recomendaciones.",
  },
];

const banks = [
  "BBVA",
  "Citibanamex",
  "Banorte",
  "Santander",
  "HSBC",
  "Scotiabank",
  "Nu",
  "Hey Banco",
  "Inbursa",
  "BanCoppel",
];

/* ── Mockup Components ── */

function DashboardMockup() {
  return (
    <div className="rounded-2xl border bg-card shadow-2xl shadow-primary/10 overflow-hidden max-w-4xl mx-auto">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/50 border-b">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="px-4 py-1 rounded-md bg-background text-xs text-muted-foreground font-mono">
            isyadmin-web.vercel.app/dashboard
          </div>
        </div>
      </div>

      {/* Dashboard content */}
      <div className="flex">
        {/* Mini sidebar */}
        <div className="hidden sm:flex w-44 flex-col border-r bg-muted/30 p-3 gap-1">
          <div className="flex items-center gap-2 px-2 py-1.5 mb-3">
            <img src="/icon.svg" alt="" className="h-5" />
            <span className="text-xs font-bold gradient-text">IsyAdmin</span>
          </div>
          {["Dashboard", "Mis cuentas", "Movimientos", "Facturas", "Estados de cuenta"].map((item, i) => (
            <div
              key={item}
              className={`px-2 py-1.5 rounded-lg text-[11px] ${
                i === 0
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground"
              }`}
            >
              {item}
            </div>
          ))}
        </div>

        {/* Main area */}
        <div className="flex-1 p-4 sm:p-5 space-y-4">
          {/* Balance cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 p-3 text-white">
              <p className="text-[10px] opacity-80">Ingresos</p>
              <p className="text-lg sm:text-xl font-bold">$45,200</p>
              <p className="text-[10px] opacity-70 mt-0.5">+12% vs mes anterior</p>
            </div>
            <div className="rounded-xl border bg-card p-3">
              <p className="text-[10px] text-muted-foreground">Egresos</p>
              <p className="text-lg sm:text-xl font-bold text-foreground">$32,850</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">-5% vs mes anterior</p>
            </div>
            <div className="rounded-xl border bg-card p-3">
              <p className="text-[10px] text-muted-foreground">Balance</p>
              <p className="text-lg sm:text-xl font-bold text-green-600">$12,350</p>
              <p className="text-[10px] text-green-600 mt-0.5">Positivo</p>
            </div>
          </div>

          {/* Accounts + Movements */}
          <div className="grid sm:grid-cols-2 gap-3">
            {/* Accounts */}
            <div className="rounded-xl border p-3 space-y-2">
              <p className="text-xs font-semibold">Mis cuentas</p>
              {[
                { bank: "BBVA", balance: "$18,450", color: "bg-blue-500" },
                { bank: "Nu", balance: "$6,200", color: "bg-purple-500" },
                { bank: "Banorte", balance: "$3,700", color: "bg-red-500" },
              ].map((acc) => (
                <div key={acc.bank} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${acc.color}`} />
                    <span className="text-[11px]">{acc.bank}</span>
                  </div>
                  <span className="text-[11px] font-medium">{acc.balance}</span>
                </div>
              ))}
            </div>

            {/* Recent movements */}
            <div className="rounded-xl border p-3 space-y-2">
              <p className="text-xs font-semibold">Últimos movimientos</p>
              {[
                { name: "Spotify", amount: "-$169", type: "sub", scope: "P" },
                { name: "Uber Eats", amount: "-$285", type: "cargo", scope: "P" },
                { name: "Transferencia recibida", amount: "+$15,000", type: "abono", scope: "N" },
                { name: "Amazon Prime", amount: "-$99", type: "sub", scope: "P" },
              ].map((m, i) => (
                <div key={i} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[8px] ${
                      m.type === "abono" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                    }`}>
                      {m.type === "abono" ? "+" : "-"}
                    </div>
                    <div>
                      <span className="text-[11px]">{m.name}</span>
                      {m.type === "sub" && (
                        <span className="ml-1 text-[8px] px-1 py-0.5 rounded bg-blue-100 text-blue-600">Recurrente</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-[11px] font-medium ${m.type === "abono" ? "text-green-600" : ""}`}>
                      {m.amount}
                    </span>
                    <span className={`ml-1 text-[8px] px-1 py-0.5 rounded ${
                      m.scope === "N" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {m.scope === "N" ? "Negocio" : "Personal"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PdfUploadMockup() {
  return (
    <div className="rounded-2xl border bg-card shadow-xl overflow-hidden">
      <div className="p-5 space-y-4">
        <div className="text-center">
          <p className="text-sm font-semibold mb-1">Sube tu estado de cuenta</p>
          <p className="text-xs text-muted-foreground">Arrastra o selecciona un PDF</p>
        </div>

        {/* Dropzone */}
        <div className="border-2 border-dashed border-primary/30 rounded-xl p-6 text-center bg-primary/5">
          <div className="text-3xl mb-2">📄</div>
          <p className="text-xs text-primary font-medium">BBVA_Estado_Marzo_2026.pdf</p>
          <p className="text-[10px] text-muted-foreground mt-1">2.4 MB</p>
          <div className="mt-3 h-1.5 rounded-full bg-primary/20 overflow-hidden">
            <div className="h-full rounded-full gradient-primary w-[85%]" />
          </div>
          <p className="text-[10px] text-primary mt-1">Procesando con IA...</p>
        </div>

        {/* Extracted preview */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-[10px] text-green-600">
            <span>&#10003;</span> Banco detectado: BBVA
          </div>
          <div className="flex items-center gap-2 text-[10px] text-green-600">
            <span>&#10003;</span> Periodo: 01 Mar - 31 Mar 2026
          </div>
          <div className="flex items-center gap-2 text-[10px] text-green-600">
            <span>&#10003;</span> 47 movimientos encontrados
          </div>
          <div className="flex items-center gap-2 text-[10px] text-green-600">
            <span>&#10003;</span> 12 suscripciones detectadas
          </div>
        </div>
      </div>
    </div>
  );
}

function ClassificationMockup() {
  return (
    <div className="rounded-2xl border bg-card shadow-xl overflow-hidden">
      <div className="p-5 space-y-3">
        <p className="text-sm font-semibold">Revisión inteligente</p>

        {/* Table header */}
        <div className="grid grid-cols-[1fr_70px_70px_50px] gap-2 text-[10px] font-medium text-muted-foreground border-b pb-2">
          <span>Descripción</span>
          <span>Monto</span>
          <span>Categoría</span>
          <span>Ámbito</span>
        </div>

        {/* Rows */}
        {[
          { desc: "SPOTIFY MEXICO", amount: "$169", cat: "Entretenimiento", scope: "Personal", conf: 95 },
          { desc: "AMAZON MX *MKTPL", amount: "$1,299", cat: "Compras", scope: "Negocio", conf: 88 },
          { desc: "UBER TRIP", amount: "$85", cat: "Transporte", scope: "Personal", conf: 92 },
          { desc: "GOOGLE *CLOUD", amount: "$450", cat: "Software", scope: "Negocio", conf: 97 },
          { desc: "OXXO GAS", amount: "$800", cat: "Gasolina", scope: "Personal", conf: 90 },
        ].map((row, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_70px_70px_50px] gap-2 items-center text-[11px] py-1.5 border-b border-border/50"
          >
            <div>
              <span className="font-medium">{row.desc}</span>
              {row.conf >= 95 && (
                <span className="ml-1 text-[8px] px-1 py-0.5 rounded bg-green-100 text-green-700">{row.conf}%</span>
              )}
              {row.conf >= 85 && row.conf < 95 && (
                <span className="ml-1 text-[8px] px-1 py-0.5 rounded bg-yellow-100 text-yellow-700">{row.conf}%</span>
              )}
              {row.cat === "Software" && (
                <span className="ml-1 text-[8px] px-1 py-0.5 rounded bg-blue-100 text-blue-700">Deducible</span>
              )}
            </div>
            <span className="text-red-600 font-medium">-{row.amount}</span>
            <span className="px-1.5 py-0.5 rounded-md bg-muted text-[10px]">{row.cat}</span>
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] text-center ${
              row.scope === "Negocio"
                ? "bg-amber-100 text-amber-700"
                : "bg-gray-100 text-gray-600"
            }`}>
              {row.scope === "Negocio" ? "Neg" : "Per"}
            </span>
          </div>
        ))}

        <div className="flex items-center justify-between pt-2">
          <span className="text-[10px] text-muted-foreground">5 de 47 movimientos</span>
          <div className="px-3 py-1.5 rounded-lg gradient-primary text-white text-[10px] font-medium">
            Confirmar todos
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <img src="/logo.svg" alt="IsyAdmin" className="h-9 dark:hidden" />
          <img
            src="/logo-white.svg"
            alt="IsyAdmin"
            className="h-9 hidden dark:block"
          />
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/registro"
              className="inline-flex items-center justify-center h-9 px-5 rounded-lg gradient-primary text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Registrarse gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-1/3 -left-1/4 w-[700px] h-[700px] rounded-full bg-[hsl(199,89%,48%)] opacity-[0.06] blur-[120px]" />
          <div className="absolute -bottom-1/3 -right-1/4 w-[700px] h-[700px] rounded-full bg-[hsl(172,66%,50%)] opacity-[0.06] blur-[120px]" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-8 sm:pt-24 sm:pb-12 text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Disponible para bancos mexicanos
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight leading-[1.1] max-w-3xl mx-auto">
            Tu dinero,{" "}
            <span className="gradient-text">claro y simple</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Sube el PDF de tu estado de cuenta y la inteligencia artificial
            clasifica tus gastos, detecta suscripciones y te muestra exactamente
            a dónde va tu dinero.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/registro"
              className="inline-flex items-center justify-center h-12 px-8 rounded-xl gradient-primary text-white text-base font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/25"
            >
              Empezar gratis
            </Link>
            <a
              href="#como-funciona"
              className="inline-flex items-center justify-center h-12 px-8 rounded-xl border text-base font-medium hover:bg-accent transition-colors"
            >
              Ver cómo funciona
            </a>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Sin tarjeta de crédito. Listo en 30 segundos.
          </p>
        </div>

        {/* Hero Mockup */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24 relative">
          <DashboardMockup />
        </div>
      </section>

      {/* Banks */}
      <section className="border-y bg-accent/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <p className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider mb-5">
            Compatible con los principales bancos de México
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {banks.map((bank) => (
              <span
                key={bank}
                className="text-sm font-semibold text-muted-foreground/60"
              >
                {bank}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold font-display">
              Todo lo que necesitas para{" "}
              <span className="gradient-text">controlar tus finanzas</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Diseñado para personas, emprendedores y pequeñas empresas en
              México.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border bg-card p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
              >
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-base font-semibold mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — with visual mockups */}
      <section id="como-funciona" className="py-20 sm:py-28 bg-accent/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold font-display">
              Cómo funciona
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              De PDF a dashboard inteligente en menos de un minuto.
            </p>
          </div>

          {/* Step 1 — Upload */}
          <div className="grid lg:grid-cols-2 gap-10 items-center mb-20">
            <div className="order-2 lg:order-1">
              <PdfUploadMockup />
            </div>
            <div className="order-1 lg:order-2 space-y-4">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full gradient-primary text-white text-sm font-bold">
                1
              </div>
              <h3 className="text-2xl font-bold font-display">Sube el PDF de tu banco</h3>
              <p className="text-muted-foreground leading-relaxed">
                Arrastra el estado de cuenta en PDF de cualquier banco mexicano.
                La inteligencia artificial extrae el texto, identifica el banco,
                el periodo, y encuentra cada movimiento automáticamente.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">&#10003;</span> BBVA, Citibanamex, Banorte, Nu y más
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">&#10003;</span> Detecta suscripciones y MSI
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">&#10003;</span> Procesamiento en segundos
                </li>
              </ul>
            </div>
          </div>

          {/* Step 2 — Classify */}
          <div className="grid lg:grid-cols-2 gap-10 items-center mb-20">
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full gradient-primary text-white text-sm font-bold">
                2
              </div>
              <h3 className="text-2xl font-bold font-display">Revisa la clasificación</h3>
              <p className="text-muted-foreground leading-relaxed">
                La IA clasifica cada movimiento con su categoría, tipo y nivel de confianza.
                Decide si cada gasto es personal o de negocio, y detecta automáticamente
                los gastos deducibles.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">&#10003;</span> Clasificación con score de confianza
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">&#10003;</span> Toggle Personal / Negocio por movimiento
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">&#10003;</span> Detección automática de deducibles
                </li>
              </ul>
            </div>
            <div>
              <ClassificationMockup />
            </div>
          </div>

          {/* Step 3 — Dashboard */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full gradient-primary text-white text-sm font-bold">
              3
            </div>
            <h3 className="text-2xl font-bold font-display">Toma el control</h3>
            <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Tu dashboard muestra ingresos, egresos, balance por cuenta,
              movimientos recurrentes y alertas inteligentes. Todo en un solo lugar,
              actualizado con cada PDF que subas.
            </p>
          </div>
        </div>
      </section>

      {/* Personas */}
      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold font-display">
              Para cada tipo de usuario
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            <div className="rounded-2xl border bg-card p-8 text-center">
              <div className="text-4xl mb-4">🏠</div>
              <h3 className="text-lg font-bold mb-2">Hogar</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Controla los gastos del hogar, detecta suscripciones que
                olvidaste y comparte la visión con tu pareja.
              </p>
            </div>

            <div className="rounded-2xl border-2 border-primary/30 bg-card p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 rounded-bl-xl gradient-primary text-white text-[10px] font-bold uppercase">
                Popular
              </div>
              <div className="text-4xl mb-4">💼</div>
              <h3 className="text-lg font-bold mb-2">Emprendedor</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Separa gastos personales de negocio, identifica deducibles y
                mantén tus facturas organizadas.
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-8 text-center">
              <div className="text-4xl mb-4">🏢</div>
              <h3 className="text-lg font-bold mb-2">Empresa</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Invita a tu equipo, controla múltiples cuentas bancarias y ten
                visibilidad total de tu flujo de caja.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-[hsl(199,89%,48%)] opacity-[0.04] blur-[100px]" />
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center relative">
          <h2 className="text-3xl sm:text-4xl font-bold font-display">
            Empieza a entender tu dinero{" "}
            <span className="gradient-text">hoy</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Únete a IsyAdmin y transforma un PDF aburrido en decisiones
            financieras inteligentes.
          </p>
          <div className="mt-8">
            <Link
              href="/registro"
              className="inline-flex items-center justify-center h-12 px-10 rounded-xl gradient-primary text-white text-base font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/25"
            >
              Crear cuenta gratis
            </Link>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Sin tarjeta. Sin compromisos. Cancela cuando quieras.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/icon.svg" alt="IsyAdmin" className="h-6" />
              <span className="text-sm text-muted-foreground">
                IsyAdmin &copy; {new Date().getFullYear()}
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link
                href="/login"
                className="hover:text-foreground transition-colors"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/registro"
                className="hover:text-foreground transition-colors"
              >
                Registrarse
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
