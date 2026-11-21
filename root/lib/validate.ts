export const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const PHONE = /^\d{9}$/;

// Shared by the public form and the admin edit dialog.
export function check(f: FormData, needAck = false) {
  const values = { nome: str(f, "nome"), instagram: str(f, "instagram").replace(/^@/, ""), telemovel: str(f, "telemovel"), qtd: str(f, "qtd") };
  const qtd = Number(values.qtd);
  const error =
    !values.nome || values.nome.length > 120 ? "Preenche o nome completo."
    : !values.instagram || values.instagram.length > 60 ? "Preenche o teu Instagram."
    : !PHONE.test(values.telemovel) ? "O telemóvel deve ter 9 dígitos, só números."
    : !Number.isInteger(qtd) || qtd < 1 || qtd > 10 ? "Escolhe entre 1 e 10 pulseiras."
    : needAck && !f.get("ack") ? "Confirma que leste como os teus dados são tratados."
    : "";
  return { values, qtd, error };
}
