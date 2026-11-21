import Countdown from "./countdown";
import DialogLink from "./dialog-link";
import ReservationForm from "./reservation-form";
import Reveal from "./reveal";
import SmoothLink from "./smooth-link";

import {h2} from "./ui";
import Image from "next/image";

// Drop photos in public/gallery and list them here, e.g. "/gallery/1.jpg". Empty shows placeholders.
const gallery: string[] = [];

const privacy: [string, React.ReactNode][] = [
    ["Responsável", <>Gonçalo Faria, em nome da Organização PateiraEssence. Contacto por mensagem privada no
        Instagram <a className="text-gold underline"
                     href="https://www.instagram.com/pateiraessence/">@pateiraessence</a>.</>],
    ["Dados recolhidos", "Nome completo, Instagram, telemóvel, quantidade de pulseiras, data e hora da confirmação de leitura, data do pedido, estado (pendente, confirmado, lista de espera ou recusado) e notas internas da organização. Todos os campos do formulário são obrigatórios; sem eles não é possível fazer a pré-reserva."],
    ["Finalidade", "Apenas gerir e contactar sobre pré-reservas. O telemóvel também serve para juntar pedidos repetidos e aplicar o limite de 10 pulseiras por pessoa: um novo pedido com o mesmo número soma-se ao anterior e volta ao estado pendente. Sem publicidade. Sem decisões automatizadas."],
    ["Base legal", "Diligências pré-contratuais a pedido do titular, art. 6.º, n.º 1, al. b) do RGPD. A caixa de confirmação é um reconhecimento de leitura, não um consentimento."],
    ["Acesso e subcontratantes", <>Apenas a organização, através de uma área protegida com acesso por conta. Os dados
        ficam guardados num fornecedor de base de dados e o site é servido por um fornecedor de alojamento; ambos podem
        tratar dados fora do EEE, com as garantias previstas no RGPD (como cláusulas contratuais-tipo). Para proteger o
        formulário contra robôs usamos o Cloudflare Turnstile, que trata sinais do navegador (endereço IP, impressão TLS,
        User-Agent) apenas para detetar e bloquear robôs. A Cloudflare atua como subcontratante nesta verificação e, para
        melhorar a deteção de robôs, como responsável pelo tratamento, com base no interesse legítimo; pode haver
        tratamento nos EUA, ao abrigo do Quadro de Privacidade de Dados UE-EUA. <a className="text-gold underline"
        href="https://www.cloudflare.com/privacypolicy/">Política da Cloudflare</a>.</>],
    ["Instagram", <>O contacto é feito por mensagem privada no Instagram, que é tratado pela Meta segundo a sua própria
        política. <a className="text-gold underline" href="https://privacycenter.instagram.com/policy">Política do
            Instagram</a>.</>],
    ["Cookies e rastreio", "Não usamos cookies próprios nem estatísticas ou ferramentas de rastreio. A verificação anti-robô (Cloudflare Turnstile) corre apenas no formulário, para o proteger. Só a área da organização usa cookies de sessão, estritamente necessários para o início de sessão."],
    ["Conservação", "Até 30 dias após o fim do evento; depois os dados são apagados ou anonimizados pela organização (não automaticamente). Só se mantêm totais agregados."],
    ["Direitos", <>Acesso, retificação, apagamento, limitação e portabilidade, por mensagem no Instagram (podemos pedir
        confirmação de identidade, por exemplo o número de telemóvel usado no pedido). Reclamações à <a
            className="text-gold underline" href="https://www.cnpd.pt">CNPD</a>.</>],
];

export default function Home() {
    return (
        <>
            <Reveal/>
            <header className="relative flex min-h-svh flex-col items-center justify-end px-6 pb-10 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <Image
                    src="/hero_wide_4k.jpg"
                    alt="Vista noturna da Pateira de Fermentelos com luzes douradas refletidas na água"
                    fill
                    priority
                    sizes={"100vw"}
                    style={{ objectFit: "cover", objectPosition: "center 40%" }}
                    //className="hero-img absolute inset-0 h-full w-full object-cover"
                    quality={90}
                />
                <div
                    className="absolute inset-0 bg-[linear-gradient(180deg,oklch(12%_.012_30/.55)_0%,oklch(12%_.012_30/.1)_35%,oklch(12%_.012_30/.75)_75%,oklch(12%_.012_30)_100%)]"/>
                <div className="stagger relative flex flex-col items-center">
                    <p className="mb-4 text-xs uppercase tracking-[0.4em] text-gold">Pateira de Fermentelos</p>
                    <h1 className="text-gold-gradient font-display text-7xl font-semibold tracking-[0.12em] sm:text-9xl">ESSENCE</h1>
                    <p className="font-display text-2xl italic text-cream sm:text-3xl">New Year&apos;s Eve 2026/27</p>
                    <div className="mt-6"><Countdown/></div>
                    <p className="mt-6 text-sm uppercase tracking-[0.4em] text-cream">31 · Dezembro</p>
                    <SmoothLink href="#pre-reserva"
                                className="mt-10 rounded-full bg-gold px-8 py-3.5 text-sm font-medium uppercase tracking-widest text-night btn hover:brightness-110">
                        Fazer pré-reserva
                    </SmoothLink>
                    <p className="mt-4 text-xs text-muted">Sujeita a confirmação · não garante pulseira</p>
                </div>
            </header>

            <main className="mx-auto w-full max-w-2xl px-6 py-20">
                <dl data-reveal className="grid grid-cols-2 gap-4 text-center">
                    {[["Data", "31 dez 2026"], ["Local", "Pateira de Fermentelos"]].map(([k, v]) => (
                        <div key={k} className="rounded-lg border border-line bg-card p-5">
                            <dt className="text-xs uppercase tracking-[0.3em] text-gold">{k}</dt>
                            <dd className="mt-2 font-display text-xl">{v}</dd>
                        </div>
                    ))}
                </dl>

                <section data-reveal role="note"
                         className="mt-16 rounded-lg border border-[oklch(75%_.15_65/.5)] bg-[oklch(24%_.06_65)] p-6">
                    <h2 className={h2}>Importante</h2>
                    <p className="mt-3 leading-relaxed text-muted">
                        A pré-reserva não garante pulseira. Serve apenas para registar o teu interesse. A organização
                        analisa cada pedido e confirma diretamente a disponibilidade e as condições. Não são
                        apresentados preços nesta página.
                    </p>
                </section>

                <section data-reveal className="mt-20">
                    <p className="text-xs uppercase tracking-[0.4em] text-gold">Última edição</p>
                    <h2 className={h2}>Memórias</h2>
                    <div className="mt-8 grid grid-cols-2 gap-3">
                        {(gallery.length ? gallery : Array<string>(6).fill("")).map((src, i) =>
                            src ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img key={src} src={src} alt={`Foto ${i + 1} da última festa`} loading="lazy"
                                     className="aspect-square w-full rounded-lg object-cover"/>
                            ) : (
                                <div key={i}
                                     className="flex aspect-square items-center justify-center rounded-lg border border-line bg-card text-xs uppercase tracking-[0.3em] text-muted">Em
                                    breve</div>
                            ),
                        )}
                    </div>
                </section>

                <section id="pre-reserva" data-reveal className="mt-20 scroll-mt-8">
                    <p className="text-xs uppercase tracking-[0.4em] text-gold">Pré-reserva</p>
                    <h2 className={h2}>Pulseiras</h2>
                    <ReservationForm/>
                </section>

            </main>

            <dialog id="dados" aria-labelledby="dados-t"
                    className="m-auto max-h-[85svh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-lg border border-line bg-card p-6 text-cream backdrop:bg-black/70 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                    <h2 id="dados-t" className={h2}>Os teus dados</h2>
                    <form method="dialog">
                        <button aria-label="Fechar"
                                className="btn -mr-2 flex h-10 w-10 items-center justify-center rounded-md text-2xl text-muted hover:text-gold">×
                        </button>
                    </form>
                </div>
                <div className="mt-6 space-y-5 text-sm leading-relaxed text-muted">
                    {privacy.map(([t, c]) => (
                        <div key={t}><h3 className="mb-1 font-medium text-cream">{t}</h3><p>{c}</p></div>
                    ))}
                    <p className="text-xs">Última atualização: 21 de novembro de 2026.</p>
                </div>
            </dialog>

            <footer className="border-t border-line px-6 py-10 text-center">
                <p className="font-display text-2xl tracking-[0.2em] text-gold">ESSENCE</p>
                <p className="mt-1 text-xs text-muted">NYE 2026/27 · Pateira de Fermentelos</p>
                <div className="mt-4 flex justify-center gap-5 text-xs text-muted underline">
                    <DialogLink target="dados">Privacidade</DialogLink>
                    <a href="/auth">Organização</a>
                </div>
            </footer>
        </>
    );
}
