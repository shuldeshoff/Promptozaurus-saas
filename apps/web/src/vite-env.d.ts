/// <reference types="vite/client" />

declare namespace NodeJS {
  type Timeout = number;
}

declare module '*.css' {
  const content: string;
  export default content;
}

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // Add more env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

