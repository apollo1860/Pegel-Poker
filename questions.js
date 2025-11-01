// questions.js
// Exportiere ein Array numerischer Fragen. Jede Frage hat 5 Hinweise.
export const QUESTIONS = [
  {
    id: "q1",
    type: "number",                 // number | year | bigNumber (rein kosmetisch – Auswertung ist numerisch)
    question: "Wie viele Stufen hat der Eiffelturm (offiziell begehbar)?",
    answer: 1665,                   // numerische richtige Antwort
    unit: "",                       // optional
    hints: [
      "Es geht um eine konkrete Anzahl – keine Schätzung mit 'ungefähr'.",
      "Die Zahl liegt deutlich über 1000.",
      "Es ist eine ungerade Zahl.",
      "Sie liegt zwischen 1600 und 1700.",
      "Die letzten beiden Ziffern sind '65'."
    ]
  },
  {
    id: "q2",
    type: "year",
    question: "In welchem Jahr wurde die erste E-Mail der Welt verschickt?",
    answer: 1971,
    unit: "",
    hints: [
      "Es ist im 20. Jahrhundert passiert.",
      "Vor 1980.",
      "In den frühen 1970ern.",
      "Gleichzeitig war ARPANET ein Thema.",
      "Die Jahreszahl endet auf '71'."
    ]
  },
  {
    id: "q3",
    type: "bigNumber",
    question: "Wie viele Sandkörner befinden sich grob in 1 Kubikmeter trockenem Sand?",
    answer: 1000000000, // 1 Milliarde – sehr große Zahl
    unit: "",
    hints: [
      "Es ist eine sehr große Zahl.",
      "Größenordnung: hunderte Millionen bis wenige Milliarden.",
      "Die Zahl hat 10 Stellen.",
      "Es ist näher an 1 Milliarde als an 500 Millionen.",
      "Runde Zahl mit vielen Nullen."
    ]
  }
];

// ⚠️ Du kannst eigene Fragen hinzufügen oder bestehende anpassen.
//   Achte darauf, dass `answer` numerisch ist. Hints: exakt 5 Strings pro Frage.
