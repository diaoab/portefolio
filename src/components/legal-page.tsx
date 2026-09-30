import { RichText } from "./rich-text";
import { SiteFooter, SiteHeader } from "./site-header";

export function LegalPage({ title, content }: { title: string; content: string }) {
  return (
    <>
      <SiteHeader />
      <main className="container-page max-w-3xl py-14">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        <RichText className="mt-8">{content}</RichText>
      </main>
      <SiteFooter />
    </>
  );
}
