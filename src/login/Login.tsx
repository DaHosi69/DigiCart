import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();


  
  const onLogin = async () => {
    setError(null);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
      return;
    }
    console.log("Login erfolgreich:", data);
    navigate("/home"); 
  };

  const onSignUp = async () => {
    setError(null);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return setError(error.message);
    // Profil direkt anlegen (client-seitig ok, RLS erlaubt "self upsert")
    await supabase.from("profiles").upsert({
      auth_user_id: data.user?.id,
      display_name: email.split("@")[0],
    });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 
             bg-gradient-to-t from-white to-gray-500
             dark:bg-gradient-to-t dark:from-zinc-900 dark:to-zinc-700
             transition-colors duration-500"
    >
      <Card
        className="w-full max-w-sm rounded-2xl shadow-xl border border-white/20 
                   bg-white/70 dark:bg-zinc-800/70 backdrop-blur-md"
      >
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold text-gray-800 dark:text-white">
            Willkommen zurück
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Melde dich an, um fortzufahren
          </p>
          <img src="/DigiCartBW.svg"/>
        </CardHeader>

        <CardContent className="space-y-4">
          <Input
            placeholder="E-Mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-white/80 dark:bg-zinc-900/50 border-gray-300 dark:border-zinc-600
                   text-gray-800 dark:text-white placeholder:text-gray-400 
                   dark:placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500"
          />
          <Input
            placeholder="Passwort"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-white/80 dark:bg-zinc-900/50 border-gray-300 dark:border-zinc-600
                   text-gray-800 dark:text-white placeholder:text-gray-400 
                   dark:placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500"
          />

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl 
               shadow-md transition-transform hover:scale-[1.02]"
              onClick={onLogin}
            >
              Login
            </Button>
            <Button
              className="w-full bg-gray-300 hover:bg-gray-400 text-gray-900 
               dark:bg-zinc-700 dark:hover:bg-zinc-600 dark:text-white 
               rounded-xl transition-transform hover:scale-[1.02]"
              onClick={onSignUp}
            >
              Registrieren
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
