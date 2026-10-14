/** Cancellation is advisory; a captured epoch must also match before publishing. */
export class RequestEpoch {
  private controller = new AbortController();
  private revision = 0;

  get current() { return this.revision; }
  get signal() { return this.controller.signal; }

  advance() {
    this.controller.abort();
    this.controller = new AbortController();
    this.revision += 1;
    return this.capture();
  }

  capture() {
    const revision = this.revision;
    const signal = this.controller.signal;
    return { revision, signal, isCurrent: () => this.revision === revision && !signal.aborted };
  }
}
