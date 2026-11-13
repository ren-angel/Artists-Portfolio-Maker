import { ArrowRight, Sparkles } from "lucide-react";
import { templateNames, type Template } from "@studio/shared";
import { brand, language } from "../lib/server";
import { t } from "../lib/copy";
import { Brand } from "../components/Brand";
import { Language } from "../components/Language";
import { print } from "../lib/demo";
function Mini({ type, name }: { type: Template; name: string }) {
  return (
    <figure className={"mini mini-" + type}>
      <div className="browserdots">
        <i />
        <i />
        <i />
      </div>
      <figcaption>
        {name} <span>✧</span>
      </figcaption>
      <img src={print(type)} alt="" />
      <div className="mini-line" />
    </figure>
  );
}
export default async function Home() {
  const l = await language();
  return (
    <>
      <header className="marketing-head">
        <Brand name={brand()} />
        <nav>
          <a href="#templates">{t(l, "templates")}</a>
          <a href="#process">{t(l, "how")}</a>
        </nav>
        <div className="actions">
          <Language lang={l} />
          <a href="/auth/login">{t(l, "login")}</a>
          <a className="btn ink" href="/auth/register">
            {t(l, "register")} ↗
          </a>
        </div>
      </header>
      <main>
        <section className="landing">
          <div className="hero-wrap">
            <div>
              <span className="eyebrow">
                <Sparkles size={13} />
                {t(l, "intro")}
              </span>
              <h1>
                {t(l, "hero")}
                <br />
                {t(l, "hero2")} <em>{t(l, "universe")}</em>
                <b>.</b>
              </h1>
              <p>{t(l, "pitch")}</p>
              <div className="actions">
                <a className="btn coral" href="/auth/register">
                  {t(l, "register")} <ArrowRight size={17} />
                </a>
                <a className="btn ghost" href="#templates">
                  {t(l, "explore")}
                </a>
              </div>
              <small>
                {["free", "nocode", "brazil"]
                  .map((k) => t(l, k as "free"))
                  .join("　·　")}
              </small>
            </div>
            <div className="collage">
              <span className="orbit" />
              <Mini type="creative" name="Luna Mori" />
              <Mini type="showcase" name="Theo Vale" />
              <Mini type="story" name="Mika Sora" />
              <span className="tape">Luna Mori ✧</span>
            </div>
          </div>
        </section>
        <div className="disciplines">
          ✦　
          {l === "en"
            ? "Illustration　 ·　 Photography　 ·　 Concept art　 ·　 Comics　 ·　 Character design"
            : "Ilustração　 ·　 Fotografia　 ·　 Arte conceitual　 ·　 Quadrinhos　 ·　 Design de personagens"}
          　✦
        </div>
        <section id="templates" className="section">
          <h2>{t(l, "choose")}</h2>
          <div className="templates">
            {templateNames.map((v) => (
              <a className={"template-card " + v} key={v} href={"/demo/" + v}>
                <img alt="" src={print(v)} />
                <div>
                  <h3>{v} ↗</h3>
                  <p>{t(l, v)}</p>
                </div>
              </a>
            ))}
          </div>
        </section>
        <section className="section process" id="process">
          <h2>{t(l, "how")}</h2>
          <p>{t(l, "start")}</p>
          <a className="btn ink" href="/auth/register">
            {t(l, "register")} →
          </a>
        </section>
      </main>
    </>
  );
}
