export interface Department {
  name: string;
  categories: string[];
  subcategories?: Record<string, string[]>;
}

export const DEPARTMENTS: Department[] = [
  {
    name: "Medicamentos",
    categories: [
      "Analgésicos e Antitérmicos",
      "Antibióticos",
      "Anti-inflamatórios",
      "Alergias",
      "Gripe e Resfriado",
      "Digestivo",
      "Cardiovascular",
      "Diabetes",
      "Saúde Mental",
      "Genéricos",
    ],
  },
  {
    name: "Saúde e Bem-Estar",
    categories: [
      "Vitaminas",
      "Suplementos",
      "Imunidade",
      "Sono e Relaxamento",
      "Energia e Disposição",
    ],
  },
  {
    name: "Dermocosméticos",
    categories: [
      "Protetor Solar",
      "Hidratantes",
      "Limpeza Facial",
      "Anti-idade",
      "Ácido Hialurônico",
      "Tratamento para Acne",
    ],
  },
  {
    name: "Higiene e Cuidados Pessoais",
    categories: [
      "Sabonetes",
      "Shampoos e Condicionadores",
      "Desodorantes",
      "Cuidados Bucais",
      "Absorventes",
    ],
  },
  {
    name: "Infantil e Gestante",
    categories: ["Troca de Fralda"],
    subcategories: {
      "Troca de Fralda": ["Creme para Assadura"],
    },
  },
  {
    name: "Mamãe e Bebê",
    categories: [
      "Fraldas",
      "Alimentação Infantil",
      "Higiene do Bebê",
      "Cuidados com a Mamãe",
      "Chupetas e Mamadeiras",
    ],
  },
  {
    name: "Nutrição e Suplementos",
    categories: [
      "Whey Protein",
      "Creatina",
      "Termogênicos",
      "Vitaminas e Minerais",
      "Chás e Infusões",
    ],
  },
  {
    name: "Beleza e Perfumaria",
    categories: [
      "Maquiagem",
      "Perfumes",
      "Cabelos",
      "Unhas",
      "Kits de Beleza",
    ],
  },
  {
    name: "Ortopedia e Acessórios",
    categories: [
      "Joelheiras",
      "Tornozeleiras",
      "Cintas",
      "Muletas",
      "Bolsas Térmicas",
    ],
  },
];
