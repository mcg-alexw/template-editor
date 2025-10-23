declare module "*.html?raw" {
  const content: string;
  export default content;
}
declare module "*.css";
declare module "react-color-palette";
declare module "@tiptap/react";
declare module "@tiptap/starter-kit";
declare module "@tiptap/extension-text-style";
declare module "@tiptap/extension-color";
declare module "@tiptap/extension-highlight";

declare global {
  interface Window {
    __BUILD_INFO__?: { buildNumber?: string; version?: string };
  }
}

export {};
