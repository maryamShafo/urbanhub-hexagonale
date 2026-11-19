/** L'erreur du coupe-circuit : il refuse l'appel sans toucher le réseau. */
export class CircuitOuvert extends Error {
  constructor(message = "circuit ouvert") {
    super(message);
    this.name = "CircuitOuvert";
  }
}