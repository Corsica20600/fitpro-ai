import { auth, signIn, signOut } from "@/auth";

export async function AccountPill() {
  const session = await auth().catch(() => null);
  const email = session?.user?.email ?? null;
  const name = session?.user?.name?.split(/\s+/)[0] ?? "Erwan";

  if (!email) {
    return (
      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/dashboard" });
        }}
      >
        <button type="submit" className="account-pill account-pill--login">
          Connexion Google
        </button>
      </form>
    );
  }

  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/dashboard" });
      }}
      className="account-pill-form"
    >
      <button type="submit" className="account-pill" title={email}>
        <span>{name}</span>
        <small>Google</small>
      </button>
    </form>
  );
}

