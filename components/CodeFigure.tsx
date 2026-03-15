"use client";

import { type ComponentPropsWithoutRef, useEffect, useRef, useState } from "react";

type FigureProps = ComponentPropsWithoutRef<"figure">;
const MIN_COPY_BUTTON_HEIGHT = 96;

export const CodeFigure = ({ children, ...props }: FigureProps) => {
  const figureRef = useRef<HTMLElement>(null);
  const [copyableCode, setCopyableCode] = useState<string | null>(null);
  const [showCopyButton, setShowCopyButton] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const figure = figureRef.current;

    if (!figure || props["data-rehype-pretty-code-figure"] === undefined) {
      setCopyableCode(null);
      setShowCopyButton(false);
      return;
    }

    const codeElement = figure.querySelector("code[data-language]");
    const preElement = figure.querySelector("pre");
    const language = codeElement?.getAttribute("data-language");

    if (!codeElement || !preElement || language === "plaintext") {
      setCopyableCode(null);
      setShowCopyButton(false);
      return;
    }

    setCopyableCode(codeElement.textContent ?? null);

    const updateVisibility = () => {
      setShowCopyButton(preElement.clientHeight >= MIN_COPY_BUTTON_HEIGHT);
    };

    updateVisibility();

    const resizeObserver = new ResizeObserver(updateVisibility);
    resizeObserver.observe(preElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [children, props]);

  const handleCopy = async () => {
    if (!copyableCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(copyableCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <figure ref={figureRef} {...props}>
      {children}
      {copyableCode && showCopyButton ? (
        <button
          type="button"
          className="code-copy-button"
          onClick={handleCopy}
          aria-label={copied ? "Code copied" : "Copy code"}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      ) : null}
    </figure>
  );
};
