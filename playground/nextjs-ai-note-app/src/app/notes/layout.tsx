import NavBar from "./_components/nav-bar";

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<NavBar />
			<main className="m-auto max-w-7xl p-4">{children}</main>
		</>
	);
}
