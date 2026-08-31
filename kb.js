/**
 * Feste Knowledge Base – der Assistent darf nur daraus antworten.
 * Später: OpenAI routet nur auf diese IDs, erfindet keine Schritte.
 */
window.TIVIM_KB = [
  {
    id: "install-tv",
    title: "Tivim auf dem TV einrichten",
    summary: "Fire TV oder Google TV – Tivim XC und Tivim Pro.",
    keywords: [
      "installieren", "einrichten", "neu", "tv", "fire", "firetv", "amazon",
      "google", "chromecast", "stick", "fernseher", "setup", "tivim pro tv",
      "tivim xc tv", "anleitung tv"
    ],
    type: "link",
    href: "tivim.html",
    cta: "TV-Anleitung starten"
  },
  {
    id: "install-mobile",
    title: "Tivim auf Handy oder Tablet",
    summary: "Android: Tivim XC und Tivim Pro. iPhone: Purple Player.",
    keywords: [
      "handy", "tablet", "android", "iphone", "ipad", "ios", "purple",
      "mobile", "apk", "samsung", "xiaomi"
    ],
    type: "link",
    href: "mobile-install.html",
    cta: "Handy-Anleitung starten"
  },
  {
    id: "install-pc",
    title: "Tivim auf PC oder Laptop",
    summary: "Windows oder Mac.",
    keywords: ["pc", "laptop", "windows", "mac", "macbook", "computer", "desktop"],
    type: "link",
    href: "pc.html",
    cta: "PC-Anleitung starten"
  },
  {
    id: "pro-401",
    title: "Fehlercode 401",
    summary: "In Tivim Pro fehlt der User-Agent.",
    keywords: [
      "401", "fehlercode 401", "fehler 401", "useragent", "user-agent",
      "user agent", "tivimplayer", "pro 401"
    ],
    type: "steps",
    steps: [
      {
        lead: "In Tivim Pro:",
        taps: ["Einstellungen", "Allgemein (General)", "User-Agent", "TivimPlayer eintragen", "Speichern"]
      },
      "App wirklich zu, wieder öffnen."
    ]
  },
  {
    id: "pro-403",
    title: "Fehlercode 403",
    summary: "Kommt der Fehler immer – oder nur bei manchen Inhalten?",
    keywords: [
      "403", "fehlercode 403", "fehler 403", "abo", "abgelaufen",
      "parallel", "gesperrt", "sperrung", "zwei geräte", "pro 403",
      "ablaufdatum", "restlaufzeit", "xtream", "double connect", "offline inhalt"
    ],
    type: "choose",
    options: [
      {
        title: "Immer 403",
        summary: "Egal welchen Sender oder Film ich anwähle",
        intent: "pro-403-always"
      },
      {
        title: "Nur bei manchen",
        summary: "Andere Inhalte laufen normal",
        intent: "pro-403-some"
      }
    ]
  },
  {
    id: "pro-403-always",
    title: "403 kommt immer",
    summary: "Dann: Double-Connect (parallel) oder Abo abgelaufen.",
    keywords: [],
    type: "steps",
    steps: [
      "Beende Tivim überall sonst: Handy, zweiter Stick, die andere App.",
      "Tivim Pro und Tivim XC nicht gleichzeitig offen lassen.",
      "Eine Minute warten – dann nur auf diesem Gerät wieder öffnen.",
      {
        lead: "Ablaufdatum in Tivim Pro:",
        taps: ["Einstellungen", "Wiedergabelisten", "Tivim", "Xtream-Parameter"]
      },
      "Restlaufzeit / Ablaufdatum prüfen. Datum vorbei = Abo durch, deshalb 403.",
      "Abo durch? App nicht zurücksetzen. Schreib der Person mit den Zugangsdaten und schick ein Foto vom Fehlercode 403 und vom Ablaufdatum."
    ]
  },
  {
    id: "pro-403-some",
    title: "403 nur bei manchen Inhalten",
    summary: "Dann sind oft einzelne Inhalte offline – kein Abo-Problem.",
    keywords: [],
    type: "steps",
    steps: [
      "Wenn andere Sender und Filme normal laufen, ist dein Abo in der Regel okay.",
      "Manche Inhalte sind zeitweise offline. Das können wir nicht in der App „reparieren“.",
      "Schreib dem Support / der Person mit den Zugangsdaten: welcher Sender oder Film, und ein Foto vom 403."
    ]
  },
  {
    id: "pro-codec",
    title: "CodecException",
    summary: "Ein Fehler ist aufgetreten: CodecException – kommt vom Player in Tivim Pro.",
    keywords: [
      "codec", "codecexception", "codec exception", "codec fehler",
      "ein fehler ist aufgetreten", "erneut versuchen", "player fehler", "pro codec",
      "vlc", "extern öffnen"
    ],
    type: "steps",
    steps: [
      "Player-Fehler in Tivim Pro – nicht das Abo.",
      "Denselben Sender oder Film in Tivim XC öffnen. Geht XC auch nicht → Support mit Foto.",
      {
        lead: "VLC installieren:",
        taps: ["Suche öffnen", "VLC Player suchen", "VLC for Fire installieren"]
      },
      "VLC einmal öffnen und Zugriff auf alle Dateien erlauben.",
      {
        lead: "In VLC:",
        taps: [
          "Links: Andere",
          "Einstellungen",
          "Ganz unten: Erweitert",
          "HTTP User-Agent",
          "TivimPlayer eintragen & speichern"
        ]
      },
      {
        lead: "In Tivim Pro:",
        taps: [
          "VLC beenden",
          "Tivim Pro öffnen",
          "Inhalt auswählen",
          "Extern öffnen (nicht Abspielen)"
        ]
      },
      {
        taps: ["VLC wählen", "Immer auswählen"]
      },
      "Fertig: zwei Player. Solange der Inhalt online ist, sollte einer gehen."
    ]
  },
  {
    id: "xc-empty",
    title: "Tivim XC – Listen leer",
    summary: "Keine Sender, keine Filme – die App zeigt nichts.",
    keywords: [
      "listen leer", "liste leer", "leer", "keine sender", "keine filme",
      "inhalt", "lädt nicht", "xc leer", "nichts angezeigt", "update xc",
      "ablehnen", "erlauben"
    ],
    type: "steps",
    steps: [
      "Tivim XC beenden (Zurück zweimal, wirklich zu).",
      "Router vom Strom ziehen.",
      "Gerät (Stick / Fernseher) vom Strom ziehen.",
      "5 Minuten warten.",
      "Alles wieder an, Tivim XC öffnen.",
      {
        lead: "Immer noch leer?",
        taps: ["App zu, wieder auf", "Hauptmenü rechts oben: Update (runde Pfeile)"]
      },
      {
        lead: "Immer noch leer?",
        taps: [
          "Gerät-Einstellungen → Apps → Tivim XC",
          "Berechtigungen → Speicher / Dateien / Medien → Erlauben",
          "Nochmal Update"
        ]
      }
    ]
  },
  {
    id: "vpn",
    title: "VPN – wenn’s abends ruckelt",
    summary: "Meist die Strecke zu dir, kein Tivim-Ausfall.",
    keywords: [
      "vpn", "ruckelt", "ruckeln", "abends", "hakelt", "lag", "stau",
      "telekom", "privado", "proton", "langsam", "hängt"
    ],
    type: "link",
    href: "vpn.html",
    cta: "VPN wählen"
  },
  {
    id: "status",
    title: "Läuft Tivim gerade?",
    summary: "Live-Check – ob bei uns was down ist.",
    keywords: [
      "ist tivim down", "tivim down", "geht tivim", "läuft tivim", "ist tivim online",
      "server down", "server online", "server offline", "ausfall", "störung server",
      "wartung", "down", "online status", "läuft der server", "ist was los bei tivim",
      "habt ihr ausfall", "seid ihr down", "tivim kaputt server"
    ],
    type: "status"
  },
  {
    id: "probleme",
    title: "Probleme – wobei?",
    summary: "Ohne Details können wir nicht helfen. Was trifft zu?",
    keywords: [
      "habt ihr probleme", "habt ihr ein problem", "habt ihr störungen",
      "probleme", "problem", "geht nicht", "funktioniert nicht", "geht bei mir nicht",
      "bei mir geht", "kaputt", "tot", "geht gar nichts", "ist was los",
      "was ist los", "hilfe es geht nicht"
    ],
    type: "choose",
    options: [
      { title: "Läuft Tivim bei euch?", summary: "Server-Check live", intent: "status" },
      { title: "Bei mir geht was nicht", summary: "App hängt, schwarz, Login", intent: "probleme-app" },
      { title: "Fehlercode auf dem Bildschirm", summary: "401, 403, CodecException", intent: "probleme-code" },
      { title: "Ruckelt / hakt abends", summary: "Meist VPN, kein Ausfall", intent: "vpn" },
      { title: "Listen leer (XC)", summary: "Keine Sender, keine Filme", intent: "xc-empty" }
    ]
  },
  {
    id: "probleme-app",
    title: "Welche App?",
    summary: "Dann gehen wir Schritt für Schritt.",
    keywords: [],
    type: "choose",
    options: [
      { title: "Tivim Pro", summary: "Schwarz, Login, hängt", intent: "pro-dead" },
      { title: "Tivim XC", summary: "Login, schwarz, hängt", intent: "xc-dead" },
      { title: "Purple Player (iPhone)", summary: "iOS / iPad / Mac", intent: "purple-fix" }
    ]
  },
  {
    id: "probleme-code",
    title: "Welcher Fehlercode?",
    summary: "Steht auf dem Bildschirm – genau so wählen.",
    keywords: [],
    type: "choose",
    options: [
      { title: "Fehlercode 401", summary: "User-Agent fehlt", intent: "pro-401" },
      { title: "Fehlercode 403", summary: "Immer oder nur manche?", intent: "pro-403" },
      { title: "CodecException", summary: "Player-Fehler in Pro", intent: "pro-codec" }
    ]
  },
  {
    id: "purple-fix",
    title: "Purple Player – geht nicht",
    summary: "iPhone, iPad oder Mac.",
    keywords: [
      "purple", "purple player", "iphone geht nicht", "ipad", "ios kaputt"
    ],
    type: "steps",
    steps: [
      "Update im App Store prüfen.",
      "In Purple ausloggen, App komplett schließen (aus dem Hintergrund wischen).",
      "Neu öffnen: Playlist → mit Code anmelden.",
      "Code FA69EV, dann deine Tivim-Zugangsdaten.",
      "Immer noch tot? Schreib der Person mit den Zugangsdaten – mit Foto."
    ]
  },
  {
    id: "pro-dead",
    title: "Tivim Pro – geht gar nichts",
    summary: "Schwarz, kein Login, ohne Fehlercode.",
    keywords: [
      "pro geht nicht", "pro tot", "pro schwarz", "pro login",
      "tivim pro kaputt", "geht gar nichts pro"
    ],
    type: "steps",
    steps: [
      "Zurück-Taste zweimal – Tivim Pro wirklich beenden, dann wieder öffnen.",
      "Hilft das nicht: Einstellungen → Wiedergabelisten → Tivim → Löschen.",
      "App beenden, neu öffnen, wieder anmelden.",
      "Immer noch tot? Support mit Foto vom Bildschirm."
    ]
  },
  {
    id: "xc-dead",
    title: "Tivim XC – geht gar nichts",
    summary: "Login, schwarz, ohne leere Listen.",
    keywords: [
      "xc geht nicht", "xc tot", "xc schwarz", "xc login",
      "tivim xc kaputt", "sign out"
    ],
    type: "steps",
    steps: [
      "Zurück-Taste zweimal – Tivim XC wirklich beenden, dann wieder öffnen.",
      "Hilft das nicht: Settings → Sign out.",
      "App beenden, dann Sign in – Daten sind meist noch da.",
      "Immer noch tot? Support mit Foto."
    ]
  },
  {
    id: "support",
    title: "Support kontaktieren",
    summary: "Erst kurz checken, dann schreiben.",
    keywords: [
      "support", "hilfe", "kontakt", "whatsapp", "anschreiben", "schreiben"
    ],
    type: "link",
    href: "kontakt.html",
    cta: "Zur Checkliste"
  },
  {
    id: "tip-pro-filme",
    title: "Neue Filme oben – Tivim Pro",
    summary: "Sortierung in der Film-Liste.",
    keywords: ["filme", "neue filme", "blockbuster", "sortieren", "datum", "filmliste", "tipps"],
    type: "steps",
    steps: [
      {
        lead: "In Tivim Pro:",
        taps: ["Filme", "Alle Filme", "Oben rechts: Sortierung", "Nach Datum (zuletzt hinzugefügt)"]
      }
    ]
  },
  {
    id: "tip-pro-serien",
    title: "Neue Serien-Folgen finden – Tivim Pro",
    summary: "Serien mit frischen Episoden nach oben.",
    keywords: ["serien", "episoden", "folgen", "sortieren", "letzte änderung", "tipps"],
    type: "steps",
    steps: [
      {
        lead: "In Tivim Pro:",
        taps: ["Serien", "Alle Serien", "Sortierung", "Nach letzter Änderung"]
      }
    ]
  },
  {
    id: "tip-pro-update",
    title: "Wiedergabeliste aktualisieren – Tivim Pro",
    summary: "Programm, Filme und Serien manuell neu laden.",
    keywords: ["aktualisieren", "update", "wiedergabeliste", "playlist", "neu laden", "tipps"],
    type: "steps",
    steps: [
      {
        lead: "In Tivim Pro:",
        taps: ["Einstellungen", "Wiedergabelisten", "Tivim", "Aktualisieren"]
      }
    ]
  },
  {
    id: "tip-pro-favoriten",
    title: "Favoriten anlegen – Tivim Pro",
    summary: "Sender schnell merken.",
    keywords: ["favoriten", "sender speichern", "ok taste", "live tv", "tipps"],
    type: "steps",
    steps: [
      "Im Live-TV auf dem Sender sein.",
      "OK-Taste auf der Fernbedienung gedrückt halten.",
      "Im Menü rechts: zu Favoriten hinzufügen."
    ]
  },
  {
    id: "tip-pro-ablauf",
    title: "Restlaufzeit anzeigen – Tivim Pro",
    summary: "Ablaufdatum und Zugangsdaten einsehen.",
    keywords: ["restlaufzeit", "ablauf", "ablaufdatum", "xtream", "zugangsdaten", "tipps"],
    type: "steps",
    steps: [
      {
        lead: "In Tivim Pro:",
        taps: ["Einstellungen", "Wiedergabelisten", "Tivim", "Xtream-Parameter"]
      },
      "Dort: Restlaufzeit / Ablaufdatum und Zugangsdaten."
    ]
  },
  {
    id: "tip-xc-update",
    title: "Inhalte aktualisieren – Tivim XC",
    summary: "Live-TV, Filme und Serien neu laden.",
    keywords: ["xc update", "aktualisieren", "pfeile", "inhalt aktualisieren", "tipps", "xc"],
    type: "steps",
    steps: [
      "Auf der Startseite von Tivim XC.",
      "Rechts oben auf Update tippen (runde Pfeile).",
      "Neueste Daten für Live-TV, Filme und Serien werden geladen."
    ]
  },
  {
    id: "tipps",
    title: "Tipps & Tricks",
    summary: "Sortierung, Update, Favoriten und mehr.",
    keywords: [
      "tipps", "tricks", "tipps und tricks", "kniff", "kniffe", "smarte",
      "tipp", "hilfe app", "sortierung filme"
    ],
    type: "choose",
    options: [
      { title: "Neue Filme oben", summary: "Tivim Pro", intent: "tip-pro-filme" },
      { title: "Neue Serien-Folgen", summary: "Tivim Pro", intent: "tip-pro-serien" },
      { title: "Wiedergabeliste aktualisieren", summary: "Tivim Pro", intent: "tip-pro-update" },
      { title: "Favoriten anlegen", summary: "Tivim Pro", intent: "tip-pro-favoriten" },
      { title: "Restlaufzeit anzeigen", summary: "Tivim Pro", intent: "tip-pro-ablauf" },
      { title: "Inhalte aktualisieren", summary: "Tivim XC", intent: "tip-xc-update" }
    ]
  },
  {
    id: "filme",
    title: "Neue Filme & Serien",
    summary: "Was neu ist.",
    keywords: ["filme", "serien", "neuigkeiten", "neu", "blockbuster"],
    type: "link",
    href: "neuigkeiten.html",
    cta: "Neuigkeiten öffnen"
  }
];
