export type StockLevel = "in" | "low" | "reserve"

export type Product = {
  id: string
  name: string
  brand: string
  category: "disposables" | "hardware" | "pods-coils" | "snus-pouches" | "skins-papers" | "cigarettes" | "grinders-access"
  price: number
  puffs?: string
  nicotine?: string
  stock: StockLevel
  accent: "blue" | "cyan" | "violet" | "amber"
  description: string
}

export const CATEGORIES = [
  { id: "all", label: "All Products" },
  { id: "disposables", label: "Disposables" },
  { id: "hardware", label: "Vapes & Mods" },
  { id: "pods-coils", label: "Pods & Coils" },
  { id: "snus-pouches", label: "Snus & Pouches" },
  { id: "skins-papers", label: "Skins & Papers" },
  { id: "cigarettes", label: "Cigarettes" },
  { id: "grinders-access", label: "Grinders & Access." },
] as const

export const PRODUCTS: Product[] = [
  // === DISPOSABLES ===
  {
    id: "sk-01",
    name: "Pulse 600 Disposable",
    brand: "Pulse",
    category: "disposables",
    price: 12.50,
    puffs: "600 puffs",
    nicotine: "20mg salt",
    stock: "in",
    accent: "blue",
    description: "Up to 600 puffs with dual mesh coil technology for an enhanced, consistent flavor profile.",
  },
  {
    id: "sk-02",
    name: "Lost Mary 4in1",
    brand: "Lost Mary",
    category: "disposables",
    price: 23.20,
    puffs: "2400 puffs",
    nicotine: "20mg salt",
    stock: "in",
    accent: "cyan",
    description: "Multi-pod rotary system featuring 4 separate pre-filled pods. Built for a seamless fast handover.",
  },
  {
    id: "sk-03",
    name: "Lost Mary BM600",
    brand: "Lost Mary",
    category: "disposables",
    price: 9.50,
    puffs: "600 puffs",
    nicotine: "20mg salt",
    stock: "low",
    accent: "violet",
    description: "Compact ergonomic square profile disposable vape. Clean draw, ready to go for quick top-ups.",
  },

  // === VAPES & MODS (HARDWARE) ===
  {
    id: "sk-04",
    name: "Vaporesso XROS 4 Kit",
    brand: "Vaporesso",
    category: "hardware",
    price: 34.99,
    nicotine: "Pod Kit",
    stock: "in",
    accent: "blue",
    description: "Premium aluminum alloy body with precise airflow controls and fast Corex 2.0 heating systems.",
  },
  {
    id: "sk-05",
    name: "Geekvape L200 Mod",
    brand: "Geekvape",
    category: "hardware",
    price: 64.99,
    nicotine: "200W Mod",
    stock: "low",
    accent: "amber",
    description: "Legendary rugged 200W dual-battery device featuring IP68 water, dust, and shock resistance.",
  },

  // === PODS & COILS ===
  {
    id: "sk-06",
    name: "Xros Replacement Pods 4-Pack",
    brand: "Vaporesso",
    category: "pods-coils",
    price: 14.00,
    nicotine: "0.8Ω Mesh",
    stock: "in",
    accent: "cyan",
    description: "Official leak-resistant replacement pods featuring localized core magnetic seating.",
  },
  {
    id: "sk-07",
    name: "PnP Coil 5-Pack",
    brand: "VooPoo",
    category: "pods-coils",
    price: 17.50,
    nicotine: "0.3Ω Mesh",
    stock: "in",
    accent: "amber",
    description: "Sub-ohm mesh design built for maximum performance, density, and crisp taste presentation.",
  },

  // === SNUS & POUCHES ===
  {
    id: "sk-08",
    name: "Velox Mint 14mg",
    brand: "Velox",
    category: "snus-pouches",
    price: 8.50,
    nicotine: "14mg/g strength",
    stock: "in",
    accent: "blue",
    description: "Slim format, intense fresh mint profile offering complete tobacco-free discretion.",
  },
  {
    id: "sk-09",
    name: "Killa Cold Mint",
    brand: "Killa",
    category: "snus-pouches",
    price: 9.00,
    nicotine: "16mg/g strength",
    stock: "in",
    accent: "violet",
    description: "Renowned strong execution kick with an ice-cold burst of sweet menthol undertones.",
  },
  {
    id: "sk-10",
    name: "Siberia Extremely Strong",
    brand: "Siberia",
    category: "snus-pouches",
    price: 11.00,
    nicotine: "43mg/g strength",
    stock: "reserve",
    accent: "cyan",
    description: "Traditional dry portion format deliverable. Highly potent cold-burn rush.",
  },

  // === SKINS & PAPERS ===
  {
    id: "sk-11",
    name: "RAW Classic King Size Slim",
    brand: "RAW",
    category: "skins-papers",
    price: 2.50,
    stock: "in",
    accent: "amber",
    description: "Unbleached natural hemp plant fibers with zero additives for an completely even, slow burn.",
  },
  {
    id: "sk-12",
    name: "OCB Premium Slim + Tips",
    brand: "OCB",
    category: "skins-papers",
    price: 3.00,
    stock: "in",
    accent: "blue",
    description: "Ultra-thin, clear lightweight flax papers packaged alongside premium protective perforated structural tips.",
  },
  {
    id: "sk-13",
    name: "Elements Rice Papers",
    brand: "Elements",
    category: "skins-papers",
    price: 2.20,
    stock: "low",
    accent: "cyan",
    description: "Pure ultra-thin rice paper. Zero ash production featuring a specialized sugar gum seal track.",
  },

  // === CIGARETTES ===
  {
    id: "sk-14",
    name: "Marlboro Gold 20s",
    brand: "Marlboro",
    category: "cigarettes",
    price: 18.15,
    stock: "in",
    accent: "amber",
    description: "Standard factory-sealed 20-pack box of premium king-size smooth blend cigarettes.",
  },
  {
    id: "sk-15",
    name: "John Player Blue 20s",
    brand: "John Player",
    category: "cigarettes",
    price: 18.25,
    stock: "in",
    accent: "blue",
    description: "Traditional classic rich domestic premium filter cigarette blend. Pack of 20.",
  },
  {
    id: "sk-16",
    name: "Amber Leaf 30g Pouch w/ Papers",
    brand: "Amber Leaf",
    category: "cigarettes",
    price: 27.60,
    stock: "in",
    accent: "violet",
    description: "Premium fine-cut hand rolling tobacco pouch. Conveniently includes 50 official rolling papers.",
  },

  // === GRINDERS & ACCESSORIES ===
  {
    id: "sk-17",
    name: "4-Piece Space Aluminium Grinder",
    brand: "Sky Smoke Accessories",
    category: "grinders-access",
    price: 24.99,
    stock: "in",
    accent: "cyan",
    description: "Heavy-duty aerospace-grade anodized aluminum construct with razor sharp teeth and fine micron sifter mesh screen.",
  },
  {
    id: "sk-18",
    name: "RAW Rolling Tray",
    brand: "RAW",
    category: "grinders-access",
    price: 12.00,
    stock: "low",
    accent: "amber",
    description: "Smooth heavy-gauge metallic surface design with high curved anti-spill edges for optimized rolling workspace handling.",
  }
]

export const STORE = {
  name: "Sky Smoke 1",
  addressLine1: "47 Maylor St, Centre",
  addressLine2: "Cork, T12 AH70",
  phone: "085 805 1510",
  rating: 4.7,
  reviews: 28,
  closeHour: 23, // 11 PM
  openHour: 9,
}