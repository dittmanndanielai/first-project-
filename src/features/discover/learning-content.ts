// Alle Karten der Learning-Bibliothek. Neue Karte = JSON-Datei in content/learning plus eine Zeile hier.
// Validierung beim Laden (parseLearning): ein ungültiger Eintrag bricht `next build` und die Unit-Tests ab.
import { interleave, learningToCard, parseLearning } from "./learning";

import batna from "../../../content/learning/batna.json";
import siegenOhneKampf from "../../../content/learning/siegen-ohne-kampf.json";
import reziprozitaet from "../../../content/learning/reziprozitaet.json";
import meisterNichtUeberstrahlen from "../../../content/learning/meister-nicht-ueberstrahlen.json";
import baseRates from "../../../content/learning/base-rates.json";
import wysiati from "../../../content/learning/wysiati.json";
import planungsfehlschluss from "../../../content/learning/planungsfehlschluss.json";
import verlustaversion from "../../../content/learning/verlustaversion.json";
import monopolStattWettbewerb from "../../../content/learning/monopol-statt-wettbewerb.json";
import geheimnisse from "../../../content/learning/geheimnisse.json";
import spezifischesWissenHebel from "../../../content/learning/spezifisches-wissen-hebel.json";
import tailEvents from "../../../content/learning/tail-events.json";
import ruinVermeiden from "../../../content/learning/ruin-vermeiden.json";
import erwartungswert from "../../../content/learning/erwartungswert.json";
import zinseszins from "../../../content/learning/zinseszins.json";
import kreisDerKompetenz from "../../../content/learning/kreis-der-kompetenz.json";
import inversion from "../../../content/learning/inversion.json";
import anreize from "../../../content/learning/anreize.json";
import denkenZweiterOrdnung from "../../../content/learning/denken-zweiter-ordnung.json";
import opportunitaetskosten from "../../../content/learning/opportunitaetskosten.json";
import dichotomieDerKontrolle from "../../../content/learning/dichotomie-der-kontrolle.json";
import premeditatioMalorum from "../../../content/learning/premeditatio-malorum.json";
import systemeStattZiele from "../../../content/learning/systeme-statt-ziele.json";
import hindernisAlsWeg from "../../../content/learning/hindernis-als-weg.json";

/** Referenz-Karten: setzen den Qualitätsmaßstab und stehen im Feed zuerst (eine pro Kategorie). */
export const REFERENCE_SLUGS = ["batna", "base-rates", "monopol-statt-wettbewerb", "ruin-vermeiden", "inversion", "dichotomie-der-kontrolle"] as const;

export const LEARNING_ENTRIES = parseLearning([
  { file: "batna.json", data: batna },
  { file: "siegen-ohne-kampf.json", data: siegenOhneKampf },
  { file: "reziprozitaet.json", data: reziprozitaet },
  { file: "meister-nicht-ueberstrahlen.json", data: meisterNichtUeberstrahlen },
  { file: "base-rates.json", data: baseRates },
  { file: "wysiati.json", data: wysiati },
  { file: "planungsfehlschluss.json", data: planungsfehlschluss },
  { file: "verlustaversion.json", data: verlustaversion },
  { file: "monopol-statt-wettbewerb.json", data: monopolStattWettbewerb },
  { file: "geheimnisse.json", data: geheimnisse },
  { file: "spezifisches-wissen-hebel.json", data: spezifischesWissenHebel },
  { file: "tail-events.json", data: tailEvents },
  { file: "ruin-vermeiden.json", data: ruinVermeiden },
  { file: "erwartungswert.json", data: erwartungswert },
  { file: "zinseszins.json", data: zinseszins },
  { file: "kreis-der-kompetenz.json", data: kreisDerKompetenz },
  { file: "inversion.json", data: inversion },
  { file: "anreize.json", data: anreize },
  { file: "denken-zweiter-ordnung.json", data: denkenZweiterOrdnung },
  { file: "opportunitaetskosten.json", data: opportunitaetskosten },
  { file: "dichotomie-der-kontrolle.json", data: dichotomieDerKontrolle },
  { file: "premeditatio-malorum.json", data: premeditatioMalorum },
  { file: "systeme-statt-ziele.json", data: systemeStattZiele },
  { file: "hindernis-als-weg.json", data: hindernisAlsWeg },
]);

/** Feed-Reihenfolge: Kategorien abwechselnd, Referenz-Karten zuerst. */
export const LEARNING_CARDS = interleave(LEARNING_ENTRIES, REFERENCE_SLUGS).map(learningToCard);
