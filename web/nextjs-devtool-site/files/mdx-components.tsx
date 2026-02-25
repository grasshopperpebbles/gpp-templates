import type { MDXComponents } from "mdx/types";
import { CodeBlock } from "@/components/CodeBlock";
import React from "react";

interface CodeElementProps {
  className?: string;
  children?: string;
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    pre: ({ children }) => {
      // Extract code content and language from the nested code element
      const codeElement = children as React.ReactElement<CodeElementProps>;
      const className = codeElement?.props?.className || "";
      const language = className.replace(/language-/, "") || "text";
      const code = codeElement?.props?.children || "";

      return <CodeBlock code={code} language={language} />;
    },
    ...components,
  };
}
