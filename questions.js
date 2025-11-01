// questions.js
// 3 Platzhalterfragen, je 5 Hinweise, numerische Antworten (für "nächste Antwort gewinnt")
export const QUESTIONS = [
  {
    id: "q1",
    type: "number",
    question: "Wie viele Stufen hat der Eiffelturm (offiziell begehbar)?",
    answer: 1665,
    unit: "",
    hints: [
      "Es ist eine konkrete Anzahl (keine Spanne).",
      "Die Zahl liegt deutlich über 1000.",
      "Eine ungerade Zahl.",
      "Zwischen 1600 und 1700.",
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
      "20. Jahrhundert.",
      "Vor 1980.",
      "Frühe 1970er.",
      "ARPANET spielte eine Rolle.",
      "Endet auf '71'."
    ]
  },
  {
    id: "q3",
    type: "bigNumber",
    question: "Wie viele Sandkörner befinden sich grob in 1 m³ trockenem Sand?",
    answer: 1000000000, // 1 Milliarde
    unit: "",
    hints: [
      "Sehr große Zahl.",
      "Größenordnung: hunderte Millionen bis wenige Milliarden.",
      "Zehn Stellen.",
      "Näher an 1 Mrd. als an 500 Mio.",
      "Runde Zahl mit vielen Nullen."
    ]
  }
];

// Weitere Fragen einfach anhängen:
// {
//   id: "q4",
//   type: "number|year|bigNumber",
//   question: "Deine Frage …",
//   answer: 123456,
//   unit: "",
//   hints: ["H1","H2","H3","H4","H5"]
// }
