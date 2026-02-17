import { Link } from "react-router-dom";
import { AppPageShell } from "@/components/app-page-shell";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { Highlighter } from "@/components/ui/highlighter";
import { TextAnimateRotator } from "@/components/ui/text-animate-rotator";
import { useTranslation } from "@/lib/i18n/client";

export function HomePage() {
  const { t } = useTranslation();
  return (
    <AppPageShell
      title={t("home.title")}
      description={t("home.description")}
      pattern>
      <div className="flex items-start justify-center pt-6 px-4">
        <div className="max-w-full">
          <div
            className={cn(
              "group inline-block max-w-full rounded-full border border-black/5 bg-neutral-100 text-base text-white transition-all ease-in hover:cursor-pointer hover:bg-neutral-200",
              "dark:border-white/5 dark:bg-neutral-900 dark:hover:bg-neutral-800",
            )}>
            <AnimatedShinyText className="inline-block px-4 py-1 text-center transition-colors ease-out hover:text-neutral-600 hover:duration-300 hover:dark:text-neutral-400 whitespace-normal 2xl:whitespace-nowrap max-w-full 2xl:max-w-none break-words">
              <span>{t("home.banner")}</span>
            </AnimatedShinyText>
          </div>
        </div>
      </div>
      <section className="mx-auto mt-8 max-w-6xl px-4 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
          <span aria-hidden>⚡</span>
          <br />
          {t("home.editWord")}{" "}
          <Highlighter action="underline" color="currentColor">
            <span className="inline-block mx-2 text-black dark:text-white leading-tight">
              <TextAnimateRotator
                words={[
                  t("home.rotator.money"),
                  t("home.rotator.npcs"),
                  t("home.rotator.levels"),
                  t("home.rotator.days"),
                  t("home.rotator.upgrades"),
                  t("home.rotator.researches"),
                ]}
                interval={2000}
                className="leading-tight"
                animation="blurInUp"
              />
            </span>
          </Highlighter>{" "}
          {t("home.atWarpSpeed")}
        </h1>
        <p className="text-muted-foreground mx-auto mt-4 max-w-3xl text-lg sm:text-xl">
          {t("home.subtitle")}
        </p>
        <p className="text-muted-foreground mt-2 text-base sm:text-lg">
          {t("home.tagline")}
        </p>
        <p className="mt-2 text-base sm:text-lg font-medium">{t("home.cta")}</p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <RainbowButton asChild size="lg" className="rounded-lg">
            <Link to="/saves">
              <span className="font-semibold">{t("home.goToSaves")}</span>
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </RainbowButton>
        </div>
      </section>
    </AppPageShell>
  );
}
