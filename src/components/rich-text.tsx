import ReactMarkdown from "react-markdown";

/**
 * Texte enrichi (Markdown léger) : **gras**, *italique*, listes, liens.
 * Le HTML brut n'est jamais interprété ; les titres sont rendus comme du texte en gras.
 */
export function RichText({ children, className = "" }: { children: string; className?: string }) {
  return (
    <div className={`rich-text ${className}`}>
      <ReactMarkdown
        allowedElements={["p", "strong", "em", "ul", "ol", "li", "a", "br", "blockquote", "code", "del", "h1", "h2", "h3", "h4"]}
        unwrapDisallowed
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer nofollow">{children}</a>
          ),
          h1: ({ children }) => <p className="font-semibold text-zinc-100">{children}</p>,
          h2: ({ children }) => <p className="font-semibold text-zinc-100">{children}</p>,
          h3: ({ children }) => <p className="font-semibold text-zinc-100">{children}</p>,
          h4: ({ children }) => <p className="font-semibold text-zinc-100">{children}</p>,
        }}
      >
        {/* Les retours à la ligne simples sont conservés, comme dans l'ancien affichage */}
        {children.replace(/([^\n])\n(?!\n|\s*[-*+]\s|\s*\d+\.\s)/g, "$1  \n")}
      </ReactMarkdown>
    </div>
  );
}
