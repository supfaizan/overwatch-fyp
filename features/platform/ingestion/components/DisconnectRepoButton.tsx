"use client";

import { useState } from "react";
import { Loader2, Unplug } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useDisconnectRepo } from "../hooks";

/** Disconnect a repository and delete everything derived from it.
 *
 * Deliberately explicit about what disappears: this removes the copy of the
 * source code from the server as well as the graph, and it cannot be undone
 * without re-indexing. */
export function DisconnectRepoButton({ repoFullName }: { repoFullName: string }) {
  const [open, setOpen] = useState(false);
  const disconnect = useDisconnectRepo();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-critical hover:text-critical"
        >
          <Unplug className="size-4" /> DISCONNECT
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Disconnect {repoFullName}?</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2">
              <p>This deletes everything Overwatch holds for this repository:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>the architecture graph and everything in it</li>
                <li>the copy of your source code on the server</li>
                <li>the push webhook on GitHub</li>
              </ul>
              <p>
                Your repository on GitHub is untouched. Reconnecting later
                re-indexes it from scratch.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              CANCEL
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            disabled={disconnect.isPending}
            onClick={() =>
              disconnect.mutate(repoFullName, { onSuccess: () => setOpen(false) })
            }
          >
            {disconnect.isPending && <Loader2 className="size-4 animate-spin" />}
            DISCONNECT AND DELETE
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
