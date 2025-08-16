import { useRouter } from "@de100/i18n-solid-startjs/client";
import { Link } from "@de100/i18n-solid-startjs/client/components/Link";
import { useI18n, useTranslations } from "@de100/i18n-solidjs";
import { Title } from "@solidjs/meta";
import { revalidate } from "@solidjs/router";
import { useQuery } from "@tanstack/solid-query";
import {
	createEffect,
	createSignal,
	For,
	type ParentProps,
	resetErrorBoundaries,
} from "solid-js";
import Counter from "#components/Counter";
import { fetchPost, fetchUser } from "#libs/@tanstack/query/fake-api.ts";
import { QueryBoundary } from "#libs/@tanstack/query/query-boundry.tsx";
import ForgotPasswordPage from "#libs/auth/client/components/forgot-password/page.jsx";
import { getCurrentSession } from "#libs/auth/server/queries.js";
import { allowedLocales } from "#libs/i18n/constants.ts";
import { cookieManager } from "#libs/js-cookies/index.ts";

// async function testFn() {
// 	"use server";
// 	try {
// 		console.log("*** 1");
// 		return await Promise.resolve("lol").then((session) => {
// 			const isServer = typeof window === "undefined";
// 			console.log("*** isServer:", isServer);
// 			console.log("*** session:", session);
// 			return session;
// 		});
// 	} catch (error) {
// 		console.error("*** error", error);
// 	}
// }

export default function Home() {
	const t = useTranslations();
	const { locale } = useI18n();
	// const t = useTranslations();
	const router = useRouter();

	return (
		<main>
			<ForgotPasswordPage />
			<Title>Hello World</Title>
			<h1>Hello world!</h1>
			{/* <User /> */}
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

				<Link
					href="/"
					locale="en"
					onMouseEnter={() => {
						cookieManager.setCookie("forced-locale", "en", {
							path: "/",
							sameSite: "lax",
						});
					}}
					onMouseLeave={() => {
						cookieManager.deleteCookie("forced-locale", {
							path: "/",
							sameSite: "lax",
						});
					}}
				>
					Switch to English
				</Link>
				<Link
					href="/"
					locale="ar"
					onMouseEnter={() => {
						cookieManager.setCookie("forced-locale", "ar", {
							path: "/",
							sameSite: "lax",
						});
					}}
					onMouseLeave={() => {
						cookieManager.deleteCookie("forced-locale", {
							path: "/",
							sameSite: "lax",
						});
					}}
				>
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
								{new Intl.DisplayNames([localeItem], { type: "language" }).of(
									localeItem,
								) ?? localeItem}
							</option>
						)}
					</For>
				</select>
			</div>
			<br />
			<hr />
			<br />
			<h2>Example - Post Viewer</h2>
			<PostViewer sleep={1000} simulateError={false} />
			<hr />
			<h2>Example - Post Viewer with deferStream</h2>
			<PostViewer
				deferStream
				sleep={1000}
				simulateError={false}
				initialPage={2}
			/>
			<hr />
			<h2>Example - Post Viewer with deferStream and simulateError</h2>
			<PostViewer deferStream sleep={1000} simulateError initialPage={2} />
			<hr />
		</main>
	);
}

/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/

/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/

/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/

/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/

/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/

/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/

/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/

/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/

/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/

/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/

/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/

/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/

/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/

/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/

/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/

/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/
/***************************** *****************************/

interface PostViewerProps {
	deferStream?: boolean;
	sleep?: number;
	simulateError?: boolean;
	initialPage?: number;
}

interface ExampleProps {
	title: string;
	deferStream?: boolean;
	sleep?: number;
}

function Example(props: ParentProps<ExampleProps>) {
	return (
		<div class="example">
			<div class="example__header">
				<div class="example__title">{props.title}</div>
				<div>[deferStream={String(props.deferStream || false)}]</div>
				<div style={{ "margin-left": "10px" }}>
					[simulated sleep: {props.sleep || 0}ms]
				</div>
			</div>

			{props.children}
		</div>
	);
}

function PostViewer(props: ParentProps<PostViewerProps>) {
	const [simulateError, setSimulateError] = createSignal(props.simulateError);
	const [postId, setPostId] = createSignal(props.initialPage ?? 1);

	const query = useQuery(() => ({
		queryKey: [
			"posts",
			postId(),
			{
				sleep: props.sleep,
				simulateError:
					simulateError() || (simulateError() !== false && postId() === 5),
			},
		] as const,
		queryFn: ({ queryKey }) =>
			fetchPost({
				postId: queryKey[1],
				sleep: queryKey[2].sleep,
				simulateError: queryKey[2].simulateError,
			}),
		deferStream: props.deferStream,
		throwOnError: true,
	}));

	return (
		<Example
			title="Post Query"
			deferStream={props.deferStream}
			sleep={props.sleep}
		>
			<div style={{ "margin-top": "20px" }}>
				<button
					type="button"
					onClick={() => {
						setPostId(Math.max(postId() - 1, 1));
						resetErrorBoundaries();
					}}
				>
					Previous Post
				</button>
				<button
					type="button"
					onClick={() => {
						setPostId(Math.min(postId() + 1, 100));
						resetErrorBoundaries();
					}}
				>
					Next Post
				</button>
			</div>

			<QueryBoundary
				query={query}
				loadingFallback={<div class="loader">loading post...</div>}
				errorFallback={(err, retry) => (
					<div>
						<div class="error">{err.message}</div>
						<button
							type="button"
							disabled={query.isRefetching || query.isSuccess}
							onClick={() => {
								setSimulateError(false);
								retry();
							}}
						>
							retry
						</button>
					</div>
				)}
			>
				{(posts) => (
					<For each={posts}>
						{(post) => (
							<div style={{ "margin-top": "20px" }}>
								<b>
									[post {postId()}] {post.title}
								</b>
								<p>{post.body}</p>
							</div>
						)}
					</For>
				)}
			</QueryBoundary>
		</Example>
	);
}

export interface UserInfoProps {
	deferStream?: boolean;
	sleep?: number;
	simulateError?: boolean;
	staleTime?: number;
	gcTime?: number;
}

export function userInfoQueryOpts(props?: UserInfoProps) {
	return {
		queryKey: ["user"],
		queryFn: () => fetchUser(props),
		deferStream: props?.deferStream,
		staleTime: props?.staleTime,
		gcTime: props?.gcTime,
		throwOnError: true,
	};
}

export function UserInfo(props: UserInfoProps) {
	const [simulateError, setSimulateError] = createSignal(props.simulateError);

	const query = useQuery(() =>
		userInfoQueryOpts({ ...props, simulateError: simulateError() }),
	);

	return (
		<Example
			title="User Query"
			deferStream={props.deferStream}
			sleep={props.sleep}
		>
			<QueryBoundary
				query={query}
				loadingFallback={<div class="loader">loading user...</div>}
				errorFallback={(err, retry) => (
					<div>
						<div class="error">{err.message}</div>
						<button
							type="button"
							disabled={query.isRefetching || query.isSuccess}
							onClick={() => {
								setSimulateError(false);
								retry();
							}}
						>
							retry
						</button>
					</div>
				)}
			>
				{(user) => (
					<>
						<div>id: {user.id}</div>
						<div>name: {user.name}</div>
						<div>queryTime: {user.queryTime}</div>
						<button
							type="button"
							onClick={() => {
								query.refetch();
							}}
						>
							refetch
						</button>
					</>
				)}
			</QueryBoundary>
		</Example>
	);
}
