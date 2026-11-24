import { legalDocuments, type LegalDocument } from "@doodallery/shared";

/* DRAFT legal texts. They describe how the software actually behaves, but
   they are NOT legal advice and must be reviewed by a qualified lawyer in
   Brazil (LGPD, CDC, Marco Civil) before commercial launch. Operator details
   come from LEGAL_* environment variables. */

type Section = [heading: string, body: string];
type Doc = { title: string; sections: Section[] };
type Vars = { entity: string; email: string; brand: string };

const en = (v: Vars): Record<LegalDocument, Doc> => ({
  terms: {
    title: "Terms of service",
    sections: [
      ["Who we are", `${v.brand} is operated by ${v.entity}. Contact: ${v.email}.`],
      ["Your account", "You must provide accurate information, keep your password private and be old enough to contract under the law that applies to you. You are responsible for what you publish."],
      ["Your content stays yours", `You keep all rights to the artwork and text you upload. You grant ${v.brand} only the limited permission needed to store, process (resize and convert) and display your content on the portfolio you publish, for as long as it is published. We do not sell or license your work.`],
      ["Acceptable use", "Do not upload content you do not have the right to share, or content that is illegal, infringing, deceptive or harmful. See the acceptable-use policy."],
      ["Plans and payments", "Paid plans are billed through our payment provider. Features turn on after payment is confirmed. See the refund and cancellation policy."],
      ["Suspension", "We may restrict accounts that break these terms or the law, after review. Restricted portfolios go offline; you can still contact support and export your data."],
      ["Changes", "We will notify you of material changes and ask you to accept new versions."],
    ],
  },
  privacy: {
    title: "Privacy policy",
    sections: [
      ["Data we keep", "Account: email, display name, password hash, verification status. Content: your portfolio and uploads. Billing: plan, amounts, dates and the payment provider's customer reference. We do not store card numbers or your CPF/CNPJ; those go directly to the payment provider."],
      ["Reading and video", "Comic preferences and progress are stored on your device. Loading a YouTube player connects your browser to YouTube. Artists can separately opt into the public directory."],
      ["Visitor analytics", "Public portfolio views are counted on our servers as daily totals per page, a referrer category and, if our hosting edge supplies it, a country code. We do not use cookies for analytics and we do not store visitors' IP addresses, browsers or identifiers."],
      ["Processors", "Hosting, database, object storage, transactional email and the payment provider process data on our behalf. [LIST PROVIDERS AND COUNTRIES]."],
      ["Your rights (LGPD)", `You can export your data from Settings, correct it, or delete your account at any time. Contact ${v.email} for other requests.`],
      ["Retention", "Deleted accounts are removed from the live database immediately. Billing records required by law are kept without your login data. Backups expire after [RETENTION PERIOD]. Aggregate analytics are kept for up to 400 days."],
    ],
  },
  refunds: {
    title: "Refund and cancellation policy",
    sections: [
      ["Cancel any time", "Cancelling stops future charges. Paid features continue until the end of the period you already paid for. Your content is never deleted because a plan ends."],
      ["Card and Pix", "Card subscriptions renew automatically. Pix subscriptions send an invoice each cycle that you pay manually; they never renew without your payment."],
      ["Refunds", "[DEFINE REFUND WINDOW, e.g. right of withdrawal within 7 days under the Brazilian Consumer Defense Code (art. 49)]. Refund requests: " + v.email + "."],
      ["Failed payments", "If a renewal is not confirmed, your plan stays active for a 7-day grace period. After that the portfolio continues on the free plan with all content preserved."],
      ["Plan changes", "Upgrades apply as soon as the new payment is confirmed; there is no proration. Downgrades start when the current paid period ends."],
    ],
  },
  content: {
    title: "Content ownership policy",
    sections: [
      ["AI training", "We never use uploaded artist content to train AI models."],
      ["Digital products", "The external store named on the product page handles payment and order support. Artists may authorize private file delivery after checking an order."],
      ["Ownership", `Artists own their work. ${v.brand} claims no ownership of uploaded artwork, and the platform name never replaces your authorship on your portfolio.`],
      ["Processing", "Uploads are re-encoded for display and stripped of camera metadata. Originals are not shared with third parties beyond our storage processors."],
      ["After deletion", "Deleting an artwork or your account removes it from your portfolio; stored files are queued for deletion."],
    ],
  },
  "acceptable-use": {
    title: "Acceptable-use policy",
    sections: [
      ["Not allowed", "Content that infringes copyright or trademarks, sexual content involving minors, harassment, threats, malware, phishing, impersonation, or anything illegal in Brazil or where you live."],
      ["Mature art", "[DEFINE POLICY FOR ADULT OR MATURE ARTWORK]."],
      ["Enforcement", "Reports are reviewed by people. We may remove content or restrict accounts, and we keep a record of administrative actions."],
    ],
  },
  copyright: {
    title: "Copyright and takedown requests",
    sections: [
      ["Report infringement", "If a portfolio uses your work without permission, send the address of the page, a description of your work, your contact details and a statement that you are the rights holder or authorized to act for them."],
      ["Appeals", `Send the portfolio address, the decision you received and any supporting information to ${v.email} for human review.`],
      ["What happens next", "We review each notice, may restrict the content while we do, and inform the portfolio owner, who may respond."],
    ],
  },
});
const pt = (v: Vars): Record<LegalDocument, Doc> => ({
  terms: {
    title: "Termos de uso",
    sections: [
      ["Quem somos", `${v.brand} é operado por ${v.entity}. Contato: ${v.email}.`],
      ["Sua conta", "Você deve fornecer informações corretas, manter a senha em sigilo e ter idade para contratar segundo a lei aplicável. Você é responsável pelo que publica."],
      ["Seu conteúdo continua seu", `Você mantém todos os direitos sobre as obras e textos enviados. Concede a ${v.brand} apenas a permissão limitada para armazenar, processar (redimensionar e converter) e exibir o conteúdo no portfólio que você publica, enquanto estiver publicado. Não vendemos nem licenciamos suas obras.`],
      ["Uso aceitável", "Não envie conteúdo que você não tenha direito de compartilhar, nem conteúdo ilegal, infrator, enganoso ou nocivo. Veja a política de uso aceitável."],
      ["Planos e pagamentos", "Planos pagos são cobrados pelo nosso provedor de pagamento. Os recursos são liberados após a confirmação do pagamento. Veja a política de reembolso e cancelamento."],
      ["Suspensão", "Podemos restringir contas que violem estes termos ou a lei, após análise. Portfólios restritos saem do ar; você ainda pode falar com o suporte e exportar seus dados."],
      ["Alterações", "Avisaremos sobre mudanças relevantes e pediremos seu aceite das novas versões."],
    ],
  },
  privacy: {
    title: "Política de privacidade",
    sections: [
      ["Dados que guardamos", "Conta: e-mail, nome artístico, hash da senha, status de verificação. Conteúdo: portfólio e envios. Cobrança: plano, valores, datas e a referência de cliente do provedor. Não guardamos números de cartão nem seu CPF/CNPJ; eles vão diretamente ao provedor de pagamento."],
      ["Estatísticas de visitantes", "Visualizações do portfólio público são contadas nos nossos servidores como totais diários por página, uma categoria de origem e, se a infraestrutura informar, o país. Não usamos cookies de estatística nem guardamos IP, navegador ou identificadores de visitantes."],
      ["Operadores", "Hospedagem, banco de dados, armazenamento de arquivos, e-mail transacional e provedor de pagamento tratam dados em nosso nome. [LISTAR FORNECEDORES E PAÍSES]."],
      ["Leitura e vídeo", "As preferências e o progresso de leitura ficam no seu dispositivo. Ao carregar um player do YouTube, seu navegador se conecta ao YouTube. Artistas podem optar separadamente por aparecer no diretório público."],
      ["Seus direitos (LGPD)", `Você pode exportar seus dados nas Configurações, corrigi-los ou excluir a conta a qualquer momento. Outros pedidos: ${v.email}.`],
      ["Retenção", "Contas excluídas saem do banco de dados ativo imediatamente. Registros de cobrança exigidos por lei são mantidos sem dados de acesso. Backups expiram após [PERÍODO]. Estatísticas agregadas ficam até 400 dias."],
    ],
  },
  refunds: {
    title: "Política de reembolso e cancelamento",
    sections: [
      ["Cancele quando quiser", "O cancelamento interrompe cobranças futuras. Os recursos pagos continuam até o fim do período já pago. Seu conteúdo nunca é apagado porque um plano terminou."],
      ["Cartão e Pix", "Assinaturas no cartão renovam automaticamente. No Pix enviamos uma fatura a cada ciclo para pagamento manual; nunca há renovação sem o seu pagamento."],
      ["Reembolsos", "[DEFINIR PRAZO, ex.: direito de arrependimento em 7 dias conforme o art. 49 do CDC]. Pedidos: " + v.email + "."],
      ["Pagamentos não confirmados", "Se uma renovação não for confirmada, o plano segue ativo por 7 dias de carência. Depois, o portfólio continua no plano grátis com todo o conteúdo preservado."],
      ["Mudança de plano", "Upgrades valem assim que o novo pagamento é confirmado, sem proporcionalidade. Reduções começam ao fim do período pago atual."],
    ],
  },
  content: {
    title: "Política de propriedade do conteúdo",
    sections: [
      ["Treinamento de IA", "Nunca usamos o conteúdo enviado por artistas para treinar modelos de IA."],
      ["Produtos digitais", "A loja externa indicada na página do produto cuida do pagamento e do atendimento do pedido. O artista pode autorizar a entrega privada de arquivos após conferir o pedido."],
      ["Propriedade", `As obras pertencem aos artistas. ${v.brand} não reivindica a propriedade das obras enviadas, e o nome da plataforma nunca substitui sua autoria no portfólio.`],
      ["Processamento", "Os envios são recodificados para exibição e têm os metadados de câmera removidos. Os originais não são compartilhados com terceiros além dos operadores de armazenamento."],
      ["Após a exclusão", "Excluir uma obra ou a conta a remove do portfólio; os arquivos armazenados entram na fila de exclusão."],
    ],
  },
  "acceptable-use": {
    title: "Política de uso aceitável",
    sections: [
      ["Não permitido", "Conteúdo que viole direitos autorais ou marcas, conteúdo sexual envolvendo menores, assédio, ameaças, malware, phishing, falsidade ideológica ou qualquer coisa ilegal no Brasil ou onde você vive."],
      ["Arte adulta", "[DEFINIR POLÍTICA PARA ARTE ADULTA OU SENSÍVEL]."],
      ["Aplicação", "Denúncias são analisadas por pessoas. Podemos remover conteúdo ou restringir contas, e registramos as ações administrativas."],
    ],
  },
  copyright: {
    title: "Direitos autorais e pedidos de remoção",
    sections: [
      ["Denuncie uma violação", "Se um portfólio usa sua obra sem permissão, envie o endereço da página, a descrição da obra, seus contatos e uma declaração de que você é titular dos direitos ou está autorizado a agir em nome dele."],
      ["Recursos", `Envie o endereço do portfólio, a decisão recebida e as informações de apoio para ${v.email} para análise humana.`],
      ["O que acontece depois", "Analisamos cada pedido, podemos restringir o conteúdo durante a análise e informamos o dono do portfólio, que pode responder."],
    ],
  },
});

export function legal(doc: string, lang: "en" | "pt-BR", brand: string) {
  if (!(doc in legalDocuments)) return null;
  const vars = {
    brand,
    entity: process.env.LEGAL_ENTITY_NAME || "[LEGAL ENTITY NAME AND CNPJ]",
    email: process.env.SUPPORT_EMAIL || "[SUPPORT EMAIL]",
  };
  return {
    ...(lang === "en" ? en(vars) : pt(vars))[doc as LegalDocument],
    version: legalDocuments[doc as LegalDocument],
  };
}
