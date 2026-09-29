export interface ContentPillar {
  id: string;
  name: string;
  angleDescription: string;
}

export const CONTENT_PILLARS: ContentPillar[] = [
  {
    id: "guia_pratico",
    name: "Pilar 1: Guia prático / Dica de manutenção preventiva ou cuidado rápido",
    angleDescription:
      "Guia prático com dicas de cuidados essenciais, manutenção preventiva ou rotina ideal que o cliente local pode aplicar imediatamente no dia a dia para preservar os resultados e evitar problemas.",
  },
  {
    id: "mito_vs_verdade",
    name: "Pilar 2: Mito vs. Verdade sobre os serviços prestados",
    angleDescription:
      "Desmistificar mitos e crenças populares sobre os serviços ou procedimentos do nicho, apresentando fatos técnicos com autoridade, clareza e transparência.",
  },
  {
    id: "sinais_alerta",
    name: "Pilar 3: Sinais de alerta (quando o cliente precisa procurar o serviço com urgência)",
    angleDescription:
      "Identificar sinais claros de perigo, desgaste ou necessidade imediata de atendimento, mostrando por que adiar a visita pode causar prejuízos ou agravar a situação.",
  },
  {
    id: "bastidores_tecnologia",
    name: "Pilar 4: Bastidores / Tecnologia, precisão e peças/produtos de alta qualidade usados",
    angleDescription:
      "Mostrar os bastidores da execução, o rigor técnico, os equipamentos modernos, ferramentas de precisão ou produtos de primeira linha utilizados para entregar um resultado impecável.",
  },
  {
    id: "faq_cliente",
    name: "Pilar 5: Pergunta frequente de clientes respondida de forma simples e técnica",
    angleDescription:
      "Responder a uma das dúvidas mais comuns dos clientes de forma direta, didática, acolhedora e acessível, quebrando inseguranças e facilitando o agendamento.",
  },
  {
    id: "economia_seguranca",
    name: "Pilar 6: Economia e segurança a longo prazo",
    angleDescription:
      "Demonstrar como a manutenção regular e a contratação de profissionais especializados geram economia financeira real e garantem tranquilidade e segurança a longo prazo.",
  },
];
