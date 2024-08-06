import { CreateTokenForm } from "@/components/create-token/create-token-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="container mx-auto mt-16 max-w-md">
      <Card className="w-full flex-col gap-8">
        <CardHeader>
          <CardTitle>Create Token</CardTitle>
          <CardDescription>Create your OFT Seamlessly</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateTokenForm />
        </CardContent>
      </Card>
    </div>
  );
}
