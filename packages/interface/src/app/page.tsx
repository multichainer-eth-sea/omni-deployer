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
    <div className="container mx-auto mt-16">
      <CreateTokenForm />
    </div>
  );
}
