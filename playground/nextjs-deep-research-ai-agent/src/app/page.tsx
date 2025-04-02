import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-start gap-8 py-16">
      <div className="fixed top-0 left-0 -z-10 size-full bg-black/30 object-cover">
        <Image
          src="/images/background.jpg"
          alt="Deep Research AI Agent"
          className="size-full object-cover opacity-50"
          fill
        />
      </div>

      <div className="flex flex-col items-center gap-4 drop-shadow-xl">
        <h1 className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text font-dancing-script text-5xl font-bold text-transparent italic sm:text-8xl">
          Deep Research
        </h1>
        <p className="max-w-[90vw] text-center text-gray-600 sm:max-w-[50vw]">
          Enter a topic and answer a few questions to generate a comprehensive
          research report.
        </p>
      </div>

      {/* <UserInput />
      <QnA /> */}
    </main>
  );
}
