# IsyAdmin — Arquitectura Completa del MVP

> "Complejo por dentro, ridiculamente simple por fuera"

---

## 1. ARQUITECTURA GENERAL DEL SISTEMA

### Visión de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────┐
│                        USUARIO FINAL                            │
│              (Web App — Mobile First PWA)                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │   Next.js   │  App Router + RSC
                    │   14.2.0    │  (apps/web)
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │    tRPC     │  Type-safe API
                    │   10.45    │  (packages/api)
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
   ┌──────▼──────┐ ┌──────▼──────┐ ┌───────▼───────┐
   │  PostgreSQL  │ │  Supabase   │ │   Pipeline    │
   │   (Prisma)   │ │  Storage    │ │   de IA       │
   │  isyadmin    │ │  (PDFs)     │ │               │
   │   schema     │ │             │ │  Document AI  │
   └──────────────┘ └─────────────┘ │  + Claude     │
                                    │  + Reglas     │
                                    └───────────────┘
```

### Integración con Ecosistema Isy

IsyAdmin es el **tercer producto** del ecosistema. Reutiliza:

| Componente | Patrón Existente | Adaptación IsyAdmin |
|---|---|---|
| Auth | NextAuth 4 + JWT (30 días) | Misma config, roles propios |
| Multi-tenant | Agency → agencyId en todo | Idéntico |
| DB | Prisma 5 + schema propio | Schema `isyadmin` en mismo Supabase |
| Storage | Supabase buckets | Bucket `statements` para PDFs |
| Billing | Stripe por producto | Nuevos price IDs para IsyAdmin |
| Cross-product | shared-db.ts + Organization | Mismo patrón, nuevo Product enum |
| SSO | shared.sso_sessions | Navegación IsyTask ↔ IsyAdmin |
| UI | Radix + Tailwind + shadcn | Misma librería, theme propio |
| Monorepo | pnpm workspaces + Turbo | Nuevo monorepo `/isyadmin` |

### Separación de Concerns

```
isyadmin/
├── apps/web/              → Frontend (Next.js 14, App Router)
├── packages/api/          → Backend (tRPC routers + servicios)
├── packages/db/           → Prisma schema + migraciones
├── packages/shared/       → Types, validators, constants
└── packages/ai-pipeline/  → Motor de procesamiento PDF → datos
```

---

## 2. ARQUITECTURA DE INFORMACIÓN DEL PRODUCTO

### Mapa del Producto (MVP)

```
IsyAdmin
│
├── 🏠 Dashboard Principal
│   ├── Semáforo financiero
│   ├── Balance del mes
│   ├── Próximos pagos (top 5)
│   ├── Alertas activas
│   └── CTA: "Subir estado de cuenta" / "Agregar movimiento"
│
├── 📄 Estados de Cuenta
│   ├── Subir PDF
│   ├── Historial de archivos subidos
│   └── Detalle de procesamiento (por archivo)
│
├── 💰 Movimientos
│   ├── Lista cronológica (filtrable)
│   ├── Detalle de movimiento
│   ├── Agregar ingreso manual
│   └── Agregar gasto manual
│
├── 🔄 Recurrentes
│   ├── Pagos recurrentes detectados
│   ├── Suscripciones activas
│   └── Mensualidades (MSI / préstamos)
│
├── 🔔 Alertas
│   ├── Vencimientos próximos
│   ├── Gastos fuera de patrón
│   └── Riesgo de flujo
│
├── 📊 Reportes (v2 - placeholder)
│
└── ⚙️ Configuración
    ├── Perfil / Empresa
    ├── Categorías personalizadas
    ├── Facturación (Stripe)
    └── Equipo (multi-usuario)
```

### Taxonomía de Categorías (Default)

```
INGRESOS
├── Salario / Nómina
├── Venta de productos
├── Venta de servicios
├── Freelance
├── Inversiones
├── Reembolso
└── Otro ingreso

EGRESOS
├── Vivienda
│   ├── Renta
│   ├── Hipoteca
│   ├── Servicios (luz, agua, gas, internet)
│   └── Mantenimiento
├── Alimentación
│   ├── Supermercado
│   ├── Restaurantes
│   └── Delivery
├── Transporte
│   ├── Gasolina
│   ├── Transporte público
│   ├── Uber/taxi
│   └── Estacionamiento
├── Salud
├── Educación
├── Entretenimiento
├── Ropa y accesorios
├── Tecnología
├── Suscripciones digitales
├── Seguros
├── Impuestos
├── Negocio
│   ├── Nómina
│   ├── Software/herramientas
│   ├── Publicidad
│   ├── Insumos
│   └── Servicios profesionales
└── Otro gasto

FINANCIEROS
├── Comisión bancaria
├── Intereses cobrados
├── Anualidad tarjeta
├── Cargo por mora
└── Pago de tarjeta
```

---

## 3. FLUJO COMPLETO DEL USUARIO

### Flujo de Onboarding (Primera Vez)

```
1. Registro (email + password)
        ↓
2. "¿Cómo usarás IsyAdmin?"
   [ ] Personal / Hogar
   [ ] Emprendedor
   [ ] Empresa pequeña
        ↓
3. "Sube tu primer estado de cuenta"
   [Arrastra tu PDF aquí]
   o [Prefiero capturar manualmente →]
        ↓
4. Procesamiento (pantalla de espera con progreso)
   "Estamos leyendo tu estado de cuenta..."
   ████████████░░ 75%
        ↓
5. Revisión rápida
   "Encontramos 47 movimientos de Banorte"
   "Periodo: Mar 2026 | Saldo: $12,450"
   [Se ve bien ✓] [Necesito corregir algo]
        ↓
6. Dashboard con datos
```

### Flujo de Subida de PDF (Uso Regular)

```
1. Dashboard → "Subir estado de cuenta" (FAB o CTA)
        ↓
2. Selección de archivo (drag & drop o file picker)
        ↓
3. Upload a Supabase Storage
        ↓
4. Job async entra a cola:
   a. Document AI extrae texto + tablas
   b. Claude interpreta y estructura
   c. Reglas de negocio validan
   d. Scoring de confianza
        ↓
5. Notificación: "Tu estado de cuenta está listo"
        ↓
6. Pantalla de revisión:
   - Datos del estado (banco, periodo, saldo)
   - Lista de movimientos detectados
   - Movimientos con baja confianza resaltados
   - Usuario puede corregir categoría, tipo, etc.
        ↓
7. Confirmar → datos se integran al dashboard
```

### Flujo de Captura Manual

```
1. "+" flotante → [Ingreso] o [Gasto]
        ↓
2. Formulario mínimo:
   - Monto (input grande, prominente)
   - Descripción (texto libre)
   - Fecha (default: hoy)
   - Categoría (sugerida por IA al escribir descripción)
   - [Personal] [Negocio] toggle
        ↓
3. Guardar → aparece en movimientos + dashboard actualizado
```

---

## 4. WIREFRAMES ESCRITOS (PANTALLA POR PANTALLA)

### 4.1 Login

```
┌──────────────────────────────────┐
│                                  │
│         [Logo IsyAdmin]          │
│    "Tu dinero, claro y simple"   │
│                                  │
│   ┌──────────────────────────┐   │
│   │ Email                    │   │
│   └──────────────────────────┘   │
│   ┌──────────────────────────┐   │
│   │ Contraseña           👁  │   │
│   └──────────────────────────┘   │
│                                  │
│   [    Iniciar sesión    ]       │
│                                  │
│   ¿No tienes cuenta? Regístrate  │
│   Olvidé mi contraseña           │
│                                  │
└──────────────────────────────────┘
```

### 4.2 Dashboard Principal

```
┌─────────────────────────────────────────────────┐
│ ☰  IsyAdmin            [+ Agregar]  [🔔] [👤]  │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌─────────────────────────────────────────┐     │
│  │  🟢 Tu salud financiera: ESTABLE        │     │
│  │  "Tus gastos están dentro de lo normal   │     │
│  │   y no tienes pagos vencidos"            │     │
│  └─────────────────────────────────────────┘     │
│                                                  │
│  ┌──────────────┐  ┌──────────────┐              │
│  │ Ingresos     │  │ Gastos       │              │
│  │  $45,000     │  │  $32,150     │              │
│  │  este mes    │  │  este mes    │              │
│  └──────────────┘  └──────────────┘              │
│                                                  │
│  ┌──────────────┐  ┌──────────────┐              │
│  │ Disponible   │  │ Por pagar    │              │
│  │  $12,850     │  │  $8,400      │              │
│  │              │  │  próx. 7 días│              │
│  └──────────────┘  └──────────────┘              │
│                                                  │
│  PRÓXIMOS PAGOS                                  │
│  ┌─────────────────────────────────────────┐     │
│  │ 🔴 Tarjeta BBVA      $5,200   Abr 10  │     │
│  │ 🟡 Netflix            $299    Abr 12  │     │
│  │ 🟢 Spotify            $169    Abr 15  │     │
│  │ 🟢 Renta oficina    $3,500    Abr 20  │     │
│  └─────────────────────────────────────────┘     │
│                                                  │
│  ALERTAS                                         │
│  ┌─────────────────────────────────────────┐     │
│  │ ⚠️ Gastaste 40% más en restaurantes     │     │
│  │    que el mes pasado                     │     │
│  │ ℹ️ Tienes 3 MSI que terminan en Mayo     │     │
│  └─────────────────────────────────────────┘     │
│                                                  │
│  ┌─────────────────────────────────────────┐     │
│  │    [📄 Subir estado de cuenta]           │     │
│  └─────────────────────────────────────────┘     │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 4.3 Subida de PDF

```
┌─────────────────────────────────────────────────┐
│ ← Subir estado de cuenta                        │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌─────────────────────────────────────────┐     │
│  │                                         │     │
│  │     ┌───────────────────────┐           │     │
│  │     │                       │           │     │
│  │     │    📄                  │           │     │
│  │     │                       │           │     │
│  │     │  Arrastra tu PDF aquí │           │     │
│  │     │  o haz clic para      │           │     │
│  │     │  seleccionar          │           │     │
│  │     │                       │           │     │
│  │     └───────────────────────┘           │     │
│  │                                         │     │
│  │  Formatos: PDF                          │     │
│  │  Máximo: 20 MB                          │     │
│  │                                         │     │
│  └─────────────────────────────────────────┘     │
│                                                  │
│  ARCHIVOS ANTERIORES                             │
│  ┌─────────────────────────────────────────┐     │
│  │ ✅ Banorte Mar 2026    47 movimientos   │     │
│  │ ✅ BBVA Feb 2026       52 movimientos   │     │
│  │ ✅ BBVA Ene 2026       38 movimientos   │     │
│  └─────────────────────────────────────────┘     │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 4.4 Procesamiento (Estado de Espera)

```
┌─────────────────────────────────────────────────┐
│                                                  │
│              📄 → 🤖 → ✅                        │
│                                                  │
│     "Estamos leyendo tu estado de cuenta"        │
│                                                  │
│     ████████████░░░░░░░░  60%                    │
│                                                  │
│     ✅ Archivo recibido                          │
│     ✅ Texto extraído                            │
│     🔄 Interpretando movimientos...              │
│     ○ Clasificando categorías                    │
│     ○ Detectando recurrentes                     │
│                                                  │
│     Esto toma entre 30 segundos y 2 minutos.     │
│     Te notificaremos cuando esté listo.          │
│                                                  │
│     [Ir al dashboard mientras tanto →]           │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 4.5 Revisión de Estado de Cuenta Procesado

```
┌─────────────────────────────────────────────────┐
│ ← Revisión: Banorte Mar 2026                    │
├─────────────────────────────────────────────────┤
│                                                  │
│  DATOS DEL ESTADO                                │
│  ┌─────────────────────────────────────────┐     │
│  │ Banco: Banorte                          │     │
│  │ Periodo: 01 Mar - 31 Mar 2026           │     │
│  │ Corte: 25 Mar 2026                      │     │
│  │ Límite de pago: 10 Abr 2026             │     │
│  │ Saldo actual: $12,450.00                │     │
│  │ Pago mínimo: $1,245.00                  │     │
│  │ Pago sin intereses: $12,450.00          │     │
│  │                          [✏️ Editar]     │     │
│  └─────────────────────────────────────────┘     │
│                                                  │
│  MOVIMIENTOS (47)           [Filtrar ▾]          │
│  ┌─────────────────────────────────────────┐     │
│  │ 🟢 01 Mar  Amazon          -$599    │ ✓ │     │
│  │            Compras > Tech   95%         │     │
│  │                                         │     │
│  │ 🟡 03 Mar  SPEI recibido  +$25,000 │ ✓ │     │
│  │            Ingreso > Nómina  72%        │     │
│  │            ⚠️ Verificar categoría       │     │
│  │                                         │     │
│  │ 🟢 05 Mar  Netflix         -$299   │ ✓ │     │
│  │            Suscripción   99%  🔄        │     │
│  │            Recurrente detectado         │     │
│  │                                         │     │
│  │ 🔴 07 Mar  CIE 12345      -$2,100 │ ✓ │     │
│  │            Sin categoría  45%           │     │
│  │            ⚠️ No pudimos identificar    │     │
│  │            [Seleccionar categoría ▾]    │     │
│  └─────────────────────────────────────────┘     │
│                                                  │
│  [   Confirmar todo   ]                          │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 4.6 Movimientos (Lista)

```
┌─────────────────────────────────────────────────┐
│ Movimientos          [🔍]  [Filtrar ▾]          │
├─────────────────────────────────────────────────┤
│                                                  │
│  [Todo] [Personal] [Negocio]                     │
│                                                  │
│  ABRIL 2026                   Gastos: -$18,200   │
│  ┌─────────────────────────────────────────┐     │
│  │ 01 Abr  Uber Eats      -$385           │     │
│  │         Alimentación > Delivery  🏠     │     │
│  ├─────────────────────────────────────────┤     │
│  │ 01 Abr  Canva Pro      -$299           │     │
│  │         Suscripciones  🔄  💼           │     │
│  ├─────────────────────────────────────────┤     │
│  │ 02 Abr  SPEI recibido  +$45,000        │     │
│  │         Ingreso > Nómina  🏠            │     │
│  └─────────────────────────────────────────┘     │
│                                                  │
│  MARZO 2026                  Gastos: -$32,150    │
│  ┌─────────────────────────────────────────┐     │
│  │ ...                                     │     │
│  └─────────────────────────────────────────┘     │
│                                                  │
│              [+ Agregar movimiento]              │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 4.7 Agregar Movimiento Manual

```
┌─────────────────────────────────────────────────┐
│ ← Nuevo movimiento                              │
├─────────────────────────────────────────────────┤
│                                                  │
│  [  Gasto  ] [Ingreso]                           │
│                                                  │
│  ┌─────────────────────────────────────────┐     │
│  │              $ 0.00                     │     │
│  │         (input grande, central)         │     │
│  └─────────────────────────────────────────┘     │
│                                                  │
│  Descripción                                     │
│  ┌─────────────────────────────────────────┐     │
│  │ Ej: "Comida con cliente"                │     │
│  └─────────────────────────────────────────┘     │
│  💡 Sugerencia: Alimentación > Restaurantes      │
│                                                  │
│  Fecha                                           │
│  ┌─────────────────────────────────────────┐     │
│  │ 07 Abr 2026                      📅   │     │
│  └─────────────────────────────────────────┘     │
│                                                  │
│  Categoría                                       │
│  ┌─────────────────────────────────────────┐     │
│  │ Alimentación > Restaurantes       ▾    │     │
│  └─────────────────────────────────────────┘     │
│                                                  │
│  ┌──────────────────┐                            │
│  │ 🏠 Personal      │  ← toggle                 │
│  │ 💼 Negocio       │                            │
│  └──────────────────┘                            │
│                                                  │
│  [       Guardar       ]                         │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 4.8 Recurrentes

```
┌─────────────────────────────────────────────────┐
│ Pagos Recurrentes                                │
├─────────────────────────────────────────────────┤
│                                                  │
│  SUSCRIPCIONES                    Total: $1,847  │
│  ┌─────────────────────────────────────────┐     │
│  │ Netflix         $299/mes    Próx: 12 Abr│     │
│  │ Spotify         $169/mes    Próx: 15 Abr│     │
│  │ iCloud          $49/mes     Próx: 18 Abr│     │
│  │ ChatGPT Plus    $399/mes    Próx: 20 Abr│     │
│  │ Canva Pro       $299/mes    Próx: 22 Abr│     │
│  │ Adobe CC        $632/mes    Próx: 01 May│     │
│  └─────────────────────────────────────────┘     │
│                                                  │
│  SERVICIOS                        Total: $4,200  │
│  ┌─────────────────────────────────────────┐     │
│  │ CFE (Luz)     ~$850/bim    Próx: May    │     │
│  │ Telmex          $599/mes    Próx: 15 Abr│     │
│  │ Gas Natural   ~$350/mes    Próx: 20 Abr│     │
│  │ Agua          ~$180/bim    Próx: May    │     │
│  └─────────────────────────────────────────┘     │
│                                                  │
│  MENSUALIDADES (MSI / PRÉSTAMOS)                 │
│  ┌─────────────────────────────────────────┐     │
│  │ MacBook Pro    $2,083/mes   6 de 12     │     │
│  │ Liverpool       $833/mes   2 de 6       │     │
│  │ Crédito auto  $5,200/mes   18 de 48     │     │
│  │                                         │     │
│  │ Total comprometido: $8,116/mes          │     │
│  │ Termina primero: Liverpool (Ago 2026)   │     │
│  └─────────────────────────────────────────┘     │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 4.9 Alertas

```
┌─────────────────────────────────────────────────┐
│ Alertas                                          │
├─────────────────────────────────────────────────┤
│                                                  │
│  URGENTES                                        │
│  ┌─────────────────────────────────────────┐     │
│  │ 🔴 Tu tarjeta BBVA vence en 3 días      │     │
│  │    Saldo: $5,200 | Mínimo: $520          │     │
│  │    Fecha límite: 10 Abr                  │     │
│  └─────────────────────────────────────────┘     │
│                                                  │
│  ATENCIÓN                                        │
│  ┌─────────────────────────────────────────┐     │
│  │ 🟡 Restaurantes: +40% vs mes anterior   │     │
│  │    Mar: $4,200 → Abr (parcial): $2,800  │     │
│  │    Proyectado: $5,880                    │     │
│  ├─────────────────────────────────────────┤     │
│  │ 🟡 3 MSI terminan en los próximos 90    │     │
│  │    días. Liberarás $3,749/mes            │     │
│  └─────────────────────────────────────────┘     │
│                                                  │
│  INFORMATIVOS                                    │
│  ┌─────────────────────────────────────────┐     │
│  │ 🟢 Detectamos un nuevo cargo recurrente │     │
│  │    "Notion" - $159/mes ¿Es correcto?   │     │
│  │    [Sí, es recurrente] [No, fue único]  │     │
│  └─────────────────────────────────────────┘     │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## 5. ESTRUCTURA DE BASE DE DATOS

### Schema Prisma (isyadmin)

```prisma
// ─────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────

enum UserType {
  PERSONAL
  EMPRENDEDOR
  EMPRESA
}

enum Role {
  SUPER_ADMIN
  ADMIN
  MIEMBRO
}

enum StatementStatus {
  UPLOADED          // Archivo subido, sin procesar
  EXTRACTING        // OCR / Document AI en proceso
  INTERPRETING      // Claude procesando
  VALIDATING        // Reglas de negocio
  REVIEW            // Listo para revisión del usuario
  CONFIRMED         // Usuario confirmó
  FAILED            // Error en procesamiento
}

enum MovementType {
  CARGO             // Gasto / compra
  ABONO             // Ingreso / depósito
  COMISION          // Comisión bancaria
  INTERES           // Interés cobrado
  PAGO              // Pago de tarjeta / transferencia saliente
  MSI               // Meses sin intereses
  DOMICILIACION     // Cargo domiciliado
}

enum MovementSource {
  PDF_EXTRACTED     // Viene de un PDF procesado
  MANUAL            // Captura manual del usuario
  API               // Futuro: conexión bancaria
}

enum Scope {
  PERSONAL
  NEGOCIO
}

enum RecurrenceFrequency {
  WEEKLY
  BIWEEKLY
  MONTHLY
  BIMONTHLY
  QUARTERLY
  ANNUAL
}

enum AlertSeverity {
  RED
  YELLOW
  GREEN
}

enum AlertType {
  PAYMENT_DUE       // Vencimiento próximo
  SPENDING_SPIKE    // Gasto fuera de patrón
  CASH_FLOW_RISK    // Riesgo de flujo
  NEW_RECURRING     // Nuevo recurrente detectado
  INSTALLMENT_END   // MSI por terminar
  ANOMALY           // Movimiento anómalo
}

enum HealthLevel {
  GREEN             // Estable
  YELLOW            // Atención
  RED               // Urgencia
}

// ─────────────────────────────────────────
// MULTI-TENANT
// ─────────────────────────────────────────

model Tenant {
  id              String    @id @default(cuid())
  name            String
  slug            String    @unique
  type            UserType  @default(PERSONAL)
  stripeCustomerId String?
  planTier        String    @default("free")   // free, basic, pro
  maxUsers        Int       @default(3)
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  users           User[]
  statements      BankStatement[]
  movements       Movement[]
  accounts        FinancialAccount[]
  categories      CustomCategory[]
  recurringItems  RecurringItem[]
  alerts          Alert[]
  healthSnapshots HealthSnapshot[]
  installments    Installment[]
}

// ─────────────────────────────────────────
// AUTENTICACIÓN
// ─────────────────────────────────────────

model User {
  id              String    @id @default(cuid())
  tenantId        String
  email           String
  passwordHash    String
  name            String
  role            Role      @default(MIEMBRO)
  avatarUrl       String?
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  tenant          Tenant    @relation(fields: [tenantId], references: [id])
  statements      BankStatement[]
  movements       Movement[]    @relation("CreatedByUser")
  corrections     MovementCorrection[]

  @@unique([email, tenantId])
}

model Token {
  id        String    @id @default(cuid())
  token     String    @unique
  type      String    // INVITATION, PASSWORD_RESET
  email     String
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())
}

// ─────────────────────────────────────────
// CUENTAS FINANCIERAS
// ─────────────────────────────────────────

model FinancialAccount {
  id              String    @id @default(cuid())
  tenantId        String
  name            String              // "Tarjeta BBVA Oro", "Cuenta Banorte"
  institution     String              // "BBVA", "Banorte"
  accountType     String              // credit_card, debit, checking, savings
  lastFourDigits  String?             // "4532"
  currency        String   @default("MXN")
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())

  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  statements      BankStatement[]
  movements       Movement[]
}

// ─────────────────────────────────────────
// ESTADOS DE CUENTA
// ─────────────────────────────────────────

model BankStatement {
  id              String          @id @default(cuid())
  tenantId        String
  accountId       String?
  uploadedById    String

  // Archivo
  fileName        String
  fileSize        Int
  storagePath     String          // Supabase storage path
  mimeType        String          @default("application/pdf")

  // Metadata extraída
  institution     String?         // Banco detectado
  periodStart     DateTime?
  periodEnd       DateTime?
  cutoffDate      DateTime?
  paymentDueDate  DateTime?
  currentBalance  Decimal?        @db.Decimal(12, 2)
  minimumPayment  Decimal?        @db.Decimal(12, 2)
  noInterestPayment Decimal?      @db.Decimal(12, 2)

  // Procesamiento
  status          StatementStatus @default(UPLOADED)
  processingStartedAt DateTime?
  processingCompletedAt DateTime?
  rawExtractedText    String?     @db.Text  // Texto crudo del OCR
  aiInterpretation    Json?       // Respuesta estructurada de Claude
  errorMessage        String?
  movementsCount      Int?

  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  tenant          Tenant          @relation(fields: [tenantId], references: [id])
  account         FinancialAccount? @relation(fields: [accountId], references: [id])
  uploadedBy      User            @relation(fields: [uploadedById], references: [id])
  movements       Movement[]
  processingLog   ProcessingLog[]
}

model ProcessingLog {
  id            String   @id @default(cuid())
  statementId   String
  step          String   // "extraction", "interpretation", "validation", "classification"
  status        String   // "started", "completed", "failed"
  details       Json?
  durationMs    Int?
  createdAt     DateTime @default(now())

  statement     BankStatement @relation(fields: [statementId], references: [id])
}

// ─────────────────────────────────────────
// MOVIMIENTOS
// ─────────────────────────────────────────

model Movement {
  id              String        @id @default(cuid())
  tenantId        String
  statementId     String?       // null si es manual
  accountId       String?
  createdById     String?       // usuario que capturó (si manual)

  // Datos core
  date            DateTime
  description     String
  originalDescription String?   // Descripción cruda del PDF
  amount          Decimal       @db.Decimal(12, 2)
  type            MovementType
  source          MovementSource @default(PDF_EXTRACTED)
  scope           Scope         @default(PERSONAL)

  // Clasificación
  categoryId      String?
  subcategoryId   String?
  merchantName    String?       // Nombre normalizado del comercio

  // Flags
  isRecurring     Boolean       @default(false)
  isSubscription  Boolean       @default(false)
  isService       Boolean       @default(false)
  isLoan          Boolean       @default(false)
  isInstallment   Boolean       @default(false) // MSI

  // Confianza IA
  confidenceScore Float?        // 0.0 - 1.0
  aiMetadata      Json?         // Metadata adicional de la IA
  userConfirmed   Boolean       @default(false)

  // Notas
  notes           String?

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  tenant          Tenant        @relation(fields: [tenantId], references: [id])
  statement       BankStatement? @relation(fields: [statementId], references: [id])
  account         FinancialAccount? @relation(fields: [accountId], references: [id])
  createdBy       User?         @relation("CreatedByUser", fields: [createdById], references: [id])
  category        Category?     @relation(fields: [categoryId], references: [id])
  subcategory     Subcategory?  @relation(fields: [subcategoryId], references: [id])
  corrections     MovementCorrection[]
  installment     Installment?  @relation(fields: [installmentId], references: [id])
  installmentId   String?
  recurringItem   RecurringItem? @relation(fields: [recurringItemId], references: [id])
  recurringItemId String?
}

model MovementCorrection {
  id            String   @id @default(cuid())
  movementId    String
  userId        String
  field         String   // "category", "type", "merchantName", "scope", etc.
  oldValue      String?
  newValue      String
  createdAt     DateTime @default(now())

  movement      Movement @relation(fields: [movementId], references: [id])
  user          User     @relation(fields: [userId], references: [id])
}

// ─────────────────────────────────────────
// CATEGORÍAS
// ─────────────────────────────────────────

model Category {
  id            String   @id @default(cuid())
  name          String
  icon          String?
  color         String?
  isSystem      Boolean  @default(true)
  sortOrder     Int      @default(0)

  subcategories Subcategory[]
  movements     Movement[]
}

model Subcategory {
  id            String   @id @default(cuid())
  categoryId    String
  name          String
  isSystem      Boolean  @default(true)
  sortOrder     Int      @default(0)

  category      Category @relation(fields: [categoryId], references: [id])
  movements     Movement[]
}

model CustomCategory {
  id            String   @id @default(cuid())
  tenantId      String
  name          String
  icon          String?
  color         String?
  parentId      String?  // si es subcategoría custom

  tenant        Tenant   @relation(fields: [tenantId], references: [id])
}

// ─────────────────────────────────────────
// RECURRENTES
// ─────────────────────────────────────────

model RecurringItem {
  id              String              @id @default(cuid())
  tenantId        String
  name            String              // "Netflix", "Renta oficina"
  merchantName    String?
  estimatedAmount Decimal             @db.Decimal(12, 2)
  frequency       RecurrenceFrequency
  scope           Scope               @default(PERSONAL)
  isSubscription  Boolean             @default(false)
  isService       Boolean             @default(false)
  nextExpectedDate DateTime?
  lastDetectedDate DateTime?
  isActive        Boolean             @default(true)
  autoDetected    Boolean             @default(true)

  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  tenant          Tenant              @relation(fields: [tenantId], references: [id])
  movements       Movement[]
}

// ─────────────────────────────────────────
// MENSUALIDADES (MSI / PRÉSTAMOS)
// ─────────────────────────────────────────

model Installment {
  id              String   @id @default(cuid())
  tenantId        String
  description     String   // "MacBook Pro MSI", "Crédito Auto"
  merchantName    String?
  totalAmount     Decimal  @db.Decimal(12, 2)
  monthlyAmount   Decimal  @db.Decimal(12, 2)
  totalInstallments Int
  paidInstallments  Int    @default(0)
  remainingInstallments Int
  startDate       DateTime
  estimatedEndDate DateTime
  isLoan          Boolean  @default(false) // true = préstamo, false = MSI
  isActive        Boolean  @default(true)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  tenant          Tenant   @relation(fields: [tenantId], references: [id])  // pendiente agregar
  movements       Movement[]
}

// ─────────────────────────────────────────
// ALERTAS
// ─────────────────────────────────────────

model Alert {
  id            String        @id @default(cuid())
  tenantId      String
  type          AlertType
  severity      AlertSeverity
  title         String
  message       String        // Lenguaje humano
  data          Json?         // Datos relevantes (montos, fechas)
  isRead        Boolean       @default(false)
  isDismissed   Boolean       @default(false)
  expiresAt     DateTime?
  createdAt     DateTime      @default(now())

  tenant        Tenant        @relation(fields: [tenantId], references: [id])
}

// ─────────────────────────────────────────
// SALUD FINANCIERA
// ─────────────────────────────────────────

model HealthSnapshot {
  id              String      @id @default(cuid())
  tenantId        String
  month           Int
  year            Int

  // Métricas
  totalIncome     Decimal     @db.Decimal(12, 2)
  totalExpenses   Decimal     @db.Decimal(12, 2)
  savingsRate     Float       // % ahorro
  debtToIncome    Float       // % deuda vs ingreso
  upcomingPayments Decimal    @db.Decimal(12, 2)
  overduePayments Int         // Cantidad de pagos vencidos
  cashFlowScore   Float       // 0-100

  // Resultado
  level           HealthLevel
  summary         String      // "Tus gastos están controlados..."

  createdAt       DateTime    @default(now())

  tenant          Tenant      @relation(fields: [tenantId], references: [id])

  @@unique([tenantId, month, year])
}

// ─────────────────────────────────────────
// PREPARACIÓN FUTURO (v2+)
// ─────────────────────────────────────────

// Placeholder para cuentas por cobrar
model Invoice {
  id            String   @id @default(cuid())
  tenantId      String
  // ... se expandirá en v2
  createdAt     DateTime @default(now())
}

// Placeholder para clientes/proveedores
model Contact {
  id            String   @id @default(cuid())
  tenantId      String
  type          String   // "cliente", "proveedor"
  name          String
  email         String?
  phone         String?
  rfc           String?
  createdAt     DateTime @default(now())
}
```

---

## 6. MÓDULOS BACKEND

### Estructura de Routers tRPC

```
packages/api/src/
├── root.ts                    → Composición de routers
├── trpc.ts                    → Procedures base + middleware
├── routers/
│   ├── auth.router.ts         → Login, registro, recuperación
│   ├── tenant.router.ts       → Config tenant, tipo, plan
│   ├── user.router.ts         → CRUD usuarios del tenant
│   ├── statement.router.ts    → Upload, procesamiento, revisión
│   ├── movement.router.ts     → CRUD movimientos, filtros, búsqueda
│   ├── category.router.ts     → Categorías + custom categories
│   ├── recurring.router.ts    → Recurrentes, suscripciones, servicios
│   ├── installment.router.ts  → MSI, préstamos, tracking
│   ├── alert.router.ts        → Alertas, marcar leídas, dismiss
│   ├── health.router.ts       → Semáforo, snapshot, cálculo
│   ├── dashboard.router.ts    → Agregados para dashboard
│   ├── billing.router.ts      → Stripe checkout, portal, planes
│   └── ecosystem.router.ts    → Cross-product, SSO
├── lib/
│   ├── ai-pipeline/
│   │   ├── extractor.ts       → Google Document AI / OCR
│   │   ├── interpreter.ts     → Claude para interpretación
│   │   ├── classifier.ts      → Clasificación híbrida
│   │   ├── validator.ts       → Reglas de negocio
│   │   ├── scorer.ts          → Scoring de confianza
│   │   └── pipeline.ts        → Orquestador del pipeline
│   ├── stripe.ts              → Cliente Stripe
│   ├── supabase-storage.ts    → Upload/download PDFs
│   ├── shared-db.ts           → Acceso a schema compartido
│   ├── claude.ts              → Cliente Anthropic SDK
│   └── alerts-engine.ts       → Motor de generación de alertas
```

### Detalle de Módulos Clave

#### 6.1 Statement Router
- `upload` — Recibe file, sube a Supabase, crea registro, dispara pipeline async
- `list` — Lista estados con paginación y filtros
- `getById` — Detalle completo con movimientos
- `reprocess` — Reprocesar un statement fallido
- `confirm` — Usuario confirma datos revisados
- `delete` — Eliminar statement y movimientos asociados

#### 6.2 Movement Router
- `list` — Movimientos con filtros (fecha, categoría, tipo, scope, cuenta)
- `getById` — Detalle de movimiento
- `create` — Captura manual
- `update` — Editar movimiento (categoría, scope, notas)
- `correct` — Corrección con log de auditoría
- `bulkCategorize` — Categorizar múltiples a la vez
- `search` — Búsqueda por descripción/comercio
- `monthSummary` — Resumen mensual (ingresos, gastos, balance)

#### 6.3 Dashboard Router
- `overview` — Balance, ingresos, gastos, disponible, por pagar
- `upcomingPayments` — Próximos 5-10 pagos
- `activeAlerts` — Alertas no leídas
- `healthStatus` — Semáforo actual
- `spendingByCategory` — Gasto por categoría del mes
- `monthlyTrend` — Tendencia de últimos 6 meses

#### 6.4 Health Router
- `currentHealth` — Cálculo en tiempo real del semáforo
- `calculate` — Forzar recálculo
- `history` — Histórico de snapshots mensuales

---

## 7. ENDPOINTS PRINCIPALES

### API Routes (Next.js App Router)

```
POST   /api/trpc/auth.login
POST   /api/trpc/auth.register
POST   /api/trpc/auth.forgotPassword
POST   /api/trpc/auth.resetPassword

GET    /api/trpc/dashboard.overview
GET    /api/trpc/dashboard.upcomingPayments
GET    /api/trpc/dashboard.healthStatus

POST   /api/trpc/statement.upload
GET    /api/trpc/statement.list
GET    /api/trpc/statement.getById
POST   /api/trpc/statement.confirm
POST   /api/trpc/statement.reprocess

GET    /api/trpc/movement.list
GET    /api/trpc/movement.getById
POST   /api/trpc/movement.create
PUT    /api/trpc/movement.update
POST   /api/trpc/movement.correct
GET    /api/trpc/movement.monthSummary

GET    /api/trpc/recurring.list
GET    /api/trpc/recurring.subscriptions
GET    /api/trpc/recurring.services

GET    /api/trpc/installment.list
GET    /api/trpc/installment.active

GET    /api/trpc/alert.list
PUT    /api/trpc/alert.markRead
PUT    /api/trpc/alert.dismiss

GET    /api/trpc/health.currentHealth
GET    /api/trpc/health.history

GET    /api/trpc/category.list
POST   /api/trpc/category.createCustom

POST   /api/trpc/billing.createCheckout
POST   /api/trpc/billing.createPortalSession
GET    /api/trpc/billing.overview
```

### Webhooks

```
POST   /api/webhooks/stripe        → Eventos de pago
POST   /api/webhooks/isytask       → Eventos cross-product
```

### Cron Jobs (Vercel)

```
GET    /api/cron/process-statements   → Procesar PDFs pendientes
GET    /api/cron/generate-alerts      → Generar alertas diarias
GET    /api/cron/health-snapshot      → Snapshot mensual de salud
```

---

## 8. ESTRATEGIA DE IA POR CAPAS

### Pipeline de Procesamiento (4 capas)

```
PDF
 ↓
╔══════════════════════════════════════════════════╗
║  CAPA 1: EXTRACCIÓN (Document AI)               ║
║                                                  ║
║  Input:  PDF binario                             ║
║  Output: Texto estructurado + tablas             ║
║  Tech:   Google Document AI (Form Parser)        ║
║  Fallback: pdf-parse + Claude Vision             ║
║                                                  ║
║  - Detecta layout del estado de cuenta           ║
║  - Extrae tablas de movimientos                  ║
║  - Identifica headers y footers                  ║
║  - OCR para PDFs escaneados                      ║
╚══════════════════════════════════════════════════╝
 ↓
╔══════════════════════════════════════════════════╗
║  CAPA 2: INTERPRETACIÓN (Claude)                 ║
║                                                  ║
║  Input:  Texto extraído                          ║
║  Output: JSON estructurado                       ║
║  Tech:   Claude claude-sonnet-4-20250514         ║
║                                                  ║
║  El prompt pide:                                 ║
║  {                                               ║
║    institution: "Banorte",                       ║
║    periodStart: "2026-03-01",                    ║
║    periodEnd: "2026-03-31",                      ║
║    cutoffDate: "2026-03-25",                     ║
║    paymentDueDate: "2026-04-10",                 ║
║    currentBalance: 12450.00,                     ║
║    minimumPayment: 1245.00,                      ║
║    noInterestPayment: 12450.00,                  ║
║    movements: [                                  ║
║      {                                           ║
║        date: "2026-03-01",                       ║
║        description: "AMAZON MX",                 ║
║        originalDescription: "AMZN MKT...",       ║
║        amount: 599.00,                           ║
║        type: "CARGO",                            ║
║        category: "Compras",                      ║
║        subcategory: "Tecnología",                ║
║        merchantName: "Amazon",                   ║
║        isRecurring: false,                       ║
║        isSubscription: false,                    ║
║        isService: false,                         ║
║        isLoan: false,                            ║
║        isInstallment: false,                     ║
║        totalInstallments: null,                  ║
║        remainingInstallments: null,              ║
║        confidence: 0.95                          ║
║      }                                           ║
║    ]                                             ║
║  }                                               ║
╚══════════════════════════════════════════════════╝
 ↓
╔══════════════════════════════════════════════════╗
║  CAPA 3: VALIDACIÓN (Reglas de Negocio)          ║
║                                                  ║
║  Input:  JSON de Claude                          ║
║  Output: JSON validado + flags                   ║
║                                                  ║
║  Reglas:                                         ║
║  - Sumatoria de cargos ≈ saldo (±5% tolerancia) ║
║  - Fechas dentro del periodo declarado           ║
║  - Montos positivos para cargos                  ║
║  - Categorías válidas del catálogo               ║
║  - Detección de duplicados (mismo monto+fecha)   ║
║  - MSI: totalInstallments > 0 cuando isInstall.  ║
║  - Merchant normalization (AMZN→Amazon, etc.)    ║
║  - Detectar si un "cargo" es realmente interés   ║
║                                                  ║
║  Diccionario de merchants conocidos:             ║
║  {                                               ║
║    "AMZN MKT": { name: "Amazon", cat: "Compras"}║
║    "NFLX": { name: "Netflix", cat: "Suscripción"}║
║    "UBER EATS": { name: "Uber Eats", cat: "..."}║
║    // 200+ merchants mexicanos comunes           ║
║  }                                               ║
╚══════════════════════════════════════════════════╝
 ↓
╔══════════════════════════════════════════════════╗
║  CAPA 4: SCORING DE CONFIANZA                    ║
║                                                  ║
║  Input:  Movimientos validados                   ║
║  Output: Score final + flags de revisión         ║
║                                                  ║
║  Factores del score:                             ║
║  +0.30  Merchant encontrado en diccionario       ║
║  +0.25  Categoría coincide con merchant          ║
║  +0.20  Monto dentro de rango típico             ║
║  +0.15  Fecha válida y en periodo                ║
║  +0.10  Tipo consistente con descripción         ║
║                                                  ║
║  Umbrales:                                       ║
║  ≥ 0.85  → Auto-confirmado (verde)              ║
║  0.60-0.84 → Sugerido, verificar (amarillo)     ║
║  < 0.60  → Requiere revisión manual (rojo)      ║
╚══════════════════════════════════════════════════╝
```

### Flujo de la IA en Código

```typescript
// packages/api/src/lib/ai-pipeline/pipeline.ts

export async function processStatement(statementId: string) {
  const statement = await db.bankStatement.findUnique({ where: { id: statementId } });

  // Paso 1: Extracción
  await updateStatus(statementId, 'EXTRACTING');
  const rawText = await extractor.extract(statement.storagePath);
  await logStep(statementId, 'extraction', 'completed');

  // Paso 2: Interpretación
  await updateStatus(statementId, 'INTERPRETING');
  const structured = await interpreter.interpret(rawText);
  await logStep(statementId, 'interpretation', 'completed');

  // Paso 3: Validación
  await updateStatus(statementId, 'VALIDATING');
  const validated = await validator.validate(structured);
  await logStep(statementId, 'validation', 'completed');

  // Paso 4: Scoring
  const scored = await scorer.score(validated);

  // Paso 5: Persistir
  await persistMovements(statementId, scored);
  await detectRecurring(statement.tenantId, scored);
  await detectInstallments(statement.tenantId, scored);

  // Paso 6: Listo para revisión
  await updateStatus(statementId, 'REVIEW');
}
```

### Sugerencia Automática de Categoría (Captura Manual)

```typescript
// Cuando el usuario escribe la descripción en captura manual:
// "Comida con cliente en Sonora Grill"
//
// Se hace una llamada ligera a Claude:
// → { category: "Alimentación", subcategory: "Restaurantes", scope: "NEGOCIO" }
//
// Se muestra como sugerencia, el usuario puede aceptar o cambiar.
```

### Fallback Strategy

| Prioridad | Servicio | Uso | Costo aprox. |
|---|---|---|---|
| 1 | Google Document AI | OCR + tablas | ~$1.50/1000 páginas |
| 2 | pdf-parse (local) | Texto simple de PDFs nativos | Gratis |
| 3 | Claude Vision | PDFs escaneados / complejos | ~$0.03/página |

**Lógica de fallback:**
1. Intentar `pdf-parse` primero (gratis, rápido)
2. Si el texto extraído es pobre (< 100 chars o mucho ruido) → Document AI
3. Si Document AI falla o no está configurado → Claude Vision como último recurso

---

## 9. LÓGICA DEL SEMÁFORO FINANCIERO

### Variables de Entrada

```typescript
interface HealthInputs {
  // Flujo
  totalIncome: number;        // Ingresos del mes
  totalExpenses: number;      // Gastos del mes

  // Deuda
  totalDebt: number;          // Saldo total de tarjetas
  minimumPayments: number;    // Suma de pagos mínimos
  monthlyInstallments: number; // Comprometido en MSI/préstamos

  // Vencimientos
  overduePayments: number;    // Pagos vencidos (cantidad)
  upcomingPayments7d: number; // Monto por pagar próximos 7 días

  // Patrones
  spendingVsAverage: number;  // % gasto actual vs promedio 3 meses
  savingsRate: number;        // (ingreso - gasto) / ingreso
}
```

### Fórmula de Cálculo

```typescript
function calculateHealthScore(inputs: HealthInputs): {
  score: number;      // 0-100
  level: HealthLevel; // GREEN | YELLOW | RED
  summary: string;    // Texto en lenguaje humano
  factors: string[];  // Factores que afectan
} {
  let score = 100;
  const factors: string[] = [];

  // 1. Pagos vencidos (-30 pts max) — EL MÁS GRAVE
  if (inputs.overduePayments > 0) {
    score -= Math.min(inputs.overduePayments * 15, 30);
    factors.push(`Tienes ${inputs.overduePayments} pago(s) vencido(s)`);
  }

  // 2. Ratio deuda/ingreso (-25 pts max)
  const debtRatio = (inputs.minimumPayments + inputs.monthlyInstallments) / inputs.totalIncome;
  if (debtRatio > 0.40) {
    score -= 25;
    factors.push('Más del 40% de tus ingresos se van en deudas');
  } else if (debtRatio > 0.30) {
    score -= 15;
    factors.push('El 30-40% de tus ingresos se van en deudas');
  } else if (debtRatio > 0.20) {
    score -= 5;
  }

  // 3. Tasa de ahorro (-20 pts max)
  if (inputs.savingsRate < 0) {
    score -= 20;
    factors.push('Estás gastando más de lo que ganas');
  } else if (inputs.savingsRate < 0.05) {
    score -= 12;
    factors.push('Tu margen de ahorro es muy bajo (menos del 5%)');
  } else if (inputs.savingsRate < 0.10) {
    score -= 5;
  }

  // 4. Gasto vs promedio (-15 pts max)
  if (inputs.spendingVsAverage > 1.50) {
    score -= 15;
    factors.push('Estás gastando 50% más que tu promedio');
  } else if (inputs.spendingVsAverage > 1.25) {
    score -= 8;
    factors.push('Estás gastando 25% más que tu promedio');
  }

  // 5. Presión de corto plazo (-10 pts max)
  const shortTermPressure = inputs.upcomingPayments7d / inputs.totalIncome;
  if (shortTermPressure > 0.50) {
    score -= 10;
    factors.push('Los pagos de esta semana superan el 50% de tus ingresos');
  } else if (shortTermPressure > 0.30) {
    score -= 5;
  }

  // Determinar nivel
  const level: HealthLevel =
    score >= 70 ? 'GREEN' :
    score >= 40 ? 'YELLOW' : 'RED';

  // Generar resumen en lenguaje humano
  const summary = generateHumanSummary(level, score, factors);

  return { score, level, summary, factors };
}
```

### Mensajes en Lenguaje Humano

```typescript
function generateHumanSummary(level: HealthLevel, score: number, factors: string[]): string {
  if (level === 'GREEN') {
    if (score >= 90) return 'Todo en orden. Tus finanzas están saludables y no tienes pagos pendientes.';
    return 'Vas bien. Tus gastos están controlados, aunque hay un par de cosas que vigilar.';
  }

  if (level === 'YELLOW') {
    if (factors.length === 1) return `Atención: ${factors[0].toLowerCase()}. Nada grave, pero vale la pena revisar.`;
    return `Hay ${factors.length} cosas que necesitan tu atención. Revisa las alertas para mantener el control.`;
  }

  // RED
  if (factors.some(f => f.includes('vencido'))) {
    return 'Tienes pagos vencidos que necesitas atender hoy. Revisa las alertas urgentes.';
  }
  return 'Tus finanzas necesitan atención inmediata. Te recomendamos revisar tus gastos y pagos pendientes.';
}
```

### Cómo se Muestra

```
┌────────────────────────────────────────────────┐
│                                                │
│  🟢 82/100 — ESTABLE                          │
│  ━━━━━━━━━━━━━━━━━━━━░░░░                     │
│                                                │
│  "Vas bien. Tus gastos están controlados,      │
│   aunque hay un par de cosas que vigilar."     │
│                                                │
│  • Tu margen de ahorro es muy bajo (< 5%)      │
│                                                │
│  [Ver detalle →]                               │
│                                                │
└────────────────────────────────────────────────┘
```

---

## 10. ROADMAP POR FASES

### Fase 1: Fundación (Sprint 1-2)

```
- Monorepo setup (pnpm + turbo)
- Prisma schema + migraciones
- Auth (NextAuth + JWT)
- Layout: sidebar, header, theme
- Registro + login + onboarding básico
- Dashboard vacío con estructura
- Página de configuración del tenant
```

### Fase 2: Captura Manual + Categorías (Sprint 3)

```
- Seed de categorías default
- CRUD movimientos manuales
- Formulario de ingreso/gasto
- Sugerencia automática de categoría (IA)
- Toggle personal/negocio
- Lista de movimientos con filtros
- Dashboard con datos reales
```

### Fase 3: Pipeline de PDF (Sprint 4-5)

```
- Upload de PDF a Supabase Storage
- Integración pdf-parse (extracción básica)
- Integración Claude para interpretación
- Reglas de negocio + diccionario merchants
- Scoring de confianza
- Pantalla de procesamiento (progreso)
- Pantalla de revisión (corrección manual)
- Log de procesamiento
```

### Fase 4: Inteligencia (Sprint 6)

```
- Detección de recurrentes
- Detección de MSI/préstamos
- Motor de alertas
- Semáforo financiero
- Dashboard completo con alertas + próximos pagos
- Página de recurrentes
- Página de alertas
```

### Fase 5: Polish + Producción (Sprint 7)

```
- Google Document AI como extractor principal
- Stripe billing (plans: free, basic, pro)
- Cross-product integration (shared-db, SSO)
- Responsive polish (mobile first)
- Performance (lazy loading, optimistic updates)
- Deploy a Vercel
- Manejo de errores global
```

### Fase 6: Post-MVP (Futuro)

```
- Reportes visuales (gráficas de gasto por categoría, tendencias)
- Facturación (CFDI, SAT)
- Cuentas por cobrar / por pagar
- Clientes y proveedores
- Conexión bancaria directa (Open Banking)
- App móvil (React Native / Expo)
- Notificaciones push
- Multi-moneda
- Exportación (CSV, Excel)
```

---

## 11. RECOMENDACIONES DE STACK, LIBRERÍAS Y SERVICIOS

### Core

| Componente | Tecnología | Justificación |
|---|---|---|
| Framework | Next.js 14.2.0 | Consistencia con IsyTask/IsySocial |
| API | tRPC 10.45 | Type-safety E2E, mismo patrón |
| ORM | Prisma 5.19 | Consistencia + migraciones |
| DB | PostgreSQL (Supabase) | Misma instancia, schema separado |
| Auth | NextAuth 4 | Consistencia, JWT 30 días |
| UI | Radix + Tailwind + shadcn/ui | Consistencia visual |
| State | React Query (via tRPC) | Cache + optimistic updates |

### IA / Procesamiento

| Componente | Tecnología | Justificación |
|---|---|---|
| PDF parsing (básico) | pdf-parse | Gratis, rápido, PDFs nativos |
| OCR avanzado | Google Document AI | Mejor accuracy para tablas bancarias |
| Interpretación | Claude (Anthropic SDK) | Superior en comprensión de contexto financiero |
| Fallback OCR | Claude Vision | Para PDFs escaneados |

### Servicios

| Componente | Servicio | Justificación |
|---|---|---|
| File storage | Supabase Storage | Misma infra, bucket `statements` |
| Payments | Stripe | Ya integrado en ecosistema |
| Email | Resend | Ya integrado en ecosistema |
| Hosting | Vercel | Consistencia, hobby plan |
| Cron | Vercel Crons | Una vez al día (hobby limit) |
| Monitoring | Vercel Analytics | Incluido |

### Librerías Adicionales

```json
{
  "pdf-parse": "^1.1.1",           // Extracción de texto de PDF
  "@google-cloud/documentai": "^8", // Google Document AI
  "@anthropic-ai/sdk": "^0.52",    // Claude API
  "decimal.js": "^10.4",           // Aritmética financiera precisa
  "date-fns": "^3.6",              // Manejo de fechas
  "zod": "^3.23",                  // Validación de schemas
  "superjson": "^2.2",             // Serialización (Decimal, Date)
  "react-dropzone": "^14.2",       // Upload de archivos
  "framer-motion": "^11",          // Animaciones sutiles
  "recharts": "^2.12"              // Gráficas (fase 6)
}
```

---

## 12. ESTRUCTURA DEL REPOSITORIO

```
isyadmin/
├── apps/
│   └── web/
│       ├── app/
│       │   ├── (auth)/
│       │   │   ├── login/page.tsx
│       │   │   ├── registro/page.tsx
│       │   │   └── recuperar/page.tsx
│       │   ├── (dashboard)/
│       │   │   ├── layout.tsx              → Sidebar + header
│       │   │   ├── page.tsx                → Dashboard principal
│       │   │   ├── movimientos/
│       │   │   │   ├── page.tsx            → Lista de movimientos
│       │   │   │   ├── [id]/page.tsx       → Detalle movimiento
│       │   │   │   └── nuevo/page.tsx      → Captura manual
│       │   │   ├── estados-cuenta/
│       │   │   │   ├── page.tsx            → Lista + upload
│       │   │   │   ├── [id]/page.tsx       → Detalle + revisión
│       │   │   │   └── procesando/[id]/page.tsx → Estado de espera
│       │   │   ├── recurrentes/
│       │   │   │   └── page.tsx            → Suscripciones + MSI
│       │   │   ├── alertas/
│       │   │   │   └── page.tsx            → Centro de alertas
│       │   │   ├── configuracion/
│       │   │   │   ├── page.tsx            → Perfil / empresa
│       │   │   │   ├── categorias/page.tsx → Categorías custom
│       │   │   │   ├── facturacion/page.tsx→ Stripe billing
│       │   │   │   └── equipo/page.tsx     → Usuarios
│       │   │   └── onboarding/
│       │   │       └── page.tsx            → Setup inicial
│       │   ├── api/
│       │   │   ├── trpc/[trpc]/route.ts
│       │   │   ├── webhooks/
│       │   │   │   ├── stripe/route.ts
│       │   │   │   └── isytask/route.ts
│       │   │   └── cron/
│       │   │       ├── process-statements/route.ts
│       │   │       ├── generate-alerts/route.ts
│       │   │       └── health-snapshot/route.ts
│       │   ├── globals.css
│       │   └── layout.tsx
│       ├── components/
│       │   ├── layout/
│       │   │   ├── sidebar.tsx
│       │   │   ├── sidebar-context.tsx
│       │   │   ├── header.tsx
│       │   │   └── mobile-nav.tsx
│       │   ├── dashboard/
│       │   │   ├── health-semaphore.tsx
│       │   │   ├── balance-cards.tsx
│       │   │   ├── upcoming-payments.tsx
│       │   │   ├── alerts-widget.tsx
│       │   │   └── upload-cta.tsx
│       │   ├── movements/
│       │   │   ├── movement-list.tsx
│       │   │   ├── movement-card.tsx
│       │   │   ├── movement-form.tsx
│       │   │   └── category-picker.tsx
│       │   ├── statements/
│       │   │   ├── pdf-dropzone.tsx
│       │   │   ├── processing-status.tsx
│       │   │   ├── review-form.tsx
│       │   │   └── statement-card.tsx
│       │   ├── recurring/
│       │   │   ├── subscription-list.tsx
│       │   │   ├── installment-list.tsx
│       │   │   └── service-list.tsx
│       │   ├── alerts/
│       │   │   ├── alert-card.tsx
│       │   │   └── alert-list.tsx
│       │   └── ui/                        → shadcn/ui components
│       ├── lib/
│       │   ├── auth.ts
│       │   ├── trpc/
│       │   │   ├── client.ts
│       │   │   ├── server.ts
│       │   │   └── provider.tsx
│       │   └── utils.ts
│       ├── middleware.ts
│       ├── generated/prisma/             → Prisma output
│       ├── next.config.mjs
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   ├── api/
│   │   ├── src/
│   │   │   ├── root.ts
│   │   │   ├── trpc.ts
│   │   │   ├── routers/
│   │   │   │   ├── auth.router.ts
│   │   │   │   ├── tenant.router.ts
│   │   │   │   ├── user.router.ts
│   │   │   │   ├── statement.router.ts
│   │   │   │   ├── movement.router.ts
│   │   │   │   ├── category.router.ts
│   │   │   │   ├── recurring.router.ts
│   │   │   │   ├── installment.router.ts
│   │   │   │   ├── alert.router.ts
│   │   │   │   ├── health.router.ts
│   │   │   │   ├── dashboard.router.ts
│   │   │   │   ├── billing.router.ts
│   │   │   │   └── ecosystem.router.ts
│   │   │   └── lib/
│   │   │       ├── ai-pipeline/
│   │   │       │   ├── pipeline.ts
│   │   │       │   ├── extractor.ts
│   │   │       │   ├── interpreter.ts
│   │   │       │   ├── classifier.ts
│   │   │       │   ├── validator.ts
│   │   │       │   ├── scorer.ts
│   │   │       │   └── merchant-dictionary.ts
│   │   │       ├── alerts-engine.ts
│   │   │       ├── health-calculator.ts
│   │   │       ├── claude.ts
│   │   │       ├── stripe.ts
│   │   │       ├── supabase-storage.ts
│   │   │       └── shared-db.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── db/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts                   → Categorías default
│   │   ├── index.ts                      → Prisma singleton
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── shared/
│       ├── src/
│       │   ├── types.ts
│       │   ├── constants.ts
│       │   ├── validators.ts
│       │   └── categories.ts             → Catálogo de categorías
│       ├── package.json
│       └── tsconfig.json
│
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── .env.example
├── .gitignore
├── vercel.json
└── README.md
```

---

## 13. PLAN DE DESARROLLO POR SPRINTS

### Sprint 1 — Fundación (5 días)

```
DÍA 1-2: Setup
├── Monorepo (pnpm workspace + turbo)
├── Prisma schema (modelos core: Tenant, User, Token)
├── Migración inicial a Supabase (schema isyadmin)
├── NextAuth config (copiado de IsyTask, adaptado)
├── tRPC setup (procedures, middleware, auth)
└── Estructura de carpetas completa

DÍA 3-4: Auth + Layout
├── Página de login
├── Página de registro
├── Recuperación de contraseña
├── Layout dashboard (sidebar + header)
├── Middleware de rutas protegidas
└── Theme (colores IsyAdmin)

DÍA 5: Onboarding + Config
├── Flujo de onboarding (tipo de usuario)
├── Página de configuración del tenant
├── Seed de categorías default
└── Testing E2E del flujo auth
```

### Sprint 2 — Movimientos Manuales (5 días)

```
DÍA 1-2: Backend
├── movement.router.ts (CRUD + filtros)
├── category.router.ts (list + custom)
├── dashboard.router.ts (overview, monthSummary)
├── Validadores Zod para inputs
└── Tests unitarios routers

DÍA 3-4: Frontend
├── Formulario agregar ingreso/gasto
├── Lista de movimientos con filtros
├── Toggle personal/negocio
├── Category picker component
└── Dashboard con cards de balance

DÍA 5: IA para categorización
├── Claude integration (claude.ts)
├── Endpoint sugerencia de categoría
├── Auto-suggest al escribir descripción
└── Polish + responsive
```

### Sprint 3 — Pipeline PDF básico (5 días)

```
DÍA 1: Upload
├── pdf-dropzone component (react-dropzone)
├── Upload a Supabase Storage (bucket statements)
├── statement.router.ts (upload, list)
└── UI historial de archivos

DÍA 2-3: Pipeline IA
├── extractor.ts (pdf-parse)
├── interpreter.ts (prompt de Claude)
├── validator.ts (reglas de negocio)
├── scorer.ts (confianza)
├── pipeline.ts (orquestador)
└── merchant-dictionary.ts (200+ merchants MX)

DÍA 4: UI Procesamiento + Revisión
├── Pantalla de progreso
├── Pantalla de revisión de movimientos
├── Corrección manual (cambiar categoría, tipo)
├── Botón confirmar
└── Integración con movimientos existentes

DÍA 5: Testing + Edge cases
├── Pruebas con PDFs reales (Banorte, BBVA, Citibanamex)
├── Manejo de errores
├── Fallback cuando pdf-parse falla
└── Log de procesamiento
```

### Sprint 4 — Inteligencia (5 días)

```
DÍA 1-2: Recurrentes + MSI
├── recurring.router.ts
├── installment.router.ts
├── Algoritmo detección de recurrentes
├── Algoritmo detección de MSI
├── UI página de recurrentes
└── UI página de mensualidades

DÍA 3: Alertas
├── alerts-engine.ts
├── alert.router.ts
├── Reglas de alertas (vencimientos, spikes, etc.)
├── UI centro de alertas
└── Widget alertas en dashboard

DÍA 4: Semáforo
├── health-calculator.ts
├── health.router.ts
├── HealthSnapshot mensual
├── health-semaphore component
└── Integración en dashboard

DÍA 5: Dashboard completo
├── Próximos pagos widget
├── Recurrentes widget
├── Alertas widget
├── Semáforo prominente
└── CTA subir PDF / agregar movimiento
```

### Sprint 5 — Producción (5 días)

```
DÍA 1: Document AI
├── Integración Google Document AI
├── Fallback chain (pdf-parse → Document AI → Claude Vision)
├── Benchmarking con PDFs reales
└── Optimización de prompts

DÍA 2: Billing + Ecosystem
├── Stripe products/plans para IsyAdmin
├── billing.router.ts
├── Webhook Stripe
├── shared-db.ts (cross-product)
├── SSO endpoints
└── Product selector en sidebar

DÍA 3: Polish
├── Mobile responsive (todas las pantallas)
├── Loading skeletons
├── Empty states
├── Error boundaries
├── Microinteracciones (framer-motion)
└── Accesibilidad

DÍA 4: Deploy
├── Vercel project setup
├── Environment variables
├── Cron jobs (process-statements, alerts, health)
├── Webhook endpoints
└── DNS / dominio

DÍA 5: QA + Fixes
├── Testing completo E2E
├── Fix bugs críticos
├── Performance audit
├── Security review
└── Documentación .env.example
```

---

## 14. RIESGOS TÉCNICOS Y MITIGACIÓN

### Riesgo 1: Variabilidad de Formatos de PDF
- **Impacto:** Alto — cada banco tiene formato distinto
- **Probabilidad:** Alta
- **Mitigación:**
  - Pipeline de 4 capas con fallbacks
  - Diccionario de merchants reduce dependencia de IA
  - Corrección manual como red de seguridad
  - Empezar con 3-4 bancos principales (BBVA, Banorte, Citibanamex, HSBC)
  - Almacenar `rawExtractedText` para poder reprocesar

### Riesgo 2: Costos de IA por Volumen
- **Impacto:** Medio — podría escalar costos rápidamente
- **Mitigación:**
  - `pdf-parse` primero (gratis) → solo usar Document AI/Claude cuando necesario
  - Cache de merchants conocidos (evita re-clasificación)
  - Usar `claude-sonnet` (más barato que Opus) para interpretación
  - Batch processing en cron (no real-time)
  - Límite de PDFs por plan (free: 3/mes, basic: 15/mes, pro: ilimitado)

### Riesgo 3: Precisión de Clasificación
- **Impacto:** Alto — si clasifica mal, pierde confianza del usuario
- **Mitigación:**
  - Sistema de confianza visible (usuario sabe qué es seguro y qué no)
  - Corrección manual alimenta mejoras futuras
  - Reglas de negocio como segunda opinión después de la IA
  - Movimientos con score < 0.60 siempre piden revisión
  - `MovementCorrection` acumula datos para fine-tuning futuro

### Riesgo 4: Seguridad de Datos Financieros
- **Impacto:** Crítico
- **Mitigación:**
  - PDFs almacenados en Supabase con RLS
  - Todos los queries filtrados por `tenantId`
  - JWT con expiración de 30 días
  - No almacenamos números de tarjeta completos
  - HTTPS everywhere (Vercel)
  - Rate limiting en tRPC (200 req/min)
  - Logs de acceso en `ProcessingLog`

### Riesgo 5: Límites de Vercel Hobby
- **Impacto:** Medio — procesamiento de PDFs puede exceder tiempo
- **Mitigación:**
  - PDFs se procesan en cron (no en request del usuario)
  - Serverless functions tienen 60s en hobby → suficiente para la mayoría
  - Si un PDF tarda mucho, se marca como FAILED y permite reprocess
  - Considerar upgrade a Pro si el volumen crece

### Riesgo 6: Duplicados al Subir Mismo PDF
- **Impacto:** Bajo-Medio
- **Mitigación:**
  - Hash del archivo (SHA-256) para detectar duplicados exactos
  - Verificar superposición de periodos por cuenta
  - Warning al usuario: "Ya tienes un estado de BBVA para marzo 2026"

### Riesgo 7: Consistencia del Ecosistema
- **Impacto:** Medio — mantener 3 productos alineados
- **Mitigación:**
  - Mismo stack exacto (Next 14, tRPC 10, Prisma 5)
  - `shared-db.ts` idéntico en los 3 productos
  - Shared schema en Supabase para datos cross-product
  - SSO para navegación entre productos
  - Misma estructura de monorepo

---

## RESUMEN EJECUTIVO

IsyAdmin es un producto financiero personal/PYME que se integra al ecosistema Isy como tercer producto. El MVP se centra en:

1. **Subir PDFs** → la IA los lee y estructura los movimientos
2. **Captura manual** → para lo que no viene en el PDF
3. **Dashboard visual** → semáforo + balance + alertas + próximos pagos
4. **Inteligencia automática** → detecta recurrentes, MSI, y patrones

**Tiempo estimado:** 5 sprints de 5 días = 5 semanas para MVP funcional.

**Diferenciador real:** No es otra app financiera complicada. Es la app que cualquier persona entiende en 5 segundos. El semáforo te dice cómo estás. Las alertas te dicen qué hacer. La IA hace el trabajo pesado.

**Arquitectura:** 100% compatible con IsyTask e IsySocial — mismo stack, misma DB (schema separado), mismo auth, mismo billing, SSO cross-product.
