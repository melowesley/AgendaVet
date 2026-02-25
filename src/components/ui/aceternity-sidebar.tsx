"use client";

import { cn } from "@/lib/utils";
import React, { useState, createContext, useContext, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { IconMenu2, IconX } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import { useOutsideClick } from "@/hooks/use-outside-click";

export interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

export const useAceternitySidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useAceternitySidebar must be used within a AceternitySidebarProvider");
  }
  return context;
};

export const AceternitySidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const AceternitySidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarContext.Provider
      value={{
        open: open ?? false,
        setOpen: setOpen ?? (() => {}),
        animate: animate ?? true,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const SidebarBody = ({
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props}>{children}</DesktopSidebar>
      <MobileSidebar {...props}>{children}</MobileSidebar>
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.aside>) => {
  const { open, setOpen } = useAceternitySidebar();
  return (
    <motion.aside
      data-open={open}
      className={cn(
        "hidden md:flex fixed top-0 left-0 z-40 h-screen flex-col border-r border-border bg-background",
        "transition-[width] duration-200 ease-in-out",
        open ? "w-64" : "w-[72px]",
        className
      )}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </motion.aside>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useAceternitySidebar();
  const panelRef = useRef<HTMLDivElement>(null);
  const handleClose = useCallback(() => setOpen(false), [setOpen]);
  useOutsideClick(panelRef, handleClose);

  return (
    <>
      <div
        className={cn(
          "flex md:hidden fixed top-0 left-0 z-50 h-14 w-full items-center border-b border-border bg-background px-4",
          className
        )}
        {...props}
      >
        <button
          onClick={() => setOpen(!open)}
          className="p-2 rounded-md hover:bg-accent"
          aria-label="Toggle menu"
        >
          <IconMenu2 className="size-5" />
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
            />
            <motion.div
              ref={panelRef}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={cn(
                "fixed top-0 left-0 z-50 h-full w-64 border-r border-border bg-background p-4 md:hidden",
                className
              )}
            >
              <button
                onClick={() => setOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-md hover:bg-accent"
                aria-label="Close menu"
              >
                <IconX className="size-5" />
              </button>
              <div className="mt-12">{children}</div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
} & React.ComponentProps<typeof Link>) => {
  const { open, animate } = useAceternitySidebar();
  return (
    <Link
      to={link.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
        "text-foreground",
        className
      )}
      {...props}
    >
      <span className="flex shrink-0 [&>svg]:size-5">{link.icon}</span>
      <AnimatePresence initial={false}>
        {open && (
          <motion.span
            initial={animate ? { opacity: 0, width: 0 } : false}
            animate={animate ? { opacity: 1, width: "auto" } : false}
            exit={animate ? { opacity: 0, width: 0 } : false}
            transition={{ duration: 0.2 }}
            className="overflow-hidden whitespace-nowrap"
          >
            {link.label}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
};

export const SidebarButton = ({
  label,
  icon,
  onClick,
  className,
}: {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) => {
  const { open, animate } = useAceternitySidebar();
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        "text-foreground hover:bg-accent hover:text-accent-foreground",
        className
      )}
    >
      <span className="flex shrink-0 [&>svg]:size-5">{icon}</span>
      <AnimatePresence initial={false}>
        {open && (
          <motion.span
            initial={animate ? { opacity: 0, width: 0 } : false}
            animate={animate ? { opacity: 1, width: "auto" } : false}
            exit={animate ? { opacity: 0, width: 0 } : false}
            transition={{ duration: 0.2 }}
            className="overflow-hidden whitespace-nowrap text-left"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
};
