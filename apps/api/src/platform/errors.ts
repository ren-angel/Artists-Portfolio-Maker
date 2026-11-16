export class Fault extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}
export function assert(
  condition: unknown,
  status: number,
  code: string,
): asserts condition {
  if (!condition) throw new Fault(status, code);
}
