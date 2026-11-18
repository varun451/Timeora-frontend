import AuthForm from "@/components/store/AuthForm";

export const metadata = { title: "Create an account" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const query = await searchParams;
  const next = Array.isArray(query.next) ? query.next[0] : query.next;
  return <AuthForm mode="register" next={next} />;
}
