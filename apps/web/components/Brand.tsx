export function Brand({ name }: { name: string }) {
  return (
    <a href="/" className="brand">
      <span aria-hidden="true" className="mark">
        ✦
      </span>
      {name}
    </a>
  );
}
