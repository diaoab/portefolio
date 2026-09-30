"use client";

import Script from "next/script";
import { useLocale } from "./i18n-provider";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/** Captcha invisible Cloudflare Turnstile, affiché seulement s'il est configuré. */
export function Turnstile() {
  const locale = useLocale();
  if (!SITE_KEY) return null;
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      <div className="cf-turnstile" data-sitekey={SITE_KEY} data-language={locale} data-theme="auto" data-size="flexible" />
    </>
  );
}
