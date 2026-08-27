import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const Condition = { NEW: "NEW", USED: "USED", REFURBISHED: "REFURBISHED" } as const;
const PaymentMethod = { CASH: "CASH" } as const;

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const adminPassword = await bcrypt.hash("Admin@123", 10);
  const staffPassword = await bcrypt.hash("Staff@123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@laptopshop.com" },
    update: {},
    create: {
      name: "Shop Admin",
      email: "admin@laptopshop.com",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: "staff@laptopshop.com" },
    update: {},
    create: {
      name: "Sales Staff",
      email: "staff@laptopshop.com",
      passwordHash: staffPassword,
      role: "STAFF",
    },
  });

  const brands = await Promise.all(
    ["Dell", "HP", "Lenovo", "Apple", "Asus"].map((name) =>
      prisma.brand.upsert({ where: { name }, update: {}, create: { name } })
    )
  );

  const categories = await Promise.all(
    ["Business Laptop", "Gaming Laptop", "Ultrabook", "Budget Laptop"].map((name) =>
      prisma.category.upsert({ where: { name }, update: {}, create: { name } })
    )
  );

  const productData = [
    {
      sku: "DELL-LAT-5420",
      name: "Dell Latitude 5420",
      brand: "Dell",
      category: "Business Laptop",
      cpu: "Intel Core i5-1135G7",
      ram: "16GB",
      storage: "512GB SSD",
      screenSize: '14"',
      condition: Condition.NEW,
      costPrice: 650,
      sellingPrice: 899,
      stockQuantity: 12,
      reorderLevel: 4,
    },
    {
      sku: "HP-EB-840",
      name: "HP EliteBook 840 G8",
      brand: "HP",
      category: "Business Laptop",
      cpu: "Intel Core i7-1165G7",
      ram: "16GB",
      storage: "1TB SSD",
      screenSize: '14"',
      condition: Condition.NEW,
      costPrice: 780,
      sellingPrice: 1099,
      stockQuantity: 8,
      reorderLevel: 3,
    },
    {
      sku: "LEN-LOQ-15",
      name: "Lenovo LOQ 15",
      brand: "Lenovo",
      category: "Gaming Laptop",
      cpu: "AMD Ryzen 7 7840HS",
      ram: "16GB",
      storage: "512GB SSD",
      screenSize: '15.6"',
      condition: Condition.NEW,
      costPrice: 900,
      sellingPrice: 1249,
      stockQuantity: 5,
      reorderLevel: 2,
    },
    {
      sku: "APL-MBA-M2",
      name: 'Apple MacBook Air 13" M2',
      brand: "Apple",
      category: "Ultrabook",
      cpu: "Apple M2",
      ram: "8GB",
      storage: "256GB SSD",
      screenSize: '13.6"',
      condition: Condition.NEW,
      costPrice: 950,
      sellingPrice: 1299,
      stockQuantity: 6,
      reorderLevel: 2,
    },
    {
      sku: "ASUS-VB-14",
      name: "Asus VivoBook 14",
      brand: "Asus",
      category: "Budget Laptop",
      cpu: "Intel Core i3-1215U",
      ram: "8GB",
      storage: "256GB SSD",
      screenSize: '14"',
      condition: Condition.NEW,
      costPrice: 320,
      sellingPrice: 459,
      stockQuantity: 2,
      reorderLevel: 5,
    },
    {
      sku: "DELL-XPS-13-REF",
      name: "Dell XPS 13 (Refurbished)",
      brand: "Dell",
      category: "Ultrabook",
      cpu: "Intel Core i7-1165G7",
      ram: "16GB",
      storage: "512GB SSD",
      screenSize: '13.3"',
      condition: Condition.REFURBISHED,
      costPrice: 500,
      sellingPrice: 749,
      stockQuantity: 3,
      reorderLevel: 2,
    },
  ];

  const products = [];
  for (const p of productData) {
    const brand = brands.find((b) => b.name === p.brand)!;
    const category = categories.find((c) => c.name === p.category)!;
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        sku: p.sku,
        name: p.name,
        brandId: brand.id,
        categoryId: category.id,
        cpu: p.cpu,
        ram: p.ram,
        storage: p.storage,
        screenSize: p.screenSize,
        condition: p.condition,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
        stockQuantity: p.stockQuantity,
        reorderLevel: p.reorderLevel,
      },
    });
    products.push(product);
  }

  const existingCustomer = await prisma.customer.findFirst({
    where: { email: "john.mwangi@example.com" },
  });
  const customer =
    existingCustomer ??
    (await prisma.customer.create({
      data: {
        name: "John Mwangi",
        email: "john.mwangi@example.com",
        phone: "+254712345678",
        address: "Nairobi, Kenya",
      },
    }));

  let supplier = await prisma.supplier.findFirst({
    where: { name: "TechDistro Wholesale" },
  });
  if (!supplier) {
    supplier = await prisma.supplier.create({
      data: {
        name: "TechDistro Wholesale",
        contactPerson: "Grace Wanjiru",
        email: "sales@techdistro.example.com",
        phone: "+254700111222",
        address: "Industrial Area, Nairobi",
      },
    });
  }

  // Sample completed sale (idempotent)
  const existingSale = await prisma.sale.findUnique({ where: { invoiceNumber: "INV-0001" } });
  if (!existingSale) {
    const saleProduct = products[0];
    const qty = 1;
    const lineTotal = saleProduct.sellingPrice * qty;
    await prisma.sale.create({
      data: {
        invoiceNumber: "INV-0001",
        customerId: customer.id,
        userId: staff.id,
        subtotal: lineTotal,
        discount: 0,
        tax: 0,
        total: lineTotal,
        paymentMethod: PaymentMethod.CASH,
        items: {
          create: [
            {
              productId: saleProduct.id,
              quantity: qty,
              unitPrice: saleProduct.sellingPrice,
              lineTotal,
            },
          ],
        },
      },
    });
    await prisma.product.update({
      where: { id: saleProduct.id },
      data: { stockQuantity: { decrement: qty } },
    });
  }

  // Sample repair ticket (idempotent)
  const existingTicket = await prisma.repairTicket.findUnique({ where: { ticketNumber: "RT-0001" } });
  if (!existingTicket) {
    await prisma.repairTicket.create({
      data: {
        ticketNumber: "RT-0001",
        customerId: customer.id,
        technicianId: admin.id,
        deviceBrand: "HP",
        deviceModel: "Pavilion 15",
        serialNumber: "HP-SN-99231",
        issueDescription: "Laptop does not power on. Suspected motherboard/charging IC issue.",
        status: "DIAGNOSING",
        estimatedCost: 80,
      },
    });
  }

  // Sample pending purchase order (idempotent)
  const existingPO = await prisma.purchaseOrder.findUnique({ where: { poNumber: "PO-0001" } });
  if (!existingPO) {
    const poProduct = products[4];
    await prisma.purchaseOrder.create({
      data: {
        poNumber: "PO-0001",
        supplierId: supplier.id,
        userId: admin.id,
        status: "PENDING",
        totalCost: poProduct.costPrice * 10,
        items: {
          create: [
            {
              productId: poProduct.id,
              quantity: 10,
              unitCost: poProduct.costPrice,
            },
          ],
        },
      },
    });
  }

  console.log("Seed complete.");
  console.log("Login with: admin@laptopshop.com / Admin@123 (ADMIN)");
  console.log("       or: staff@laptopshop.com / Staff@123 (STAFF)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
