"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { registerSchema, type RegisterInput } from "../schemas";
import { useRegister } from "../hooks";
import { GithubButton } from "./GithubButton";

export function RegisterForm() {
  const register = useRegister();
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = (values: RegisterInput) => register.mutate(values);

  return (
    <div className="space-y-5">
      <GithubButton
        label="Sign up with GitHub"
        loading={register.isPending}
        onClick={() =>
          register.mutate({
            name: "Octocat",
            email: "octocat@github.com",
            password: "gh-oauth",
          })
        }
      />

      <div className="flex items-center gap-3">
        <Separator className="flex-1 bg-line-1" />
        <span className="ow-mono-micro text-text-dim">OR</span>
        <Separator className="flex-1 bg-line-1" />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="ow-mono-micro text-text-lo">
                  FULL NAME
                </FormLabel>
                <FormControl>
                  <Input placeholder="Ada Lovelace" autoComplete="name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="ow-mono-micro text-text-lo">
                  EMAIL
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@team.dev"
                    autoComplete="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="ow-mono-micro text-text-lo">
                  PASSWORD
                </FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            disabled={register.isPending}
            className="w-full font-mono text-[12px] tracking-wide"
          >
            {register.isPending && <Loader2 className="size-4 animate-spin" />}
            CREATE ACCOUNT
          </Button>
        </form>
      </Form>
    </div>
  );
}
