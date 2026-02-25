"use client";

import React, { useState } from "react";
import {
  AceternitySidebarProvider,
  SidebarBody,
  SidebarLink,
} from "@/components/ui/aceternity-sidebar";
import {
  IconArrowLeft,
  IconBrandTabler,
  IconSettings,
  IconUserBolt,
} from "@tabler/icons-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export default function SidebarDemo() {
  const links = [
    {
      label: "Dashboard",
      href: "#",
      icon: <IconBrandTabler className="size-5" />,
    },
    {
      label: "Profile",
      href: "#",
      icon: <IconUserBolt className="size-5" />,
    },
    {
      label: "Settings",
      href: "#",
      icon: <IconSettings className="size-5" />,
    },
    {
      label: "Logout",
      href: "#",
      icon: <IconArrowLeft className="size-5" />,
    },
  ];

  const [open, setOpen] = useState(false);

  return (
    <AceternitySidebarProvider open={open} setOpen={setOpen}>
      <div className="flex min-h-screen w-full">
        <SidebarBody>
          <div className="flex flex-col gap-4 p-4">
          <div className="flex items-center gap-2 px-2">
            <LogoIcon />
            {open && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-semibold"
              >
                Acet Labs
              </motion.span>
            )}
          </div>
          <nav className="flex flex-col gap-1">
            {links.map((link, idx) => (
              <SidebarLink key={idx} link={link} />
            ))}
          </nav>
          </div>
        </SidebarBody>
        <main className="flex-1 p-8 pt-20 md:pt-8 md:ml-[72px] min-w-0">
          <Dashboard />
        </main>
      </div>
    </AceternitySidebarProvider>
  );
}

export const Logo = () => {
  return (
    <div className="flex items-center gap-2 font-semibold">
      <LogoIcon />
      <span>Acet Labs</span>
    </div>
  );
};

export const LogoIcon = () => {
  return (
    <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
      <IconBrandTabler className="size-4" />
    </div>
  );
};

const Dashboard = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo ao painel. Este é um exemplo do Sidebar Demo do Aceternity.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...new Array(4)].map((_, idx) => (
          <div
            key={idx}
            className={cn(
              "rounded-lg border border-border bg-card p-6 shadow-sm",
              "transition-colors hover:bg-accent/50"
            )}
          >
            <div className="h-16 rounded bg-muted" />
            <p className="mt-2 text-sm text-muted-foreground">Card {idx + 1}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[...new Array(2)].map((_, idx) => (
          <div
            key={idx}
            className={cn(
              "rounded-lg border border-border bg-card p-6 shadow-sm",
              "transition-colors hover:bg-accent/50"
            )}
          >
            <div className="h-32 rounded bg-muted" />
            <p className="mt-2 text-sm text-muted-foreground">
              Seção {idx + 1}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
