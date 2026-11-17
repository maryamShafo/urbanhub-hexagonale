/** L'erreur du coupe-circuit (TP 4) quand il refuse l'appel sans toucher le reseau. */
export class CircuitOuvert extends Error {
  constructor(message = "circuit ouvert") {
    super(message);
    this.name = "CircuitOuvert";
  }
}
