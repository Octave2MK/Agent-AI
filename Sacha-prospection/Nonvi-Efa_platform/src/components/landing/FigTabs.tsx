import { cn } from "@/lib/utils";

/**
 * Onglets d'une slide (Coulisses / Bases / Installer) : chaque onglet affiche
 * une animation ou une maquette différente.
 *
 * Implémentation 100 % CSS (radios + labels, aucun JS) pour que ça marche
 * AUSSI dans l'export HTML autonome (guide-installation.html), qui n'embarque
 * pas de bundle React. Chaque groupe a un `name` unique ; le label contient
 * son radio, la visibilité des panneaux est pilotée en CSS via `:has()` +
 * `nth-child` (voir globals.css : .lv-figtabs).
 */
let _figSeq = 0;

export function FigTabs({
  tabs,
}: {
  tabs: { id: string; label: string; node: React.ReactNode }[];
}) {
  const name = `figtabs-${_figSeq++}`;
  return (
    <div className="lv-figtabs">
      <div className="lv-tabs">
        {tabs.map((t, i) => (
          <label key={t.id} className={cn("lv-tab")}>
            <input type="radio" name={name} defaultChecked={i === 0} />
            {t.label}
          </label>
        ))}
      </div>
      <div className="lv-figwrap">
        {tabs.map((t) => (
          <div className="lv-fig" key={t.id}>
            {t.node}
          </div>
        ))}
      </div>
    </div>
  );
}
