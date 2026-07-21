"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Link2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { connectRepoSchema, type ConnectRepoInput } from "../schemas";
import { useConnectRepo } from "../hooks";
import { PROVIDERS } from "../static";

export function ConnectForm() {
  const connect = useConnectRepo();
  const form = useForm<ConnectRepoInput>({
    resolver: zodResolver(connectRepoSchema),
    defaultValues: { url: "" },
  });

  return (
    <div className="space-y-5">
      <Tabs defaultValue="github">
        <TabsList className="w-full bg-surface-1">
          {PROVIDERS.map((p) => (
            <TabsTrigger
              key={p.id}
              value={p.id}
              className="flex-1 font-mono text-[11px] tracking-wide data-[state=active]:bg-surface-3"
            >
              {p.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((v) => connect.mutate(v))}
          className="space-y-3"
        >
          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <Link2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-lo" />
                    <Input
                      placeholder="https://github.com/your-org/your-repo"
                      className="pl-9 font-mono text-[13px]"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            disabled={connect.isPending}
            className="w-full font-mono text-[12px] tracking-wide"
          >
            {connect.isPending && <Loader2 className="size-4 animate-spin" />}
            CONNECT & INDEX REPOSITORY
          </Button>
        </form>
      </Form>

      <p className="ow-mono-micro text-text-dim">
        FULL INDEX ON FIRST CONNECT · INCREMENTAL ON EVERY PUSH
      </p>
    </div>
  );
}
