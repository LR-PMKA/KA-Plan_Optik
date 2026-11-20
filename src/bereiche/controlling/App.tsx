/**
 * Rahmen des Controllings: Seitenleiste, Kopfzeile und Auswahl der Ansicht –
 * Projekte und Archiv auf dem Projektregister, dazu das Controlling der
 * Leistungsnachweise, das der Bereich selbst bereitstellt
 * (`LeistungsnachweiseControlling`, src/bereiche/leistungsnachweise/controlling.tsx) –
 * mit zwei Menüpunkten: „Leistungsnachweise“ (Projekte, Nachweise, Abrechnung)
 * und „Auswertung“.
 * Über jeder Ansicht steht – wie in den Bereichen – der `RegisterHinweis`,
 * solange sich das Projektregister nicht lesen oder nicht speichern lässt
 * (src/gemeinsam/RegisterHinweis.tsx). Farbmodus und Farbschema setzt die
 * Hülle (src/shell/Shell.tsx).
 */
import { motion } from 'framer-motion';
import { useRegister, useRegisterZustand } from '../../gemeinsam/register';
import { Einblenden, NavAktiv } from '../../shared/bewegung';
import { Icon, type IconName } from '../../shared/icons';
import { KaPlanLogo, MailaenderLogo } from '../../shared/logos';
import { Card, EmptyState } from '../../shared/ui';
import { useNachObenBeiSeitenwechsel } from '../../shared/scrollen';
import { useSeitenleiste } from '../../shared/seitenleiste';
import { BereichWechsel } from '../../shell/BereichWechsel';
import { AngemeldetAls } from '../../gemeinsam/AngemeldetAls';
import { RegisterHinweis } from '../../gemeinsam/RegisterHinweis';
import { LeistungsnachweiseControlling, leistungsnachweiseUntertitel } from '../leistungsnachweise/controlling';
import { useRoute, type Route } from './lib/router';
import { Projekte } from './pages/Projekte';

export function App({ onSperren }: { onSperren: () => void }) {
  const register = useRegister();
  const zustand = useRegisterZustand();
  const [route, navigate] = useRoute();
  // Ein neuer Menüpunkt beginnt oben (src/shared/scrollen.ts); die Leistungsnachweise
  // setzen innerhalb ihres Menüpunkts selbst zurück.
  const inhalt = useNachObenBeiSeitenwechsel<HTMLDivElement>(route.view);
  const leistungsnachweise = route.view === 'leistungsnachweise' || route.view === 'auswertung';
  const [menuOffen, setMenuOffen] = useSeitenleiste();

  const gehe = (r: Route) => {
    navigate(r);
    setMenuOffen(false);
  };

  const laufend = register.projekte.filter((p) => !p.archiviert).length;
  const archiviert = register.projekte.length - laufend;
  const kopf =
    route.view === 'archiv'
      ? { titel: 'Archiv', sub: 'Im Controlling archivierte Projekte – in allen Bereichen archiviert' }
      : route.view === 'leistungsnachweise'
        ? { titel: 'Leistungsnachweise', sub: leistungsnachweiseUntertitel(window.location.hash) }
        : route.view === 'auswertung'
          ? { titel: 'Auswertung', sub: leistungsnachweiseUntertitel(window.location.hash) }
        : { titel: 'Projekte', sub: 'Alle Projekte der Bereiche – anlegen, übernehmen, archivieren, löschen' };

  return (
    <div className="app">
      {/* layoutScroll: Die Fläche des aktiven Menüpunkts (NavAktiv) gleitet auch in der gescrollten Leiste an die richtige Stelle */}
      <motion.aside layoutScroll className={`sidebar ${menuOffen ? 'open' : ''}`}>
        <button type="button" className="sidebar-brand" onClick={() => gehe({ view: 'projekte' })} title="Zu den Projekten">
          <KaPlanLogo variante="Controlling" width="100%" />
        </button>

        <NavItem
          icon="projekt"
          label="Projekte"
          aktiv={route.view === 'projekte'}
          badge={laufend > 0 ? String(laufend) : undefined}
          onClick={() => gehe({ view: 'projekte' })}
        />
        <NavItem
          icon="archiv"
          label="Archiv"
          aktiv={route.view === 'archiv'}
          badge={archiviert > 0 ? String(archiviert) : undefined}
          onClick={() => gehe({ view: 'archiv' })}
        />

        <div className="nav-group-label">Bereiche</div>
        <NavItem
          icon="stunden"
          label="Leistungsnachweise"
          aktiv={route.view === 'leistungsnachweise'}
          onClick={() => gehe({ view: 'leistungsnachweise' })}
        />
        <NavItem icon="diagramm" label="Auswertung" aktiv={route.view === 'auswertung'} onClick={() => gehe({ view: 'auswertung' })} />

        <div className="sidebar-footer">
          <AngemeldetAls />
          <button type="button" className="btn btn-sm btn-outline ct-sperren" onClick={onSperren}>
            <Icon name="schloss" size={12} /> Sperren
          </button>
          Das Projektregister liegt lokal im Browser; die Bereiche übernehmen Änderungen beim nächsten Öffnen.
          <BereichWechsel />
        </div>
      </motion.aside>

      <main className="main">
        <header className="topbar">
          <button type="button" className="btn-icon menu-toggle" onClick={() => setMenuOffen((o) => !o)} aria-label="Menü">
            <Icon name="menu" size={18} />
          </button>
          <div className="topbar-title">
            <h1>{kopf.titel}</h1>
            <div className="sub">{kopf.sub}</div>
          </div>
          <div className="topbar-logo">
            <MailaenderLogo height={34} />
          </div>
        </header>

        <div className="content" ref={inhalt}>
          <div className="content-inner">
            <RegisterHinweis />
            <Einblenden schluessel={route.view}>
              {leistungsnachweise ? (
                <LeistungsnachweiseControlling />
              ) : zustand !== 'ok' ? (
                // Ohne lesbares Register gibt es nichts zu verwalten – der RegisterHinweis oben nennt den Grund
                <Card>
                  <EmptyState
                    icon="projekt"
                    titel="Projekte nicht verfügbar"
                    text="Solange sich das Projektregister nicht lesen lässt, zeigt das Controlling keine Projekte."
                  />
                </Card>
              ) : (
                <Projekte archiv={route.view === 'archiv'} />
              )}
            </Einblenden>
          </div>
        </div>
      </main>

      {menuOffen ? (
        <div className="overlay" style={{ background: 'rgba(0,0,0,0.18)', zIndex: 80 }} onClick={() => setMenuOffen(false)} />
      ) : null}
    </div>
  );
}

function NavItem({
  icon,
  label,
  aktiv,
  badge,
  onClick,
}: {
  icon: IconName;
  label: string;
  aktiv: boolean;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className={`nav-item ${aktiv ? 'active' : ''}`} onClick={onClick} title={label}>
      {aktiv ? <NavAktiv /> : null}
      <span className="nav-icon">
        <Icon name={icon} size={17} />
      </span>
      <span className="nav-label">{label}</span>
      {badge ? <span className="nav-badge">{badge}</span> : null}
    </button>
  );
}
