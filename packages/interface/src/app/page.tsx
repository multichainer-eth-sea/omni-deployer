import { CreateTokenForm } from "@/components/create-token/create-token-form";

export default function Home() {
  return (
    <div className="container mx-auto mt-16 max-w-md">
      <div className="w-full flex-col gap-8">
        <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight lg:text-4xl">
          Create Token
        </h1>
        <CreateTokenForm />
      </div>
    </div>
  );
}
