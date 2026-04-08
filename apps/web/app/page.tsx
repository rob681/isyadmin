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

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <img src="/logo.svg" alt="IsyAdmin" className="h-7 dark:hidden" />
          <img
            src="/logo-white.svg"
            alt="IsyAdmin"
            className="h-7 hidden dark:block"
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

        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-24 sm:pt-28 sm:pb-32 text-center relative">
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

      {/* How it works */}
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

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div key={step.step} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full gradient-primary text-white text-lg font-bold mb-4">
                  {step.step}
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-[calc(50%+24px)] w-[calc(100%-48px)] h-px bg-border" />
                )}
                <h3 className="text-base font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
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
              <img
                src="/icon.svg"
                alt="IsyAdmin"
                className="h-6"
              />
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
