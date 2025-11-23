# Randomized Avatar

Ziel: Beim Anlegen eines Kinderprofils wird automatisch ein zufälliger Emoji‑Avatar aus dem bereitgestellten Pool vergeben – ohne Dopplungen zu bestehenden Profilen. Ein großer, klarer „Neu würfeln“‑Button (Refresh‑Icon als SVG) bietet schnell neue Vorschläge und passt sich visuell an die UI an. Im Elternbereich sind sowohl Direkteingabe (beliebige Emojis) als auch Randomize möglich.

## Vereinbarter Scope
- **Global eindeutig:** Random‑Zuweisungen vermeiden Emojis, die bereits irgendeinem Profil (Classic + Island) zugewiesen sind. Manual Override im Elternbereich darf trotzdem doppelt vergeben.
- **Reroll‑Regeln:** „Neu würfeln“ schlägt ein neues Emoji vor, das nicht
  1) bereits vergeben ist **und**
  2) nicht in der aktuellen Sitzung schon angezeigt wurde.
  Wenn der Pool erschöpft ist, darf erneut vergeben werden; direkt vorheriges Emoji wird trotzdem übersprungen.
- **Fallback bei vollem Pool:** Sobald alle Emojis belegt oder bereits gezeigt wurden, wird neu aus dem Gesamtpool gewählt (inkl. bereits benutzter Emojis).
- **Editing:** Bestehende Emojis bleiben erhalten. Bei Randomize im Edit-Flow gilt dieselbe Logik wie oben, manuelle Eingabe ist frei (auch Duplikate).
- **UI-Hinweise:** Avatar direkt bei der Profilerstellung anzeigen („Zufällig gewählt – Neu würfeln für neues“), im Eltern-Hub Badge „neu/zufällig“ okay. Wenn nur noch wenige freie Emojis (<5) übrig sind, dezenter Hinweis „Nur noch X Emojis frei“. Reroll-Button soll ausreichend große Hit-Area (≈48px Höhe) und fokussierbare SVG-Glyph bekommen, Farbton passend zu Brand.

## Emoji-Pool (normalisiert)
- Basis: bereitgestellte Liste, Variation Selectors entfernt, Duplikate bereinigt → **141 einzigartige Emojis**.
- Normalisierung: `emoji.replace(\uFE0F, '')` und Trimmen auf das erste Zeichen/Cluster pro Eingabe.

Aktueller Pool (Reihenfolge wie Ursprungsliste, bereinigt):

```
😀, 😃, 😄, 😁, 😆, 😅, 😂, 🤣, ☺, 😊, 😇, 🙂, 🙃, 😉, 😌, 😍, 😘, 😗, 😙, 😚, 😋, 😜, 😝, 😛, 🤑, 🤗, 🤓, 😎, 🤡, 🤠, 😏, 🤩, 🤫, 🤪, 🤭, 🥳, 💩, 👻, 🤖, 🎃,
😺, 😸, 😹, 😻, 😼, 😽, 🐶, 🐱, 🐭, 🐹, 🐰, 🦊, 🙉, 🙊, 🐒, 🐥, 🦆, 🦢, 🦅, 🦚, 🦉, 🦇, 🐺, 🐗, 🐴, 🦄, 🐝, 🐛, 🦋, 🐌, 🐚, 🐞, 🐢, 🐍, 🪱, 🦎, 🦂, 🦀, 🦑, 🐙, 🦐, 🦞, 🐠, 🐟, 🐡,
🐬, 🦈, 🐳, 🐋, 🐊, 🐆, 🐅, 🦛, 🐃, 🐂, 🐄, 🦌, 🐪, 🐫, 🦘, 🐘, 🦏, 🦍, 🐎, 🦙, 🐖, 🐐, 🐏, 🐑, 🐕, 🐩, 🐈, 🐓, 🦃, 🕊, 🪶, 🐇, 🐁, 🐀, 🐿, 🐉, 🐲, 🦖, 🦕, 🦒, 🦔, 🦓, 🦗, 🦧, 🦮, 🦥, 🦦, 🦡, 🦨, 🦩, 🐔, 🦜, 🐧, 🐦, 🐤, 🐣
```

## Akzeptanzkriterien
- Neue Profile erhalten automatisch einen zufälligen, global freien Emoji aus dem Pool; Vorschlag wird sichtbar angezeigt.
- 🔄 liefert einen neuen, freien Vorschlag ohne Wiederholung der Session; nach Pool-Erschöpfung wird erneut aus dem Gesamtpool gezogen.
- Elternbereich: Eingabefeld akzeptiert beliebige Emojis; Randomize nutzt die oben definierten Regeln. Badge/Hint sichtbar, wenn Avatar zufällig vergeben wurde.
- Hinweis bei knappen freien Emojis angezeigt.
- Normalisierung (Strip VS-16) und Duplikatbereinigung greifen sowohl für Randomize als auch für manuelle Eingaben.
