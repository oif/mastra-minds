// Example helper script
// Agents can execute this for deterministic operations

export function greet(name: string): string {
  return `Hello, ${name}! This is from the example skill.`;
}

// CLI usage
if (import.meta.main) {
  const name = Bun.argv[2] || "World";
  console.log(greet(name));
}
