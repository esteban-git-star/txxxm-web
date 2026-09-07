/**
 * Feste Knowledge Base – der Assistent darf nur daraus antworten.
 * Später: OpenAI routet nur auf diese IDs, erfindet keine Schritte.
 */
window.TIVIM_KB = [
  {
    id: "install-tv",
    title: "Tivim auf dem TV",
    summary: "Fire TV oder Google TV – XC und Pro drauf.",
    keywords: [
      "installieren", "einrichten", "neu", "tv", "fire", "firetv", "amazon",
      "google", "chromecast", "stick", "fernseher", "setup", "tivim pro tv",
      "tivim xc tv", "anleitung tv"
    ],
    type: "link",
    href: "tivim.html",
    cta: "TV-Anleitung"
  },
  {
    id: "install-mobile",
    title: "Tivim auf Handy & Tablet",
    summary: "Android: XC & Pro. iPhone: Purple Player.",
    keywords: [
      "handy", "tablet", "android", "iphone", "ipad", "ios", "purple",
      "mobile", "apk", "samsung", "xiaomi"
    ],
    type: "link",
    href: "mobile-install.html",
    cta: "Handy-Anleitung"
  },
  {
    id: "install-pc",
    title: "Tivim am PC",
    summary: "Windows oder Mac – kurz erklärt.",
    keywords: ["pc", "laptop", "windows", "mac", "macbook", "computer", "desktop"],
    type: "link",
    href: "pc.html",
    cta: "PC-Anleitung"
  },
  {
    id: "pro-401",
    title: "Fehlercode 401",
    summary: "User-Agent fehlt – in 2 Schritten fix.",
    keywords: [
      "401", "fehlercode 401", "fehler 401", "useragent", "user-agent",
      "user agent", "tivimplayer", "pro 401"
    ],
    type: "steps",
    steps: [
      {
        goal: "Als User-Agent TivimPlayer eintragen und speichern.",
        taps: ["Einstellungen", "Allgemein", "User-Agent", "TivimPlayer", "Speichern"]
      },
      {
        goal: "Tivim Pro komplett schließen und neu öffnen.",
        text: "App wirklich zu (nicht nur minimieren), dann wieder starten."
      }
    ]
  },
  {
    id: "pro-403",
    title: "Fehlercode 403",
    summary: "Immer – oder nur bei manchen Filmen?",
    keywords: [
      "403", "fehlercode 403", "fehler 403", "abo", "abgelaufen",
      "parallel", "gesperrt", "sperrung", "zwei geräte", "pro 403",
      "ablaufdatum", "restlaufzeit", "xtream", "double connect", "offline inhalt"
    ],
    type: "choose",
    options: [
      { title: "Immer 403", intent: "pro-403-always" },
      { title: "Nur bei manchen", intent: "pro-403-some" }
    ]
  },
  {
    id: "pro-403-always",
    title: "403 kommt immer",
    summary: "Parallel-Login oder Abo abgelaufen.",
    keywords: [],
    type: "steps",
    steps: [
      {
        goal: "Tivim überall sonst beenden.",
        text: "Handy, zweiter Stick, die andere App – alles zu. Pro und XC nicht gleichzeitig offen."
      },
      {
        goal: "Eine Minute warten, dann nur auf einem Gerät öffnen."
      },
      {
        goal: "Ablaufdatum in den Xtream-Parametern prüfen.",
        taps: ["Einstellungen", "Wiedergabelisten", "Tivim", "Xtream-Parameter"]
      },
      {
        goal: "Datum vorbei? Dann Abo durch – App nicht zurücksetzen.",
        text: "Schreib der Person mit den Zugangsdaten. Foto vom 403 und vom Ablaufdatum mitschicken."
      }
    ]
  },
  {
    id: "pro-403-some",
    title: "403 nur bei manchen Inhalten",
    summary: "Oft einzelne Inhalte offline – kein Abo-Problem.",
    keywords: [],
    type: "steps",
    steps: [
      {
        goal: "Andere Sender und Filme testen.",
        text: "Laufen die normal, ist dein Abo in der Regel okay."
      },
      {
        goal: "Einzelne Inhalte sind oft zeitweise offline.",
        text: "Das lässt sich in der App nicht „reparieren“."
      },
      {
        goal: "Support mit Foto schreiben.",
        text: "Welcher Sender oder Film? Plus Foto vom 403."
      }
    ]
  },
  {
    id: "pro-codec",
    title: "CodecException",
    summary: "Player-Fehler in Pro – meist kein Abo-Problem.",
    keywords: [
      "codec", "codecexception", "codec exception", "codec fehler",
      "ein fehler ist aufgetreten", "erneut versuchen", "player fehler", "pro codec",
      "vlc", "extern öffnen"
    ],
    type: "steps",
    steps: [
      {
        goal: "Denselben Inhalt in Tivim XC testen.",
        text: "Geht XC auch nicht → Support mit Foto."
      },
      {
        goal: "VLC for Fire installieren.",
        taps: ["Suche öffnen", "VLC Player suchen", "VLC for Fire installieren"]
      },
      {
        goal: "In VLC Zugriff auf alle Dateien erlauben.",
        text: "VLC einmal öffnen und die Berechtigung bestätigen."
      },
      {
        goal: "In VLC den User-Agent setzen.",
        taps: [
          "Links: Andere",
          "Einstellungen",
          "Ganz unten: Erweitert",
          "HTTP User-Agent",
          "TivimPlayer"
        ]
      },
      {
        goal: "In Tivim Pro den Inhalt extern öffnen.",
        taps: [
          "VLC beenden",
          "Tivim Pro öffnen",
          "Inhalt auswählen",
          "Extern öffnen (nicht Abspielen)"
        ]
      },
      {
        goal: "VLC wählen und „Immer“ bestätigen.",
        taps: ["VLC wählen", "Immer auswählen"]
      }
    ]
  },
  {
    id: "xc-empty",
    title: "Tivim XC – Listen leer",
    summary: "Keine Sender, keine Filme.",
    keywords: [
      "listen leer", "liste leer", "leer", "keine sender", "keine filme",
      "inhalt", "lädt nicht", "xc leer", "nichts angezeigt", "update xc",
      "ablehnen", "erlauben"
    ],
    type: "steps",
    steps: [
      {
        goal: "Router und Gerät 5 Minuten vom Strom.",
        text: "Beides wirklich aus der Steckdose. Danach wieder an, kurz warten, XC öffnen."
      },
      {
        goal: "Immer noch leer? Tivim XC wirklich beenden und neu öffnen.",
        text: "Zurück zweimal – App zu, nicht nur minimieren."
      },
      {
        goal: "Update in XC tippen.",
        taps: ["Hauptmenü rechts oben: Update (runde Pfeile)"]
      },
      {
        goal: "Speicher-Berechtigung prüfen und Update wiederholen.",
        taps: [
          "Gerät-Einstellungen → Apps → Tivim XC",
          "Berechtigungen → Speicher / Dateien / Medien → Erlauben",
          "Nochmal Update"
        ]
      }
    ]
  },
  {
    id: "epg",
    title: "EPG lädt nicht",
    summary: "Programmguide fehlt oder bleibt leer – welche App?",
    keywords: [
      "epg", "epg lädt nicht", "epg leer", "programmguide", "tv guide",
      "programmheft", "sendeplan", "kein epg", "epg update", "epg aktualisieren",
      "guide lädt nicht", "elektronischer programmführer"
    ],
    type: "choose",
    options: [
      { title: "Tivim Pro", intent: "epg-pro" },
      { title: "Tivim XC", intent: "epg-xc" }
    ]
  },
  {
    id: "epg-pro",
    title: "EPG lädt nicht – Tivim Pro",
    summary: "In den Einstellungen neu laden.",
    keywords: ["epg pro", "pro epg"],
    type: "steps",
    steps: [
      {
        goal: "EPG in Tivim Pro aktualisieren.",
        taps: ["Einstellungen", "EPG", "Aktualisieren"]
      },
      {
        goal: "Kurz warten, dann zurück zum Live-TV prüfen.",
        text: "Lädt es immer noch nicht → Support mit Foto schreiben."
      }
    ]
  },
  {
    id: "epg-xc",
    title: "EPG lädt nicht – Tivim XC",
    summary: "Wie bei leeren Listen: Update tippen.",
    keywords: ["epg xc", "xc epg"],
    type: "steps",
    steps: [
      {
        goal: "Im Hauptmenü Update tippen.",
        taps: ["Hauptmenü rechts oben: Update (runde Pfeile)"],
        text: "Gleicher Knopf wie bei leeren Listen – lädt Inhalte und EPG neu."
      },
      {
        goal: "Immer noch leer? App zu und Update wiederholen.",
        text: "Zurück zweimal (App wirklich zu), neu öffnen, nochmal Update."
      }
    ]
  },
  {
    id: "vpn",
    title: "VPN – wenn’s abends ruckelt",
    summary: "Meist deine Leitung – nicht der Server.",
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
    summary: "Grün = bei uns ok.",
    keywords: [
      "ist tivim down", "tivim down", "geht tivim", "läuft tivim", "ist tivim online",
      "server down", "server online", "server offline", "ausfall", "störung server",
      "wartung", "down", "online status", "läuft der server", "ist was los bei tivim",
      "habt ihr ausfall", "seid ihr down", "tivim kaputt server", "server status"
    ],
    type: "link",
    href: "news.html",
    cta: "Status prüfen"
  },
  {
    id: "probleme",
    title: "Was hakt bei dir?",
    summary: "Was trifft zu?",
    keywords: [
      "habt ihr probleme", "habt ihr ein problem", "habt ihr störungen",
      "probleme", "problem", "geht nicht", "funktioniert nicht", "geht bei mir nicht",
      "bei mir geht", "kaputt", "tot", "geht gar nichts", "ist was los",
      "was ist los", "hilfe es geht nicht"
    ],
    type: "choose",
    options: [
      { title: "Läuft Tivim bei euch?", intent: "status" },
      { title: "App geht nicht", intent: "probleme-app" },
      { title: "Fehlercode auf dem Screen", intent: "probleme-code" },
      { title: "Listen leer (XC)", intent: "xc-empty" },
      { title: "EPG lädt nicht", intent: "epg" },
      { title: "Purple Player", intent: "purple" }
    ]
  },
  {
    id: "probleme-app",
    title: "Welche App?",
    summary: "Dann Schritt für Schritt.",
    keywords: [],
    type: "choose",
    options: [
      { title: "Tivim Pro", intent: "pro-dead" },
      { title: "Tivim XC", intent: "xc-dead" },
      { title: "Purple Player (iPhone)", intent: "purple" }
    ]
  },
  {
    id: "probleme-code",
    title: "Welcher Fehlercode?",
    summary: "Steht genau so auf dem Bildschirm.",
    keywords: [],
    type: "choose",
    options: [
      { title: "Fehlercode 401", intent: "pro-401" },
      { title: "Fehlercode 403", intent: "pro-403" },
      { title: "CodecException", intent: "pro-codec" }
    ]
  },
  {
    id: "purple",
    title: "Purple Player – was ist los?",
    summary: "iPhone, iPad oder Mac.",
    keywords: [
      "purple", "purple player", "iphone geht nicht", "ipad", "ios kaputt",
      "purple hängt", "purple lädt"
    ],
    type: "choose",
    options: [
      { title: "Download hängt nach Live-TV", intent: "purple-hang" },
      { title: "Geht sonst nicht", intent: "purple-fix" }
    ]
  },
  {
    id: "purple-hang",
    title: "Purple – Download hängt",
    summary: "Nach der ersten Anmeldung, nach Live-TV.",
    keywords: [
      "download hängt", "hängt nach live", "live tv hängt", "purple download",
      "daten aktualisieren", "alle erfrischen", "erster login purple",
      "lädt ewig purple", "purple bleibt stehen"
    ],
    type: "steps",
    steps: [
      {
        goal: "Purple Player komplett beenden und neu starten.",
        text: "Aus dem Hintergrund wischen, dann die App wieder öffnen."
      },
      {
        goal: "Daten aktualisieren – alle erfrischen.",
        taps: ["Einstellungen", "Daten aktualisieren", "Alle erfrischen"]
      }
    ]
  },
  {
    id: "purple-fix",
    title: "Purple Player – geht nicht",
    summary: "iPhone, iPad oder Mac.",
    keywords: [],
    type: "steps",
    steps: [
      {
        goal: "Router und Gerät 5 Minuten vom Strom.",
        text: "Router aus der Steckdose. iPhone/iPad aus und 5 Minuten warten, dann wieder an."
      },
      { goal: "Update im App Store prüfen." },
      {
        goal: "App komplett schließen und neu öffnen.",
        text: "Aus dem Hintergrund wischen, dann neu starten."
      },
      {
        goal: "Immer noch tot? Ausloggen und mit Code FA69EV neu anmelden.",
        text: "Playlist → mit Code anmelden → deine Tivim-Zugangsdaten. Nur wenn der Strom-Reset nicht geholfen hat."
      },
      {
        goal: "Immer noch tot? Support mit Foto schreiben."
      }
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
      {
        goal: "Router und Gerät 5 Minuten vom Strom.",
        text: "Beides wirklich aus der Steckdose. Danach wieder an, kurz warten, Pro öffnen."
      },
      {
        goal: "Tivim Pro wirklich beenden und neu öffnen.",
        text: "Zurück-Taste zweimal – App zu, dann wieder starten."
      },
      {
        goal: "Wiedergabeliste aktualisieren – nicht löschen.",
        taps: ["Einstellungen", "Wiedergabelisten", "Tivim", "Aktualisieren"]
      },
      {
        goal: "Immer noch tot? Erst dann Playlist löschen und neu anmelden.",
        taps: ["Einstellungen", "Wiedergabelisten", "Tivim", "Löschen"],
        text: "Zugangsdaten bereithalten. Löschen nur als letzter Schritt – sonst Chaos."
      },
      {
        goal: "Immer noch tot? Support mit Foto vom Bildschirm."
      }
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
      {
        goal: "Router und Gerät 5 Minuten vom Strom.",
        text: "Beides wirklich aus der Steckdose. Danach wieder an, kurz warten, XC öffnen."
      },
      {
        goal: "Tivim XC wirklich beenden und neu öffnen.",
        text: "Zurück-Taste zweimal – App zu, dann wieder starten."
      },
      {
        goal: "Update im Hauptmenü tippen.",
        taps: ["Hauptmenü rechts oben: Update (runde Pfeile)"]
      },
      {
        goal: "Immer noch tot? Sign out, dann neu Sign in.",
        text: "Settings → Sign out. App beenden. Daten sind meist noch da."
      },
      {
        goal: "Immer noch tot? Support mit Foto."
      }
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
    summary: "Sortieren, updaten, Favoriten – kurz erklärt.",
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
    cta: "Neue Inhalte"
  }
];
