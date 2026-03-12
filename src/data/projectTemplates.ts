/**
 * projectTemplates — Sprint C
 *
 * Static project starter templates for the NewProjectV2 manual creation path.
 * These are minimal starters that pre-fill the project title and display
 * a suggested phase structure to help users understand what the project involves.
 *
 * IMPORTANT:
 * - No database changes: templates only pre-fill form fields
 * - Source-offer model remains the primary/recommended path
 * - This is a secondary helper for direct/manual project creation
 */

export interface ProjectTemplatePhase {
  /** Short phase label shown to the user */
  name: string;
}

export interface ProjectTemplate {
  id: string;
  /** Suggested project title inserted into the form */
  titleSuggestion: string;
  /** One-line description of what this template covers */
  description: string;
  /** Who should use this template */
  bestFor: string;
  /** Approximate calendar duration */
  estimatedDuration: string;
  /** Ordered list of typical project phases */
  phases: ProjectTemplatePhase[];
}

export const projectTemplates: ProjectTemplate[] = [
  {
    id: 'remont-lazienki',
    titleSuggestion: 'Remont łazienki',
    description: 'Kompleksowy remont łazienki z wymianą płytek i sanitariatów',
    bestFor: 'Remont łazienki z hydrauliką, glazurą i wykończeniem',
    estimatedDuration: '2–4 tygodnie',
    phases: [
      { name: 'Prace rozbiórkowe i przygotowanie' },
      { name: 'Hydraulika i instalacje' },
      { name: 'Elektryka w łazience' },
      { name: 'Glazura i terakota' },
      { name: 'Montaż sanitariatów i armatury' },
      { name: 'Wykończenie i odbiór' },
    ],
  },
  {
    id: 'malowanie-mieszkania',
    titleSuggestion: 'Malowanie mieszkania',
    description: 'Malowanie ścian i sufitów z gładziami i gruntowaniem',
    bestFor: 'Malowanie całego mieszkania lub wybranych pomieszczeń',
    estimatedDuration: '3–7 dni roboczych',
    phases: [
      { name: 'Przygotowanie pomieszczeń i zabezpieczenie' },
      { name: 'Gładzie i gruntowanie' },
      { name: 'Malowanie ścian' },
      { name: 'Malowanie sufitów' },
      { name: 'Wykończenie i sprzątanie' },
    ],
  },
  {
    id: 'instalacja-elektryczna',
    titleSuggestion: 'Instalacja elektryczna',
    description: 'Nowa instalacja elektryczna lub modernizacja rozdzielnicy',
    bestFor: 'Elektryka w mieszkaniu lub domu jednorodzinnym',
    estimatedDuration: '3–7 dni roboczych',
    phases: [
      { name: 'Projekt instalacji i rozdzielnica' },
      { name: 'Kucie bruzd i prowadzenie przewodów' },
      { name: 'Montaż gniazd, włączników i opraw' },
      { name: 'Podłączenie rozdzielnicy' },
      { name: 'Pomiary elektryczne i protokół odbioru' },
    ],
  },
  {
    id: 'remont-dachu',
    titleSuggestion: 'Remont dachu',
    description: 'Wymiana pokrycia dachowego, rynien i obróbek blacharskich',
    bestFor: 'Wymiana lub naprawa pokrycia dachowego i odwodnienia',
    estimatedDuration: '1–2 tygodnie',
    phases: [
      { name: 'Przygotowanie i montaż rusztowania' },
      { name: 'Rozebranie starego pokrycia' },
      { name: 'Naprawa więźby i impregnacja' },
      { name: 'Nowe pokrycie dachowe' },
      { name: 'Rynny, rury spustowe i obróbki' },
      { name: 'Demontaż rusztowania i porządkowanie' },
    ],
  },
  {
    id: 'remont-generalny',
    titleSuggestion: 'Remont generalny mieszkania',
    description: 'Kompleksowy remont całego mieszkania od rozbiórek po wykończenie',
    bestFor: 'Pełny remont mieszkania z wieloma branżami',
    estimatedDuration: '4–12 tygodni',
    phases: [
      { name: 'Projekt i zamówienie materiałów' },
      { name: 'Prace rozbiórkowe' },
      { name: 'Tynki, wylewki i ściany' },
      { name: 'Instalacje elektryczne' },
      { name: 'Instalacje hydrauliczne' },
      { name: 'Podłogi' },
      { name: 'Wykończenie ścian i sufitów' },
      { name: 'Montaż stolarki i wyposażenia' },
      { name: 'Sprzątanie i odbiór końcowy' },
    ],
  },
];
