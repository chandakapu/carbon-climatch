"use client";

import ReactMarkdown from "react-markdown";

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

export default function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
    return (
        <div className={`text-slate-200 text-sm leading-relaxed ${className}`}>
            <ReactMarkdown
                components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                    em: ({ children }) => <em className="italic text-slate-100">{children}</em>,
                    ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="marker:text-emerald-400 text-slate-300">{children}</li>,
                    h1: ({ children }) => <h1 className="text-lg font-bold text-white mt-4 mb-2 first:mt-0">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-base font-semibold text-white mt-3 mb-2 first:mt-0">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-semibold text-white mt-2 mb-1 first:mt-0">{children}</h3>,
                    code: ({ children }) => (
                        <code className="bg-slate-900 border border-slate-700 px-1 py-0.5 rounded text-xs text-emerald-300 font-mono">
                            {children}
                        </code>
                    ),
                    pre: ({ children }) => (
                        <pre className="bg-slate-950 border border-slate-800 p-3 rounded-lg overflow-x-auto my-2 font-mono text-xs">
                            {children}
                        </pre>
                    ),
                    hr: () => <hr className="border-slate-800 my-4" />,
                    a: ({ href, children }) => (
                        <a
                            href={href}
                            className="text-emerald-400 hover:text-emerald-300 underline"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {children}
                        </a>
                    )
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
