import { PrismaClient } from "../../../apps/web/generated/prisma";

const prisma = new PrismaClient();

const CATEGORIES = [
  // INGRESOS
  {
    name: "Salario / Nómina", icon: "Banknote", color: "#22c55e", type: "INGRESO", sortOrder: 1,
    subcategories: ["Nómina quincenal", "Nómina mensual", "Aguinaldo", "Bonos"],
  },
  {
    name: "Ventas", icon: "ShoppingBag", color: "#16a34a", type: "INGRESO", sortOrder: 2,
    subcategories: ["Productos", "Servicios", "Freelance"],
  },
  {
    name: "Inversiones", icon: "TrendingUp", color: "#15803d", type: "INGRESO", sortOrder: 3,
    subcategories: ["Rendimientos", "Dividendos", "Plusvalía"],
  },
  {
    name: "Otro ingreso", icon: "Plus", color: "#14532d", type: "INGRESO", sortOrder: 4,
    subcategories: ["Reembolso", "Préstamo recibido", "Varios"],
  },

  // EGRESOS
  {
    name: "Vivienda", icon: "Home", color: "#3b82f6", type: "EGRESO", sortOrder: 10,
    subcategories: ["Renta", "Hipoteca", "Mantenimiento", "Seguros de hogar"],
  },
  {
    name: "Servicios", icon: "Zap", color: "#6366f1", type: "EGRESO", sortOrder: 11,
    subcategories: ["Luz", "Agua", "Gas", "Internet", "Teléfono", "TV por cable"],
  },
  {
    name: "Alimentación", icon: "UtensilsCrossed", color: "#f97316", type: "EGRESO", sortOrder: 12,
    subcategories: ["Supermercado", "Restaurantes", "Delivery", "Cafetería"],
  },
  {
    name: "Transporte", icon: "Car", color: "#eab308", type: "EGRESO", sortOrder: 13,
    subcategories: ["Gasolina", "Transporte público", "Uber / Taxi", "Estacionamiento", "Peajes"],
  },
  {
    name: "Salud", icon: "Heart", color: "#ef4444", type: "EGRESO", sortOrder: 14,
    subcategories: ["Consultas", "Medicinas", "Seguro médico", "Dental", "Laboratorio"],
  },
  {
    name: "Educación", icon: "GraduationCap", color: "#8b5cf6", type: "EGRESO", sortOrder: 15,
    subcategories: ["Colegiaturas", "Cursos", "Libros", "Útiles"],
  },
  {
    name: "Entretenimiento", icon: "Gamepad2", color: "#ec4899", type: "EGRESO", sortOrder: 16,
    subcategories: ["Cine", "Eventos", "Viajes", "Hobbies"],
  },
  {
    name: "Ropa y accesorios", icon: "Shirt", color: "#d946ef", type: "EGRESO", sortOrder: 17,
    subcategories: ["Ropa", "Calzado", "Accesorios"],
  },
  {
    name: "Tecnología", icon: "Smartphone", color: "#0ea5e9", type: "EGRESO", sortOrder: 18,
    subcategories: ["Dispositivos", "Accesorios tech", "Software"],
  },
  {
    name: "Suscripciones", icon: "RefreshCw", color: "#14b8a6", type: "EGRESO", sortOrder: 19,
    subcategories: ["Streaming", "Apps", "Cloud", "Herramientas"],
  },
  {
    name: "Seguros", icon: "Shield", color: "#64748b", type: "EGRESO", sortOrder: 20,
    subcategories: ["Auto", "Vida", "Gastos médicos"],
  },
  {
    name: "Impuestos", icon: "Receipt", color: "#78716c", type: "EGRESO", sortOrder: 21,
    subcategories: ["ISR", "IVA", "Tenencia", "Predial"],
  },
  {
    name: "Negocio", icon: "Briefcase", color: "#0284c7", type: "EGRESO", sortOrder: 22,
    subcategories: ["Nómina empleados", "Software / herramientas", "Publicidad", "Insumos", "Servicios profesionales", "Renta oficina"],
  },
  {
    name: "Otro gasto", icon: "MoreHorizontal", color: "#a1a1aa", type: "EGRESO", sortOrder: 23,
    subcategories: ["Regalos", "Donaciones", "Mascotas", "Varios"],
  },

  // FINANCIEROS
  {
    name: "Comisiones bancarias", icon: "Landmark", color: "#dc2626", type: "FINANCIERO", sortOrder: 30,
    subcategories: ["Comisión por manejo", "Anualidad tarjeta", "Comisión transferencia"],
  },
  {
    name: "Intereses", icon: "Percent", color: "#b91c1c", type: "FINANCIERO", sortOrder: 31,
    subcategories: ["Intereses ordinarios", "Intereses moratorios", "IVA de intereses"],
  },
  {
    name: "Pago de tarjeta", icon: "CreditCard", color: "#059669", type: "FINANCIERO", sortOrder: 32,
    subcategories: ["Pago total", "Pago mínimo", "Pago parcial"],
  },
];

async function main() {
  console.log("Seeding categories...");

  for (const cat of CATEGORIES) {
    const { subcategories, ...catData } = cat;

    const category = await prisma.category.upsert({
      where: { name: catData.name },
      update: catData,
      create: catData,
    });

    for (let i = 0; i < subcategories.length; i++) {
      await prisma.subcategory.upsert({
        where: {
          categoryId_name: { categoryId: category.id, name: subcategories[i] },
        },
        update: { sortOrder: i },
        create: {
          categoryId: category.id,
          name: subcategories[i],
          sortOrder: i,
        },
      });
    }
  }

  console.log(`Seeded ${CATEGORIES.length} categories`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
