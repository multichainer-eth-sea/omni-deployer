import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function Home() {
  return (
    <div className="container mx-auto mt-16 max-w-sm">
      <div className="flex flex-col gap-8">
        <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight lg:text-4xl">
          Create Token
        </h1>
        <Button>Click Me</Button>
      </div>
    </div>
  );
}
