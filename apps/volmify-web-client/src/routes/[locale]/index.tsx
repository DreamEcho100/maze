import { Link } from "@de100/i18n-solid-startjs/client/components/Link";
import { useRouter } from "@de100/i18n-solid-startjs/client/index";
import { useI18n } from "@de100/i18n-solidjs";
import { Title } from "@solidjs/meta";
import { For } from "solid-js";
import Counter from "#components/Counter";
import { allowedLocales } from "#libs/i18n/constants.ts";

export default function Home() {
	// const t = useTranslations();
	const { t, locale } = useI18n();
	const router = useRouter();

	return (
		<main>
			<Title>Hello World</Title>
			<h1>Hello world!</h1>
			<Counter />
			<p>
				Visit{" "}
				<a href="https://start.solidjs.com" target="_blank" rel="noopener">
					start.solidjs.com
				</a>{" "}
				to learn how to build SolidStart apps.
			</p>
			<br />
			<hr />
			<br />
			<div>
				<h1>{t("locale")}</h1>
				<p>{t("greetings", { lastLoginDate: new Date(), name: "John" })}</p>
				<p>Current locale: {locale()}</p>

				<Link href="/" locale="en">
					Switch to English
				</Link>
				<Link href="/" locale="ar">
					Switch to Arabic
				</Link>
				<select
					onChange={(e) => {
						// setLocale(e.target.value);
						router.push(`/${e.target.value}`, {
							replace: true,
							resolve: true,
							scroll: false,
							state: { locale: e.target.value },
						});
						// redirect(`/${e.target.value}`);
					}}
					value={locale()}
					// disabled={props.loading}
					// class={props.class}
				>
					<option value="" disabled>
						Select locale...
					</option>
					<For each={allowedLocales}>
						{(localeItem) => (
							<option value={localeItem}>
								{new Intl.DisplayNames([localeItem], { type: "language" }).of(localeItem) ??
									localeItem}
							</option>
						)}
					</For>
				</select>
			</div>
		</main>
	);
}
