"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import { AFTER_LOGIN, AFTER_REGISTER } from "@/constants";
import { login, register } from "../api";

export function useLogin() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setAuth(data);
      toast.success(`Welcome back, ${data.user.name}`);
      router.push(AFTER_LOGIN);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useRegister() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: register,
    onSuccess: (data) => {
      setAuth(data);
      toast.success("Account created — let's connect a repository");
      router.push(AFTER_REGISTER);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
