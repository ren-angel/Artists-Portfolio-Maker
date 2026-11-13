import tseslint from "typescript-eslint";
export default tseslint.config(
  { ignores: ["**/.next/**", "**/dist/**", "Design/**"] },
  ...tseslint.configs.recommended,
);
