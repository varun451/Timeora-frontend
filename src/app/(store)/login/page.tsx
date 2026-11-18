import AuthForm from "@/components/store/AuthForm";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const query = await searchParams;
  const next = Array.isArray(query.next) ? query.next[0] : query.next;
  return <AuthForm mode="login" next={next} />;
}
